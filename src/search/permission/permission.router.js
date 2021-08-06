import express from 'express';
import adminController from './permission.admin.controller';
import AuthMiddleware from '../../commons/middlewares/auth';
import { joiValidate } from '../../commons/middlewares';
import permissionValidate from './permission.validate';
import permissionUserController from './permission.user.controller';
const router = express.Router();
const adminRouter = express.Router();
const userRouter = express.Router();

//admin
adminRouter.get(
  '/refresh/:type',
  joiValidate.validate('params', permissionValidate.admin.refreshSchema),
  adminController.refresh
);

adminRouter.get(
  '/',
  // AuthMiddleware.isCompanyModPermission,
  joiValidate.validate('query', permissionValidate.admin.FindSchema),
  adminController.findPermissions
);

adminRouter.get(
  '/:id',
  joiValidate.validate('params', joiValidate.idSchema),
  adminController.findOneById
);

adminRouter.post(
  '/',
  joiValidate.validate('body', permissionValidate.admin.createSchema),
  adminController.create
);

adminRouter.put(
  '/',
  joiValidate.validate('body', permissionValidate.admin.updateSchema),
  adminController.findOneAndUpdate
);

adminRouter.delete(
  '/:id',
  joiValidate.validate('params', joiValidate.idSchema),
  adminController.findOneAndDelete
);

//user
// userRouter.get(
//   '/',
//   AuthMiddleware.isCompanyModPermission,
//   joiValidate.validate('query', permissionValidate.user.FindSchema),
//   permissionUserController.findPermissions
// );

router.use(
  '/admin',
  AuthMiddleware.isAdminAuthorized,
  AuthMiddleware.isAdminPermission,
  adminRouter
);
router.use('/user', AuthMiddleware.isAuthorized, userRouter);

export { router as searchPermissionRouter };
