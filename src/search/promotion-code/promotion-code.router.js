import { Router } from 'express';
import promotionCodeUserController from './promotion-code.user.controller';
import { auth } from '../../commons/middlewares';
import promotionCodeAdminController from './promotion-code.admin.controller';
import promotionCodeOwnerController from './promotion-code.owner.controller';
import joiValidate from '../../commons/middlewares/joi.validate';
import promotionCodeValidate from './promotion-code.validate';
import { promotionCodeRouterV2 } from './v2/promotion-code.router';

const router = Router();
const userRouter = Router();
const adminRouter = Router();
const ownerRouter = Router();

// user
userRouter.post(
  '/',
  joiValidate.validate('body', promotionCodeValidate.user.createSchema),
  // auth.isBasicUser('promotion_id'),
  promotionCodeUserController.create
);

userRouter.get(
  '/',
  joiValidate.validate('query', promotionCodeValidate.user.findSchema),
  // auth.isOwner('promotion_id','query','promotion'),
  promotionCodeUserController.find
);

// userRouter.get(
//   '/auto-get',
//   joiValidate.validate('query', promotionCodeValidate.user.autoGetSchema),
//   promotionCodeUserController.autoGet
// );

userRouter.get(
  '/:id',
  joiValidate.validate('params', promotionCodeValidate.idSchema),
  // auth.isOwner('id','params','promotion-code'),
  promotionCodeUserController.findById
);

userRouter.get(
  '/used/:code',
  joiValidate.validate('params', promotionCodeValidate.user.userUsedSchema),
  promotionCodeUserController.userUsed
);

//owner
ownerRouter.get(
  '/',
  joiValidate.validate('query', promotionCodeValidate.owner.ownerFindSchema),
  promotionCodeOwnerController.find
);

ownerRouter.get(
  '/:id',
  joiValidate.validate('params', promotionCodeValidate.idSchema),
  // auth.isOwner('id', 'params', 'promotion-code'),
  promotionCodeOwnerController.findById
);

//admin
adminRouter.get(
  '/',
  joiValidate.validate('query', promotionCodeValidate.admin.adminFindSchema),
  promotionCodeAdminController.find
);

adminRouter.get(
  '/:id',
  joiValidate.validate('params', promotionCodeValidate.idSchema),
  promotionCodeAdminController.findById
);

router.use('/user', auth.isAuthorized, userRouter);
router.use('/owner', auth.isAuthorized, ownerRouter);
router.use('/admin', auth.isAdminAuthorized, adminRouter);
router.use('/v2', promotionCodeRouterV2);

export { router as promotionCodeRouter };
