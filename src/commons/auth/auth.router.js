import express from 'express';
import controller from './auth.controller';
import { auth, joiValidate } from '../middlewares';
import authValidate from './auth.validate';
import phoneFormat from '../middlewares/phone.format';
const router = express.Router();

// router.post('/init-server', controller.initServer);
router.post('/login-with-facebook', controller.loginWithFacebook);
router.post('/admin-login', controller.adminLogin);
router.post(
  '/user-login',
  phoneFormat.phoneFormat('body', 'phone'),
  joiValidate.validate('body', authValidate.userLogin),
  controller.userLogin
);
router.post(
  '/user-register',
  phoneFormat.phoneFormat('body', 'phone'),
  phoneFormat.phoneFormat('body', 'ref_code'),
  joiValidate.validate('body', authValidate.userRegister),
  controller.userRegister
);
router.post(
  '/user-reset-password',
  phoneFormat.phoneFormat('body', 'phone'),
  joiValidate.validate('body', authValidate.userResetPassword),
  controller.userResetPassword
);
// router.post('/user-verify', controller.userVerify);
router.post('/admin-reset-password', controller.adminResetPassword);
router.get(
  '/firebase-user',
  joiValidate.validate('query', authValidate.phoneSchema),
  controller.getUserFirebase
);
// router.put(
//   '/verify',
//   joiValidate.validate('body', authValidate.verifySchema),
//   controller.verifyUser
// );
// router.put('/verify-email', joiValidate.validate('body', authValidate.verifyByMail), controller.userVerify);
// router.post(
//   '/verify-sms',
//   phoneFormat.phoneFormat('body', 'phone'),
//   joiValidate.validate('body', authValidate.verifyBySMS),
//   controller.verifyBySMS
// );
router.post(
  '/verify',
  phoneFormat.phoneFormat('body', 'phone'),
  joiValidate.validate('body', authValidate.verifyBySMS),
  controller.verify
);
router.post(
  '/send-sms',
  phoneFormat.phoneFormat('body', 'phone'),
  joiValidate.validate('body', authValidate.resendSMS),
  controller.resendSMS
);
router.post(
  '/raw-send-sms',
  phoneFormat.phoneFormat('body', 'phone'),
  joiValidate.validate('body', authValidate.resendSMS),
  controller.rawSendSMS
);
export default router;
