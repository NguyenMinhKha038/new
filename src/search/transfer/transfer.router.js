import { Router } from 'express';
import transferControllerUser from './transfer.controller.user';
import { auth, joiValidate } from '../../commons/middlewares';
import transferValidate from './transfer.validate';
import transferControllerAdmin from './transfer.controller.admin';
import phoneFormat from '../../commons/middlewares/phone.format';
import pinAuth from '../../commons/middlewares/pinAuth';

const userRouter = Router();
const adminRouter = Router();
const router = Router();

userRouter.get(
  '/',
  joiValidate.validate('query', transferValidate.user.findSchema),
  transferControllerUser.find
);

userRouter.post(
  '/',
  phoneFormat.phoneFormat('body', 'receiver_phone'),
  joiValidate.validate('body', transferValidate.user.createSchema),
  pinAuth.pinAuthorization(),
  transferControllerUser.transfer
);

userRouter.get(
  '/:id',
  joiValidate.validate('params', joiValidate.idSchema),
  transferControllerUser.findById
);

adminRouter.get(
  '/',
  joiValidate.validate('query', transferValidate.admin.findSchema),
  transferControllerAdmin.find
);

adminRouter.get(
  '/statistic',
  joiValidate.validate('query', transferValidate.admin.statistic),
  transferControllerAdmin.statistic
);

adminRouter.get(
  '/:id',
  joiValidate.validate('params', joiValidate.idSchema),
  transferControllerAdmin.findById
);

router.use('/user', auth.isAuthorized, userRouter);
router.use('/admin', auth.isAdminAuthorized, auth.isAdminPermission, adminRouter);

export { router as transferRouter };
