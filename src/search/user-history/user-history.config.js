export default {
  MODEL: [
    's_deposit_withdraw',
    's_transfers',
    's_mobilecards',
    's_order',
    's_payments',
    's_cart',
    's_bill',
    's_topup',
    's_topup_combo'
  ],
  TYPE: [
    'deposit',
    'withdraw',
    'deposit_company',
    'withdraw_company',
    'transfer_sender',
    'transfer_receiver',
    // 'mobile_card',
    'pay_order',
    'pay_cart',
    'pay_bill',
    'pay_topup',
    'refund',
    'fee',
    'commission',
    'return_canceled_order'
  ],
  REFUND_SRC: ['mobile_card', 'order']
};
