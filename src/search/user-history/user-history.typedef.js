/**
 * @typedef UserHistoryType
 * @type {'deposit'
 *        |'withdraw'
 *        |'deposit_company'
 *        |'withdraw_company'
 *        |'transfer_sender'
 *        |'transfer_receiver'
 *        |'mobile_card'
 *        |'pay_order'
 *        |'pay_cart'
 *        |'pay_bill'
 *        |'pay_topup'
 *        |'payment'
 *        |'refund'
 *        |'fee'
 *        |'commission'
 *        |'return_canceled_order'
 *        }
 */

/**
 * @typedef UserHistoryOnModel
 * @type {'s_deposit_withdraw'| 's_transfers'| 's_mobilecards'| 's_order'| 's_payments'| 's_cart'|'s_bill'|'s_topup'}
 */

/**
 * @typedef UserHistoryCreate
 * @type {object}
 * @property {string} transaction_id
 * @property {string} user_id
 * @property {string} company_id
 * @property {UserHistoryOnModel} onModel
 * @property {number} value
 * @property {number} new_balance
 * @property {string} refed_id
 * @property {UserHistoryType} type
 */
