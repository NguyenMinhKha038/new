import userSmsModel from './user-sms.model';
import { getNetWorkProvider, BaseError, errorCode } from '../utils';

/**@description
 * @param {string} phone +84.....
 * @param {string} code
 * @param {string} network_provider
 * @param {SMSType} type
 */
async function create(phone, code, network_provider, type) {
  const phoneRegex = /^\+84[3|5|7|8|9][0-9]{8}$/;
  if (!phoneRegex.test(phone)) {
    throw new BaseError({
      statusCode: 400,
      error: errorCode.client,
      errors: { phone: errorCode['any.invalid'] }
    });
  }
  const messages = [{ code, type }];
  return await userSmsModel.create({ phone, messages, network_provider });
}

/**@description
 * @param {string} phone +84.....
 * @param {string} codeMessage
 * @param {SMSType} type
 */
async function insertCodeMessages(phone, codeMessage, type) {
  return await userSmsModel.findOneAndUpdate(
    { phone },
    { $push: { messages: { code: codeMessage, type } } }
  );
}
/**
 *
 * @param {string} phone
 * @param {string} codeMessage
 * @param {SMSType} type
 */
async function createOrUpdate(phone, codeMessage, type = 'register') {
  let existedRecord = await userSmsModel.findOne({ phone });
  if (existedRecord) {
    return await insertCodeMessages(phone, codeMessage, type);
  } else {
    const network_provider = getNetWorkProvider(phone);
    return await create(phone, codeMessage, network_provider, type);
  }
}

async function find({ limit = 0, skip = 0, query, options, populate = null }) {
  return populate
    ? await userSmsModel.find(query, options).populate(populate).limit(limit).skip(skip)
    : await userSmsModel.find(query, options).limit(limit).skip(skip);
}

async function findById(id, options) {
  return await userSmsModel.findById(id, options);
}
async function count(query) {
  return await userSmsModel.countDocuments(query);
}

export default {
  create,
  insertCodeMessages,
  find,
  findById,
  count,
  createOrUpdate
};

/**
 * @typedef SMSType
 * @type {'reset-password' | 'register'}
 */
