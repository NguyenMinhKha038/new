import { Router } from 'express';
import { auth, isValid } from '../../commons/middlewares';
import productStockHistoryValidate from './product-stock-history.validate';
import productStockControllerCompany from './product-stock-history.controller.company';

import productStockHistoryRouterV2 from './v2/product-stock-history.router';

const companyRouter = Router();
const router = Router();

companyRouter.get(
  '/get-histories',
  isValid(productStockHistoryValidate.getHistories),
  productStockControllerCompany.getHistories
);

companyRouter.get(
  '/get-history/:id',
  isValid(productStockHistoryValidate.getHistoryById),
  productStockControllerCompany.getHistoryById
);

router.use('/company', auth.isAuthorized, auth.isCompanyModPermission, companyRouter);
router.use('/v2', productStockHistoryRouterV2);

export { router as productStockHistoryRouter };
