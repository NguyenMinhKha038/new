import { Router } from 'express';
import orderControllerV2 from './order.controller';
import orderValidationV2 from './order.validation';
import { auth, isValid, sanitizeRequestBody } from '../../../commons/middlewares';

const router = Router();
const userRouter = Router();
const companyRouter = Router();
const mallRouter = Router();
const adminRouter = Router();

// USER ROUTES --
userRouter.post(
  '/offline/pay/:code',
  isValid(orderValidationV2.user.payOffline),
  orderControllerV2.user.payOffline
);
// --

// COMPANY ROUTES --
companyRouter.get(
  '/statistics/',
  isValid(orderValidationV2.company.getStatistics),
  orderControllerV2.company.getStatistics
);

companyRouter.get('/id/:id', isValid(orderValidationV2.getById), orderControllerV2.company.getById);

companyRouter.get(
  '/code/:code',
  isValid(orderValidationV2.getByCode),
  orderControllerV2.company.getByCode
);

companyRouter.get('/', isValid(orderValidationV2.get), orderControllerV2.company.get);

companyRouter.put(
  '/:id',
  sanitizeRequestBody,
  isValid(orderValidationV2.company.update),
  orderControllerV2.company.update
);

companyRouter.post(
  '/offline/create',
  sanitizeRequestBody,
  isValid(orderValidationV2.company.createOffline),
  orderControllerV2.company.createOffline
);

companyRouter.post(
  '/pay/:code',
  isValid(orderValidationV2.company.pay),
  orderControllerV2.company.pay
);

companyRouter.post(
  '/offline/create-from-cache',
  sanitizeRequestBody,
  isValid(orderValidationV2.company.createOfflineFromCache),
  orderControllerV2.company.createOfflineFromCache
);
// --

// MALL ROUTES --
// pending...
// --

// ADMIN ROUTES --
// pending...
// --

// router.use('/user', auth.isAuthorized, userRouter);
router.use('/company', auth.isAuthorized, auth.isCompanyModPermission, companyRouter);
// router.use('/mall', auth.isAuthorized, auth.isMallModPermission, mallRouter);
// router.use('/admin', auth.isAdminAuthorized, auth.isAdminPermission, adminRouter);

export { router as orderRouterV2 };
export default router;
