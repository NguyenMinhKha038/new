import { Router } from 'express';
import { joiValidate, auth, upload, resize } from '../../commons/middlewares';
import transactionValidate from './deposit-withdraw.validate';
import transactionControllerUser from './deposit-withdraw.controller.user';
import transactionControllerAdmin from './deposit-withdraw.controller.admin';
import pinAuth from '../../commons/middlewares/pinAuth';

const router = Router();
const user = Router();
const admin = Router();

user.post(
  '/company',
  joiValidate.validate('body', transactionValidate.depositCompany),
  pinAuth.pinAuthorization('company'),
  transactionControllerUser.depositCompany
);

user.get(
  '/company',
  auth.isCompanyModPermission,
  joiValidate.validate('query', transactionValidate.companyGet),
  transactionControllerUser.companyFind
);

user.get(
  '/company/:id',
  auth.isCompanyModPermission,
  joiValidate.validate('params', joiValidate.idSchema),
  transactionControllerUser.companyFindById
);

user.post(
  '/vnp-deposit',
  joiValidate.validate('body', transactionValidate.depositVnPay),
  transactionControllerUser.depositByVnPay
);

user.post(
  '/',
  joiValidate.validate('body', transactionValidate.create),
  pinAuth.pinAuthorization(),
  transactionControllerUser.create
);

user.put(
  '/',
  joiValidate.validate('body', transactionValidate.updateImage),
  transactionControllerUser.updateImage
);
user.get(
  '/',
  joiValidate.validate('query', transactionValidate.search),
  transactionControllerUser.find
);
user.get(
  '/:id',
  joiValidate.validate('params', joiValidate.idSchema),
  transactionControllerUser.findById
);

admin.get(
  '/',
  joiValidate.validate('query', transactionValidate.search),
  transactionControllerAdmin.find
);

admin.get(
  '/statistics',
  joiValidate.validate('query', transactionValidate.admin.statistics),
  transactionControllerAdmin.statistic
);

admin.get(
  '/:id',
  joiValidate.validate('params', joiValidate.idSchema),
  transactionControllerAdmin.findById
);

// admin.get(
//   '/:id',
//   joiValidate.validate('params', joiValidate.idSchema),
//   transactionControllerAdmin.findById
// );

admin.put(
  '/confirm',
  joiValidate.validate('body', transactionValidate.admin.confirm),
  transactionControllerAdmin.confirmTransaction
);

admin.post(
  '/',
  joiValidate.validate('body', transactionValidate.admin.adminCreateTransaction),
  transactionControllerAdmin.createTransaction
);

router.post('/admin/transaction/post-sms-message', transactionControllerAdmin.confirmBySms);

router.use('/user', auth.isAuthorized, user);
router.use('/admin', auth.isAdminAuthorized, auth.isAdminPermission, admin);

export { router as transactionRouter };
