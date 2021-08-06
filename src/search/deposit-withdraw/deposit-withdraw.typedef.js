/**
 * @typedef DepWithVnpData
 * @type {object}
 * @property {string} vnp_BankCode
 * @property {string} vpn_PayDate
 * @property {number} vnp_Amount
 * @property {string} vnp_CardType
 * @property {string} vnp_BackTranNo
 * @property {number} vnp_TransactionNo
 * @property {string} vnp_TxnRef
 * @property {string} bank
 */

/**
 * @typedef DepWithConfirm
 * @type {object}
 * @property {DepWithType} type
 * @property {string} transaction_id,
 * @property {'success' | 'canceled'} status
 * @property {number} refundValue
 * @property {number} value
 * @property {string | undefined} cashier_id
 * @property {DepWithVnpData} vnp_data
 */

/**@typedef DepWithType
 * @type {'deposit'| 'withdraw' | 'deposit_company' |'withdraw_company'}
 */
