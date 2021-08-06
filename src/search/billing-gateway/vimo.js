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
  '00': { message: 'Thành công' },
  '01': { message: 'Thất bại' },
  '02': { message: 'Tham số không hợp lệ' }, // -
  '03': { message: 'Checksum không hợp lệ' }, // -
  '04': { message: 'IP đối tác bị khóa hoặc chưa được khai báo' }, // -
  '05': { message: 'Đối tác bị khóa hoặc chưa được khai báo' }, // -
  '06': { server_code: errorCode['client.topupParamNotValid'], message: 'Tham số chưa chính xác' },
  '07': { message: 'Dịch vụ chưa được khai báo' }, // -
  '08': { message: 'Sản phẩm chưa được khai báo' }, // -
  '09': { message: 'Thuộc tính/Mệnh giá sản phẩm chưa được khai báo' }, // -
  '20': { message: 'Kênh chưa được khai báo' }, // -
  '21': { message: 'Dịch vụ Nhà cung cấp không hợp lệ' }, // -
  '22': { message: 'Mã giao dịch đối tác không được trùng nhau' }, // -
  '23': { message: 'Không tìm thấy yêu cầu dịch vụ' }, // -
  '24': { message: 'Mã yêu cầu thanh toán không được trùng nhau' }, // -
  '25': { message: 'Số dư không đủ để thanh toán' }, // -
  '26': { message: 'Mã hóa đơn không chính xác hoặc chưa đến kỳ thanh toán' }, // -
  '27': { message: 'Hết thời gian thanh toán' }, // -
  '28': { message: 'Mã thanh toán không tồn tại' }, // -
  '29': { message: 'Mã thanh toán và số tiền không hợp lệ' }, // -
  '30': { message: 'Vé bị block sau khi thanh toán' }, // -
  '31': { message: 'Đã thanh toán bởi chi nhánh khác' }, // -
  '32': { message: 'Hạn mức không đủ để thanh toán' }, // -
  '98': { message: 'Timeout' },
  '99': { message: 'Lỗi chưa xác định' }
};
