import { configService } from '../../commons/config';
import { internalPaymentMethods, PaymentMethods } from './payment-gateway.config';

export default {
  /**
   * Check this payment method is valid to pay
   *
   * @param {keyof typeof import('./payment-gateway.config').PaymentMethods} payment_method
   * @param {keyof typeof import('./payment-gateway.config').PaymentTypes} payment_type
   */
  isValidPaymentMethod: async (payment_method, payment_type) => {
    if (internalPaymentMethods.includes(payment_method)) return true;
    const paymentGatewayConfig = await configService.get('payment_gateway');
    const paymentCase = paymentGatewayConfig.find((p) => p.name === payment_method);
    if (paymentCase.is_active && paymentCase[payment_type]) return true;
    return false;
  }
};
