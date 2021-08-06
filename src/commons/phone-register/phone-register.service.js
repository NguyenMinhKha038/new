import phoneRegisterModel from './phone-register.model';

/**
 *
 * @param {PhoneRegisterCreate} data
 */
async function create(data) {
  return await phoneRegisterModel.create(data);
}
/**
 *
 * @param {PhoneRegisterQuery} query
 */
async function deleteMany(query) {
  return await phoneRegisterModel.deleteMany(query);
}

/**
 *
 * @param {{query: PhoneRegisterQuery, update: PhoneRegisterCreate, upsert: boolean}} param0
 */
async function findOneAndUpdate({ query, update, upsert = false }) {
  return await phoneRegisterModel.findOneAndUpdate(query, update, {
    new: true,
    upsert,
    select: '+wrong_times'
  });
}

/**
 *
 * @param {PhoneRegisterQuery} query
 * @param {*} select
 */
async function findOne(query, select) {
  return await phoneRegisterModel.findOne(query).select(select);
}

export default {
  create,
  deleteMany,
  findOneAndUpdate,
  findOne
};

/**
 * @typedef PhoneRegisterCreate
 * @type {object}
 * @property {string} phone
 * @property {string} code
 * @property {Date} expired_time
 * @property {string} token
 */

/**
 * @typedef PhoneRegisterQuery
 * @type {object}
 * @property {string} phone
 * @property {string} code
 * @property {string} token
 */
