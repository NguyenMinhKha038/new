import { Router } from 'express';
import { auth, isValid } from '../../commons/middlewares';
import paymentGatewayController from './payment-gateway.controller';
import paymentGatewayValidation from './payment-gateway.validation';

const router = Router(),
  admin = Router();

router.get('/vnpay/return', paymentGatewayController.vnpay.return);
router.get('/vnpay/ipn', paymentGatewayController.vnpay.ipn);
router.get('/alepay/return', paymentGatewayController.alepay.return);
router.get('/alepay/cancel', paymentGatewayController.alepay.cancel);
admin.post(
  '/alepay/restore',
  isValid(paymentGatewayValidation.restore),
  paymentGatewayController.alepay.restore
);
router.use('/admin', auth.isAdminAuthorized, auth.isAdminPermission, admin);
export { router as paymentGateWayRouter };
