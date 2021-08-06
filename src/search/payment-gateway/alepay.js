import axios from 'axios';
import Crypto from 'crypto';
import BaseError from '../../commons/utils/base-error';
import errorCode from '../../commons/utils/error-code';
import RSA from '../../commons/utils/rsa';

export const URLs = {
  requestPayment: '/checkout/v1/request-order',
  calculateFee: '/checkout/v1/calculate-fee',
  getTransactionInfo: '/checkout/v1/get-transaction-info',
  requestCardLink: '/checkout/v1/request-profile',
  tokenizationPayment: '/checkout/v1/request-tokenization-payment',
  tokenizationPaymentDomestic: '/checkout/v1/request-tokenization-payment-domestic',
  cancelCardLink: '/checkout/v1/cancel-profile',
  requestCardLinkDomestic: '/alepay-card-domestic/request-profile',
  getTransactionHistory: '/checkout/v1/get-transaction-history',
  getBanksDomestic: '/checkout/v1/get-banks-domestic'
};

/**
 *  @typedef AlePayResponse
 *  @type {{
 *  errorCode: number | string,
 *  errorDescription: string,
 *  data: string,
 *  checksum: string
 * }}
 *
 */

/**
 *  @typedef ConstructorParams
 *  @type {{
 *  baseUrl: string,
 *  returnUrl: string,
 *  cancelUrl: string,
 *  token: string,
 *  checksum: string,
 *  encryptedKey: string
 * }}
 *
 */

export class AlePay {
  /**
   * Creates an instance of AlePay.
   *
   * @param {ConstructorParams} params
   * @memberof AlePay
   */
  constructor(params) {
    params.encryptedKey =
      `-----BEGIN PUBLIC KEY-----\n` + params.encryptedKey + `\n-----END PUBLIC KEY-----`;
    this._rsa = new RSA(params.encryptedKey);
    this._apiToken = params.token;
    this._checksum = params.checksum;
    this._baseUrl = params.baseUrl;
    this._returnUrl = params.returnUrl;
    this._cancelUrl = params.cancelUrl;
  }

  /**
   * Generate checksum based on request data before send to AlePay
   *
   * @param {string} dataEncrypted
   * @returns {string}
   */
  _createChecksum(dataEncrypted) {
    return Crypto.createHash('md5').update(`${dataEncrypted}${this._checksum}`).digest('hex');
  }

  /**
   * Verify data encrypted is from AlePay
   *
   * @param {string} dataEncrypted
   * @param {string} checksum
   * @returns {boolean}
   */
  validatePayment(dataEncrypted, checksum) {
    return this._createChecksum(dataEncrypted) === checksum;
  }

  /**
   * Decrypt data response from AlePay
   *
   * @param {string} data
   * @returns {string}
   */
  decryptData(data) {
    const res = this._rsa.decrypt(data);
    return JSON.parse(res);
  }

  /**
   * Make a request to AlePay
   *
   * @param {string} endpoint
   * @param {{}} data
   *
   * @returns {Promise}
   */
  async request(endpoint, data) {
    try {
      const dataEncrypted = this._rsa.encrypt(JSON.stringify(data));
      const checksum = this._createChecksum(dataEncrypted);
      const requestData = {
        token: this._apiToken,
        data: dataEncrypted,
        checksum
      };
      // console.log('requestData', requestData);
      const url = this._baseUrl + endpoint;
      const response = await axios.post(url, requestData, { validateStatus: () => true });
      if (!this.validatePayment(response.data.data, response.data.checksum)) {
        throw new BaseError({
          statusCode: 500,
          error: errorCode.server,
          errors: { checksum: errorCode['server.thirdPartyError'] }
        });
      }
      const result = this.decryptData(response.data.data);
      return result;
    } catch (error) {
      throw new BaseError({
        statusCode: 500,
        error: errorCode.server,
        errors: { requestError: errorCode['server.internalError'] }
      });
    }
  }
  /**
   *
   *
   * @param {{
   * orderCode: string,
   * amount: number,
   * orderDescription: string,
   * buyerName: string,
   * buyerPhone: string,
   * buyerAddress: string,
   * buyerCity: string,
   * buyerCountry: string,
   * }} data
   * @returns
   * @memberof AlePay
   */
  createRequestPayment(data) {
    const payment = {
      orderCode: data.orderCode,
      amount: data.amount,
      currency: 'VND',
      orderDescription: data.orderDescription,
      totalItem: 1,
      checkoutType: 1,
      returnUrl: this._returnUrl,
      cancelUrl: this._cancelUrl,
      buyerName: data.buyerName,
      buyerPhone: data.buyerPhone,
      buyerEmail: '',
      buyerAddress: data.buyerAddress || 'Võ Trường Toản, Linh Trung, Thủ Đức',
      buyerCity: data.buyerCity || 'Hồ Chí Minh',
      buyerCountry: data.buyerCountry || 'Việt Nam',
      allowDomestic: false,
      paymentHours: 0.15
    };
    return this.request(URLs.requestPayment, payment);
  }

  getTransactionHistory(params = {}) {
    return this.request(URLs.getTransactionHistory, params);
  }

  getTransactionInfo(transactionCode) {
    return this.request(URLs.getTransactionInfo, { transactionCode });
  }

  oneClickPayment(data) {
    return this.request(URLs.tokenizationPayment, data);
  }

  /**
   * To get bankCode when user pays with ATM, IB, QRCODE
   *
   * @param {number} amount total amount of order
   * @returns {Promise}
   */
  getBanksDomestic(amount) {
    return this.request(URLs.getBanksDomestic, { amount });
  }
}

export const alePay = new AlePay({
  baseUrl: process.env.ALE_URL,
  returnUrl: process.env.ALE_RETURN_URL,
  cancelUrl: process.env.ALE_CANCEL_URL,
  checksum: process.env.ALE_CHECKSUM_KEY,
  encryptedKey: process.env.ALE_ENCRYPT_KEY,
  token: process.env.ALE_TOKEN_KEY
});

export default alePay;

// alePay
//   .createRequestPayment({
//     orderCode: 'ORDIR-955494',
//     amount: 200000,
//     currency: 'VND',
//     orderDescription: 'DDHFJFF',
//     totalItem: 1,
//     checkoutType: 1,
//     returnUrl: 'https://localhost:3000',
//     cancelUrl: 'https://localhost:3000',
//     buyerName: 'Doan Cong Minh',
//     buyerPhone: '0962062515',
//     buyerEmail: 'dncgmh@gmail.com',
//     buyerAddress: 'Vo Truong Toan, Linh Trung, Thu Duc',
//     buyerCity: 'Ho Chi Minh',
//     buyerCountry: 'Viet Nam',
//     allowDomestic: false,
//     paymentHours: 0.25
//   })
