export const internalPaymentMethods = ['COD', 'WALLET', 'CASH'];

/**
 * NOTE: `payment_config` is configured in configs
 *
 * migrate config if you want to add new one.
 */
export const PaymentMethods = {
  COD: 'COD',
  CASH: 'CASH',
  VNPAY: 'VNPAY',
  ALEPAY: 'ALEPAY',
  WALLET: 'WALLET'
};
/**
 * NOTE: `payment_types` is configured in configs
 *
 * migrate config if you want to add new one.
 */
export const PaymentTypes = {
  pay_cart: 'pay_cart',
  pay_order_offline: 'pay_order_offline',
  passive_pay_order_offline: 'passive_pay_order_offline',
  deposit: 'deposit'
};
