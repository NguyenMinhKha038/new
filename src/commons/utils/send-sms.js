import request from 'request';
import userSmsService from '../user-sms/user-sms.service';
import BaseError from './base-error';
import logger from './winston-logger';
/**
 *
 * @param {*} options
 * @returns {*}
 */
function doRequest(options) {
  return new Promise((resolve, reject) => {
    request({ ...options, timeout: 3000 }, (error, response, body) => {
      if (error) {
        reject(error);
      }
      resolve(body);
    });
  });
}

/**
 *
 * @param {{phone:string, code: string, type: import('../user-sms/user-sms.service').SMSType}} param0
 */
async function sendSMS({ phone, code, type = 'register' }) {
  try {
    const brandName = process.env.SMS_BRAND_NAME;
    const appName = process.env.APP_NAME;

    if (process.env.NODE_ENV !== 'production') {
      return Promise.resolve(true);
    }

    let message = `${brandName}-Chao mung ban den voi ung dung ${appName}. Vui long nhap ma ${code} de dang ky tai khoan.`;
    if (type === 'reset-password') {
      message = `${brandName}-Khong chia se OTP voi bat ky ai. Nhap ma ${code} de dat lai mat khau`;
    }

    const messageBase64Encode = Buffer.from(message).toString('base64');
    const body =
      '<soapenv:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance\\" xmlns:xsd="http://www.w3.org/2001/XMLSchema\\" xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/\\" xmlns:mts="MTService\\">\r\n\t<soapenv:Header/>\r\n\t<soapenv:Body>\r\n\t<mts:sendMT soapenv:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/\\">\r\n\t<string xsi:type="xsd:string\\">' +
      phone +
      '</string>\r\n\t<string0 xsi:type="xsd:string\\">' +
      messageBase64Encode +
      '</string0>\r\n\t<string1 xsi:type="xsd:string\\">' +
      brandName +
      '</string1>\r\n\t<string2 xsi:type="xsd:string\\">' +
      brandName +
      '</string2>\r\n\t<string3 xsi:type="xsd:string\\">0</string3>\r\n\t<string4 xsi:type="xsd:string\\">0</string4>\r\n\t<string5 xsi:type="xsd:string\\">0</string5>\r\n\t<string6 xsi:type="xsd:string\\">0</string6>\r\n\t<string7 xsi:type="xsd:string\\">0</string7>\r\n\t<string8 xsi:type="xsd:string\\">0</string8>\r\n\t</mts:sendMT>\r\n\t</soapenv:Body>\r\n</soapenv:Envelope>';

    const options = {
      method: 'POST',
      url: 'http://sms.8x77.vn:8077/mt-services/MTService',
      headers: {
        'Postman-Token': 'd98732b6-67c6-4e4a-85ab-252e56813fe7',
        'cache-control': 'no-cache',
        Authorization: 'Basic Y29kb3NhOkNPRE9TQUAjKCkxMjM=',
        'Content-Type': 'text/xml;charset=utf-8'
      },
      body
    };

    // const options = {
    //   method: 'POST',
    //   url: 'http://45.77.148.69:3333/send-sms',
    //   headers: {
    //     'Content-Type': 'application/json'
    //   },
    //   body: JSON.stringify({ phone, message })
    // };
    const response = await doRequest(options);
    console.log('response from SBTC', response);
    await userSmsService.createOrUpdate('+' + phone, message, type);
    return response;
  } catch (err) {
    logger.error(err);
    throw new BaseError({
      statusCode: 500,
      error: 'service BSTC send sms error',
      errors: err
    });
  }
}

export default sendSMS;
