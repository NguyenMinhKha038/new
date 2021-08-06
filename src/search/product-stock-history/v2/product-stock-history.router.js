import { Router } from 'express';
import { auth, isValid } from '../../../commons/middlewares';
import productStockHistoryValidationV2 from './product-stock-history.validation';
import productStockHistoryControllerV2 from './product-stock-history.controller';
import stockMiddleware from '../../goods-batch/goods-batch.middleware';

const companyMallRouter = Router();
const adminRouter = Router();
const router = Router();

companyMallRouter.get(
  '/',
  isValid(productStockHistoryValidationV2.get),
  productStockHistoryControllerV2.company_mall.get
);

companyMallRouter.get(
  '/:id',
  isValid(productStockHistoryValidationV2.getById),
  productStockHistoryControllerV2.company_mall.getById
);

adminRouter.get(
  '/',
  isValid(productStockHistoryValidationV2.get),
  productStockHistoryControllerV2.admin.get
);

adminRouter.get(
  '/:id',
  isValid(productStockHistoryValidationV2.getById),
  productStockHistoryControllerV2.admin.getById
);

router.use(
  '/company-mall',
  auth.isAuthorized,
  stockMiddleware.hasStockPermission,
  companyMallRouter
);
router.use('/admin', auth.isAdminAuthorized, auth.isAdminPermission, adminRouter);

export default router;
