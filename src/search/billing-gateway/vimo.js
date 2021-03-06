import aes256 from 'aes-everywhere';
import axios from 'axios';
import md5 from 'md5';
import qs from 'qs';
import { logger, BaseError, errorCode } from '../../commons/utils';
import './vimo.typedef.js';

export class Vimo {
  /**
   * Creates an instance of Vimo.
   * @param {{URL_API:string,MC_CODE:string,MC_AUTH_USER:string,MC_AUTH_PASS:string,MC_ENCRYPT_KEY:string,MC_CHECKSUM_KEY:string}} config
   * @memberof Vimo
   */
  constructor(config) {
    this.URL_API = config.URL_API;
    this.MC_CODE = config.MC_CODE;
    this.MC_AUTH_USER = config.MC_AUTH_USER;
    this.MC_AUTH_PASS = config.MC_AUTH_PASS;
    this.MC_ENCRYPT_KEY = config.MC_ENCRYPT_KEY;
    this.MC_CHECKSUM_KEY = config.MC_CHECKSUM_KEY;
    this.axiosInstance = axios.create({
      baseURL: config.URL_API,
      method: 'POST',
      // validateStatus: () => true,
      auth: { username: this.MC_AUTH_USER, password: this.MC_AUTH_PASS },
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
  }
  /**
   * check response is valid
   *
   * @param {object} data
   * @returns {boolean}
   * @memberof Vimo
   */
  /**
   * call API
   *
   * @param {string} fnc
   * @param {object} [data]
   * @returns {Promise<VimoResponse>}
   * @memberof Vimo
   */
  async call(fnc, data = {}) {
    try {
      logger.info('fnc %s', fnc);
      logger.info('%o', data);
      const encryptedData = aes256.encrypt(JSON.stringify(data), this.MC_ENCRYPT_KEY);
      const md5str = this.MC_CODE + encryptedData + this.MC_CHECKSUM_KEY;
      const checksum = md5(md5str);
      const body = {
        fnc,
        merchantcode: this.MC_CODE,
        data: encryptedData,
        checksum
      };
      const res = await this.axiosInstance.post(fnc, qs.stringify(body));
      logger.info('res.data %o', res.data);
      return res.data;
    } catch (error) {
      logger.error(error.response);
      logger.error(error);
    }
  }
  /**
   *
   *
   * @returns {Promise<{balance: number, balance_holding: number}>}
   * @memberof Vimo
   */
  async getBalance() {
    const data = await this.call('getbalance', {
      mc_request_id: Math.round(Math.random() * 100000).toString(),
      merchant_code: this.MC_CODE
    });
    return data.data;
  }
  /**
   *
   *
   * @param {object} params
   * @param {string} params.transaction_id
   * @param {string} params.receiver phone_number
   * @param {VimoTopUpAmount} params.amount
   * @returns {Promise<VimoResponse&VimoTopUpData>}
   * @memberof Vimo
   */
  async topup({ transaction_id, receiver, amount }) {
    const res = await this.call('topup', {
      mc_request_id: transaction_id,
      service_code: 'TOPUP_TELCO_PREPAID',
      receiver,
      amount
    });
    if (!res.error_code || res.error_code !== '00') {
      throw new BaseError({
        statusCode: 403,
        error: errorCode.action,
        errors: {
          server_code: error[res.error_code].server_code,
          partner_code: res.error_code
        },
        message: res.error_message
      });
    }
    return res.data;
  }
  /**
   *
   *
   * @param {{transaction_id: string}} params
   * @memberof Vimo
   */
  checkTopUpTransaction({ transaction_id }) {
    this.call('checktopuptransaction', {
      mc_request_id: transaction_id,
      service_code: 'TOPUP_TELCO_PREPAID'
    });
  }
  /**
   *
   *
   * @param {object} params
   * @param {string} params.mc_request_id
   * @param {VimoBillServiceCode} params.service_code
   * @param {string} params.publisher
   * @param {string} params.customer_code
   * @returns {Promise<VimoResponse&VimoBillData>}
   * @memberof Vimo
   */
  async queryBill({ mc_request_id, service_code, publisher, customer_code }) {
    const res = await this.call('querybill', {
      mc_request_id,
      service_code,
      publisher,
      customer_code
    });
    if (res.error_code !== '00') {
      throw new BaseError({
        statusCode: 403,
        error: errorCode.action,
        errors: {
          partner_code: res.error_code
        },
        message: res.error_message
      }).addMeta({ data: res.data });
    }
    return res.data;
  }
  /**
   *
   * @typedef {{billNumber: string, period: string, amount: number, billType: string, otherInfo: string}} BillPayment
   * @param {{ mc_request_id: string, service_code: VimoBillServiceCode, publisher: string, customer_code: string, bill_payment: BillPayment }} param
   * @memberof Vimo
   * @returns {Promise<VimoResponse&VimoBillData>}
   */
  async payBill({ mc_request_id, service_code, publisher, customer_code, bill_payment }) {
    const res = await this.call('paybill', {
      mc_request_id,
      publisher,
      service_code,
      customer_code,
      bill_payment
    });
    if (res.error_code !== '00') {
      throw new BaseError({
        statusCode: 403,
        error: errorCode.action,
        errors: {
          partner_code: res.error_code
        },
        message: res.error_message
      });
    }
    return res.data;
  }
  generateRequestId() {
    return `${+(new Date().getFullYear() + new Date().getMonth() + new Date().getDate()).toString(
      15
    )}${Math.round(Date.now() / 1000).toString(36)}${Math.random()
      .toString(36)
      .substr(2, 3)}`.toUpperCase();
  }
}

export default Vimo;

const error = {
  '00': { message: 'Th??nh c??ng' },
  '01': { message: 'Th???t b???i' },
  '02': { message: 'Tham s??? kh??ng h???p l???' }, // -
  '03': { message: 'Checksum kh??ng h???p l???' }, // -
  '04': { message: 'IP ?????i t??c b??? kh??a ho???c ch??a ???????c khai b??o' }, // -
  '05': { message: '?????i t??c b??? kh??a ho???c ch??a ???????c khai b??o' }, // -
  '06': { server_code: errorCode['client.topupParamNotValid'], message: 'Tham s??? ch??a ch??nh x??c' },
  '07': { message: 'D???ch v??? ch??a ???????c khai b??o' }, // -
  '08': { message: 'S???n ph???m ch??a ???????c khai b??o' }, // -
  '09': { message: 'Thu???c t??nh/M???nh gi?? s???n ph???m ch??a ???????c khai b??o' }, // -
  '20': { message: 'K??nh ch??a ???????c khai b??o' }, // -
  '21': { message: 'D???ch v??? Nh?? cung c???p kh??ng h???p l???' }, // -
  '22': { message: 'M?? giao d???ch ?????i t??c kh??ng ???????c tr??ng nhau' }, // -
  '23': { message: 'Kh??ng t??m th???y y??u c???u d???ch v???' }, // -
  '24': { message: 'M?? y??u c???u thanh to??n kh??ng ???????c tr??ng nhau' }, // -
  '25': { message: 'S??? d?? kh??ng ????? ????? thanh to??n' }, // -
  '26': { message: 'M?? h??a ????n kh??ng ch??nh x??c ho???c ch??a ?????n k??? thanh to??n' }, // -
  '27': { message: 'H???t th???i gian thanh to??n' }, // -
  '28': { message: 'M?? thanh to??n kh??ng t???n t???i' }, // -
  '29': { message: 'M?? thanh to??n v?? s??? ti???n kh??ng h???p l???' }, // -
  '30': { message: 'V?? b??? block sau khi thanh to??n' }, // -
  '31': { message: '???? thanh to??n b???i chi nh??nh kh??c' }, // -
  '32': { message: 'H???n m???c kh??ng ????? ????? thanh to??n' }, // -
  '98': { message: 'Timeout' },
  '99': { message: 'L???i ch??a x??c ?????nh' }
};
