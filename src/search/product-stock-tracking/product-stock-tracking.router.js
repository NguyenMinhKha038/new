import { Router } from 'express';
import productStockTrackingValidation from './product-stock-tracking.validation';
import productStockTrackingController from './product-stock-tracking.controller';
import { isValid, auth } from '../../commons/middlewares';

const router = Router();
const companyRouter = Router();

// Company --
companyRouter.get(
  '/all',
  isValid(productStockTrackingValidation.company.getStockChecking),
  productStockTrackingController.company.getStockChecking
);
companyRouter.get(
  '/detail',
  isValid(productStockTrackingValidation.company.getStockCheckingForOneProduct),
  productStockTrackingController.company.getStockCheckingForOneProduct
);

// For sales management
companyRouter.get(
  '/sales/all',
  isValid(productStockTrackingValidation.company.getOnSalesChecking),
  productStockTrackingController.company.getOnSalesChecking
);
companyRouter.get(
  '/sales/detail',
  isValid(productStockTrackingValidation.company.getOnSalesCheckingForOneProduct),
  productStockTrackingController.company.getOnSalesCheckingForOneProduct
);
// --

router.use('/company', auth.isAuthorized, auth.isCompanyModPermission, companyRouter);

export { router as productStockTrackingRouter };
