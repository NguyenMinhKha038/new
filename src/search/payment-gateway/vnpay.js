import moment from 'moment';
import qs from 'qs';
import _ from 'lodash';
import crypto from 'crypto';
import axios from 'axios';

class VnPay {
  /**
   *Creates an instance of VnPay.
   *
   * @param {{vnp_Url :string, api_Url :string, vnp_TmnCode: string, vnp_HashSecret: string, vnp_ReturnUrl: string, vnp_Version: string}} config
   * @memberof VnPay
   */
  constructor(config) {
    this.vnp_ReturnUrl = config.vnp_ReturnUrl;
    this.vnp_Url = config.vnp_Url;
    this.api_Url = config.api_Url;
    this.vnp_TmnCode = config.vnp_TmnCode;
    this.vnp_HashSecret = config.vnp_HashSecret;
    this.vnp_Version = config.vnp_Version;
  }
  /**
   * Creates payment url
   *
   * @param {{amount, bankCode, orderDescription, orderType, userIp, code}} data
   * @memberof VnPay
   * @returns {string} payment Url
   */
  createPaymentUrl(data) {
    /**
     * @type {{[key in "vnp_Version"| "vnp_Command"| "vnp_TmnCode"| "vnp_Amount"| "vnp_BankCode"| "vnp_CreateDate"| "vnp_CurrCode"| "vnp_IpAddr"| "vnp_Locale"| "vnp_OrderInfo"| "vnp_OrderType"| "vnp_ReturnUrl"| "vnp_TxnRef"| "vnp_SecureHashType"| "vnp_SecureHash"]:string}}
     */
    const payment = {
      vnp_CreateDate: moment().format('YYYYMMDDHHmmss'),
      vnp_TxnRef: data.code,
      ...(data.bankCode ? { vnp_BankCode: data.bankCode } : {}),
      vnp_Amount: Math.round(data.amount * 100),
      vnp_ReturnUrl: this.vnp_ReturnUrl,
      vnp_Command: 'pay',
      vnp_CurrCode: 'VND',
      vnp_IpAddr: data.userIp,
      vnp_Locale: 'vn',
      vnp_OrderInfo: data.orderDescription,
      vnp_OrderType: data.orderType,
      vnp_TmnCode: this.vnp_TmnCode,
      vnp_Version: this.vnp_Version
    };
    const sortedPayment = _(payment).toPairs().sortBy(0).fromPairs().value();
    const signData = this.vnp_HashSecret + qs.stringify(sortedPayment, { encode: false });
    payment.vnp_SecureHashType = 'SHA256';
    payment.vnp_SecureHash = crypto.createHash('SHA256').update(signData).digest('hex');
    return this.vnp_Url + '?' + qs.stringify(payment, { encode: true });
  }
  /**
   *  checksum
   *
   * @param {{secureHash: string}} data
   * @memberof VnPay
   * @returns {boolean}
   */
  validatePayment(data) {
    const secureHash = data['vnp_SecureHash'];
    delete data['vnp_SecureHash'];
    delete data['vnp_SecureHashType'];
    data = _(data).toPairs().sortBy(0).fromPairs().value();
    const signData = this.vnp_HashSecret + qs.stringify(data, { encode: false });
    const checkSum = crypto.createHash('SHA256').update(signData).digest('hex');
    return checkSum === secureHash;
  }
  /**
   * Creates payment url
   *
   * @param {{amount, orderDescription, userIp, transDate}} data
   * @memberof VnPay
   * @returns {string} payment Url
   */
  async requestRefund(data) {
    /**
     * @type {{[key in "vnp_Version"| "vnp_Command"| "vnp_TmnCode"| "vnp_Amount"| "vnp_TransactionType"| "vnp_CreateDate"| "vnp_TransDate"| "vnp_IpAddr"| "vnp_OrderInfo"| "vnp_TxnRef"| "vnp_SecureHashType"| "vnp_SecureHash"]:string}}
     */
    const request = {
      vnp_Version: this.vnp_Version,
      vnp_Amount: Math.round(data.amount * 100),
      vnp_Command: 'refund',
      vnp_TransactionType: '03',
      vnp_TxnRef: Math.round(Math.random() * 1000),
      vnp_CreateDate: moment().format('YYYYMMDDHHmmss'),
      vnp_IpAddr: data.userIp,
      vnp_OrderInfo: data.orderDescription,
      vnp_TmnCode: this.vnp_TmnCode,
      vnp_TransDate: data.transDate
    };
    const sortedPayment = _(request).toPairs().sortBy(0).fromPairs().value();
    const signData = this.vnp_HashSecret + qs.stringify(sortedPayment, { encode: false });
    request.vnp_SecureHashType = 'SHA256';
    request.vnp_SecureHash = crypto.createHash('SHA256').update(signData).digest('hex');
    const query = this.api_Url + '?' + qs.stringify(request, { encode: true });
    const response = await axios.get(query);
    // console.log('response', response.data);
    return response;
  }
}

export default new VnPay({
  vnp_HashSecret: process.env.VNP_HASH_SECRET,
  vnp_TmnCode: process.env.VNP_TMN_CODE,
  vnp_Url: process.env.VNP_URL,
  api_Url: process.env.VNP_RETURN_URL,
  vnp_ReturnUrl: process.env.VNP_RETURN_URL,
  vnp_Version: process.env.VNP_VERSION
});
