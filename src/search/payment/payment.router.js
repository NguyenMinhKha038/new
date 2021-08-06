import { Router } from 'express';
import { auth, joiValidate } from '../../commons/middlewares';
import paymentControllerUser from './payment.controller.user';
import paymentValidate from './payment.validate';
import paymentControllerAdmin from './payment.controller.admin';
import pinAuth from '../../commons/middlewares/pinAuth';

const userRouter = Router();
const adminRouter = Router();
const router = Router();

userRouter.get(
  '/',
  joiValidate.validate('query', paymentValidate.user.userFindSchema),
  paymentControllerUser.find
);

userRouter.post(
  '/',
  joiValidate.validate('body', paymentValidate.user.createSchema),
  pinAuth.pinAuthorization(),
  paymentControllerUser.payment
);

userRouter.get(
  '/:id',
  joiValidate.validate('params', joiValidate.idSchema),
  paymentControllerUser.findOne
);

adminRouter.get(
  '/',
  joiValidate.validate('query', paymentValidate.admin.adminFindSchema),
  paymentControllerAdmin.find
);

adminRouter.get(
  '/:id',
  joiValidate.validate('params', joiValidate.idSchema),
  paymentControllerAdmin.findById
);

router.use('/user', auth.isAuthorized, userRouter);
router.use('/admin', auth.isAdminAuthorized, auth.isAdminPermission, adminRouter);

export { router as paymentRouter };
