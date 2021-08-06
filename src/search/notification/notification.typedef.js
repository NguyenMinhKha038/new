/**
 * @typedef {"user_receive_commission"
 * |"user_receive_refund"
 * |"company_suspend"
 * |"company_balance_below_30"
 * |"company_balance_below_50"
 * |"company_deposit_success"
 * |"company_deposit_error"
 * |"company_withdraw_success"
 * |"company_withdraw_error"
 * |"company_new_order"
 * |"company_user_pay_order"
 * |"company_pay_transport_fee"
 * |"user_deposit_success"
 * |"user_deposit_error"
 * |"user_withdraw_success"
 * |"user_withdraw_error"
 * |"user_buy_mobile_card_success"
 * |"user_buy_mobile_card_fail"
 * |"user_pay_order_success"
 * |"user_return_commission"
 * |"user_cancel_order_success"
 * |"user_completed_order"
 * |"user_delivering_order"
 * |"user_delivered_order"
 * |"user_rejected_order"
 * |"user_company_canceled_order"
 * |"user_new_product"
 * |"user_receive_money"
 * |"user_send_money"
 * |"user_confirmed_order"
 * |"user_kyc_error"
 * |"user_kyc_success"
 * |"user_new_promotion"
 * |"company_approved"
 * |"company_rejected"
 * |"company_move_stock_request"
 * |"company_move_stock_finished"
 * } SNotificationType
 */

/**
 * @typedef {object} SNotification
 * @property {string} user_id
 * @property {string} company_id
 * @property {string} title
 * @property {"company"|"user"} to
 * @property {string} object_id
 * @property {string} onModel
 * @property {NotificationType} type
 * @property {string} message
 * @property {boolean} is_read
 */
