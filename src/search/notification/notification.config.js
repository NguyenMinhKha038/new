export const Types = {
  // General --
  General: 'general',
  Promotion: 'promotion',
  Update: 'update',
  Security: 'security',
  // Goods batch moving --
  MoveGoodsBatchRequest: 'move_goods_batch_request',
  MoveGoodsBatchUpdate: 'move_goods_batch_update',
  MoveGoodsBatchApprove: 'move_goods_batch_approve',
  MoveGoodsBatchConfirm: 'move_goods_batch_confirm',
  // Company --
  // status
  CompanyApprove: 'company_approved',
  CompanyCancel: 'company_canceled',
  CompanySuspend: 'company_suspend',
  // balance limit
  CompanyBalanceBelow30: 'company_balance_below_30',
  CompanyBalanceBelow50: 'company_balance_below_50',
  // deposit/withdrawal
  CompanyDepositError: 'company_deposit_error',
  CompanyDepositSuccess: 'company_deposit_success',
  CompanyWithdrawError: 'company_withdraw_error',
  CompanyWithdrawSuccess: 'company_withdraw_success',
  // order
  CompanyNewOrder: 'company_new_order',
  CompanyUserPayOrder: 'company_user_pay_order',
  CompanyPayTransportFee: 'company_pay_transport_fee',
  // User --
  // order
  UserPayOrderSuccess: 'user_pay_order_success',
  UserCancelOrderSuccess: 'user_cancel_order_success',
  UserCompanyCanceledOrder: 'user_company_canceled_order',
  UserConfirmedOrder: 'user_confirmed_order',
  UserDeliveringOrder: 'user_delivering_order',
  UserDeliveredOrder: 'user_delivered_order',
  UserRejectedOrder: 'user_rejected_order',
  UserCompletedOrder: 'user_completed_order',
  // refund/commission
  UserReceiveCommission: 'user_receive_commission',
  UserReceiveRefund: 'user_receive_refund',
  // deposit/withdraw
  UserDepositError: 'user_deposit_error',
  UserDepositSuccess: 'user_deposit_success',
  UserWithdrawError: 'user_withdraw_error',
  UserWithdrawSuccess: 'user_withdraw_success',
  // product
  UserNewProduct: 'user_new_product',
  // transfer
  UserReceiveMoney: 'user_receive_money',
  UserSendMoney: 'user_send_money'
};
