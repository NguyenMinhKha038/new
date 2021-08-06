/**
 * @typedef {import('mongoose').Document} MongooseDocument
 */
/**
 * @typedef {Object} TopUp
 * @property {string} user_id
 * @property {string} amount
 * @property {string} publisher
 * @property {'pending'|'success'|'failed'} status
 * @property {string} combo
 * @property {string} months
 * @property {string} month
 * @property {string} date
 * @property {string} type
 * @property {string} total
 * @property {string} code
 * @property {string} receiver
 * @property {string} external_transaction_id
 * @property {string} combo_id
 * @property {boolean} in_combo
 */
/**
 * @typedef {Object} TopUpCombo
 * @property {string} user_id
 * @property {string} amount
 * @property {string} publisher
 * @property {'pending'|'success'|'failed'} status
 * @property {string} combo
 * @property {string} remain_months
 * @property {string} months
 * @property {string} date
 * @property {string} next_date
 * @property {string} type
 * @property {string} total
 * @property {string} code
 * @property {string} receiver
 * @property {string} external_transaction_id
 */
