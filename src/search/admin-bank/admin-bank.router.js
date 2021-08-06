import { Router } from 'express';
import adminBankControllerUser from './admin-bank.controller.user';
import { joiValidate, auth } from '../../commons/middlewares';
import adminBankValidate from './admin-bank.validate';
import adminBankControllerAdmin from './admin-bank.controller.admin';

const userRouter = Router();
const adminRouter = Router();
const router = Router();

userRouter.get(
  '/',
  joiValidate.validate('query', adminBankValidate.user.find),
  adminBankControllerUser.find
);

userRouter.get(
  '/:id',
  joiValidate.validate('params', joiValidate.idSchema),
  adminBankControllerUser.findById
);

adminRouter.get(
  '/',
  joiValidate.validate('query', adminBankValidate.admin.find),
  adminBankControllerAdmin.find
);

adminRouter.get(
  '/:id',
  joiValidate.validate('params', joiValidate.idSchema),
  adminBankControllerAdmin.findById
);

adminRouter.post(
  '/',
  joiValidate.validate('body', adminBankValidate.admin.create),
  adminBankControllerAdmin.create
);

adminRouter.put(
  '/',
  joiValidate.validate('body', adminBankValidate.admin.update),
  adminBankControllerAdmin.update
);

router.use('/user', userRouter);
router.use('/admin', auth.isAdminAuthorized, auth.isAdminPermission, adminRouter);

export { router as adminBankRouter };
