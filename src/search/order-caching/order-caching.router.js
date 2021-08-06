import { Router } from 'express';
import orderCachingController from './order-caching.controller';
import { auth, isValid } from '../../commons/middlewares';
import orderCachingValidation from './order-caching.validation';
import sanitizeRequestBody from '../../commons/middlewares/sanitize-request-body';

const router = Router();
const userRouter = Router();
const companyRouter = Router();
const mallRouter = Router();
const adminRouter = Router();

// USER ROUTES --
userRouter.get(
  '/id/:id',
  isValid(orderCachingValidation.getById),
  orderCachingController.user.getById
);

userRouter.get(
  '/code/:code',
  isValid(orderCachingValidation.getByCode),
  orderCachingController.user.getByCode
);

userRouter.get(
  '/refresh/:id',
  isValid(orderCachingValidation.user.getRefresh),
  orderCachingController.user.getRefresh
);

userRouter.post(
  '/offline/create',
  sanitizeRequestBody,
  isValid(orderCachingValidation.user.createOffline),
  orderCachingController.user.createOffline
);

userRouter.put(
  '/offline/:id',
  sanitizeRequestBody,
  isValid(orderCachingValidation.user.updateOffline),
  orderCachingController.user.updateOffline
);
// --

// COMPANY ROUTES --
companyRouter.get(
  '/id/:id',
  isValid(orderCachingValidation.getById),
  orderCachingController.company.getById
);

companyRouter.get(
  '/code/:code',
  isValid(orderCachingValidation.getByCode),
  orderCachingController.company.getByCode
);

companyRouter.get(
  '/refresh/:id',
  isValid(orderCachingValidation.company.getRefresh),
  orderCachingController.company.getRefresh
);

companyRouter.get('/', isValid(orderCachingValidation.get), orderCachingController.company.get);

companyRouter.post(
  '/offline/create',
  // auth.canCompanyEnter(['approved']),
  sanitizeRequestBody,
  isValid(orderCachingValidation.company.createOffline),
  orderCachingController.company.createOffline
);

companyRouter.put(
  '/offline/:id',
  // auth.canCompanyEnter(['approved']),
  sanitizeRequestBody,
  isValid(orderCachingValidation.company.updateOffline),
  orderCachingController.company.updateOffline
);
// --

// MALL ROUTES --
// pending...
// --

// ADMIN ROUTES --
adminRouter.get(
  '/id/:id',
  isValid(orderCachingValidation.getById),
  orderCachingController.admin.getById
);

adminRouter.get(
  '/code/:code',
  isValid(orderCachingValidation.getByCode),
  orderCachingController.admin.getByCode
);

adminRouter.get('/', isValid(orderCachingValidation.get), orderCachingController.admin.get);
// --

router.use('/user', auth.isAuthorized, userRouter);
router.use('/company', auth.isAuthorized, auth.isCompanyModPermission, companyRouter);
// router.use('/mall', auth.isAuthorized, auth.isMallModPermission, mallRouter);
router.use('/admin', auth.isAdminAuthorized, auth.isAdminPermission, adminRouter);

export { router as orderCachingRouter };
export default router;
