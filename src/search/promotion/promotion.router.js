import { Router } from 'express';
import AuthMiddleware from '../../commons/middlewares/auth';
import promotionOwnerController from './promotion.owner.controller';
import promotionUserController from './promotion.user.controller';
import promotionAdminController from './promotion.admin.controller';
import promotionValidate from './promotion.validate';
import joiValidate from '../../commons/middlewares/joi.validate';
import { promotionV2 } from './v2';

const router = Router();
const userRouter = Router();
const adminRouter = Router();
const ownerRouter = Router();

//user
userRouter.get(
  '/',
  joiValidate.validate('query', promotionValidate.user.findSchema),
  promotionUserController.find
);
userRouter.get(
  '/:id',
  joiValidate.validate('params', promotionValidate.idSchema),
  promotionUserController.findById
);

// owner

ownerRouter.get(
  '/statistic',
  joiValidate.validate('query', promotionValidate.owner.findStatisticSchema),
  promotionOwnerController.findStatistic
);

ownerRouter.get(
  '/:id',
  joiValidate.validate('params', promotionValidate.idSchema),
  // AuthMiddleware.isOwner('id', 'params', 'promotion'),
  promotionOwnerController.findById
);

ownerRouter.get(
  '/',
  joiValidate.validate('query', promotionValidate.owner.findByOwnerSchema),
  promotionOwnerController.find
);

ownerRouter.post(
  '/',
  // AuthMiddleware.canCompanyEnter('approved'),
  joiValidate.validate('body', promotionValidate.owner.createdSchema),
  promotionOwnerController.create
);

ownerRouter.put(
  '/disabled',
  joiValidate.validate('body', promotionValidate.owner.updateStatusSchema),
  // AuthMiddleware.isOwner('id', 'body', 'promotion'),
  promotionOwnerController.updateStatus
);

//admin
adminRouter.get(
  '/',
  joiValidate.validate('query', promotionValidate.admin.findByAdminSchema),
  promotionAdminController.find
);
adminRouter.get(
  '/:id',
  joiValidate.validate('params', promotionValidate.idSchema),
  promotionAdminController.findById
);
adminRouter.delete(
  '/:id',
  joiValidate.validate('params', promotionValidate.idSchema),
  promotionAdminController.findOneAndDelete
);

router.use('/user', AuthMiddleware.isAuthorized, userRouter);
router.use(
  '/owner',
  AuthMiddleware.isAuthorized,
  AuthMiddleware.isCompanyModPermission,
  ownerRouter
); //authen is owner?????
router.use(
  '/admin',
  AuthMiddleware.isAdminAuthorized,
  AuthMiddleware.isAdminPermission,
  adminRouter
);
router.use('/v2', promotionV2.promotionRouterV2);

export { router as promotionRouter };
