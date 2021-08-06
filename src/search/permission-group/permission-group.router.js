import { Router } from 'express';
import { joiValidate, auth } from '../../commons/middlewares';
import permissionGroupValidate from './permission-group.validate';
// import permissionGroupOwner from './permission-group.owner';
import permissionGroupOwnerController from './permission-group.owner.controller';
import permissionGroupAdminController from './permission-group.admin.controller';
import permissionGroupModController from './permission-group.mod.controller';
import phoneFormat from '../../commons/middlewares/phone.format';

const adminRouter = Router();
const ownerRouter = Router();
const userRouter = Router();
const router = Router();

//owner
ownerRouter.post(
  '/',
  phoneFormat.phoneFormat('body', 'phone_number'),
  joiValidate.validate('body', permissionGroupValidate.owner.createSchema),
  // auth.isOwner('company_id','body','company'),
  permissionGroupOwnerController.create
);

ownerRouter.put(
  '/',
  joiValidate.validate('body', permissionGroupValidate.owner.update),
  permissionGroupOwnerController.update
);

ownerRouter.put(
  '/status',
  joiValidate.validate('body', permissionGroupValidate.owner.updateStatus),
  permissionGroupOwnerController.updateStatus
);

ownerRouter.get(
  '/',
  joiValidate.validate('query', permissionGroupValidate.owner.ownerFindSchema),
  permissionGroupOwnerController.findUserMods
);

ownerRouter.get(
  '/mod/:id',
  joiValidate.validate('params', permissionGroupValidate.idSchema),
  permissionGroupOwnerController.findUserModById
);

//admin

adminRouter.get(
  '/',
  joiValidate.validate('query', permissionGroupValidate.admin.adminFindSchema),
  permissionGroupAdminController.find
);

adminRouter.get(
  '/raw',
  joiValidate.validate('query', permissionGroupValidate.admin.rawAdminFindSchema),
  permissionGroupAdminController.rawFind
);

adminRouter.get(
  '/:id',
  joiValidate.validate('params', permissionGroupValidate.idSchema),
  permissionGroupAdminController.findById
);

//user
userRouter.get(
  '/',
  // joiValidate.validate('query', permissionGroupValidate.user.userFindSchema),
  permissionGroupModController.findGroup
);
userRouter.get(
  '/:id',
  joiValidate.validate('params', permissionGroupValidate.idSchema),
  permissionGroupModController.findById
);

router.use('/owner', auth.isAuthorized, auth.isCompanyModPermission, ownerRouter);
router.use('/admin', auth.isAdminAuthorized, auth.isAdminPermission, adminRouter);
router.use('/user', auth.isAuthorized, userRouter);

export { router as searchPermissionGroupRouter };
