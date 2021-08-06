import { Router } from 'express';
import { auth, isValid } from '../../commons/middlewares';
import { isMallModPermission } from '../../commons/middlewares/auth';
import goodsBatchMiddleware from '../goods-batch/goods-batch.middleware';
import { AllowedStaffRole } from './stock-checking.config';
import stockCheckingController from './stock-checking.controller';
import stockCheckingValidation from './stock-checking.validation';

const router = Router();
const companyRouter = Router();
const companyMallRouter = Router();

companyRouter
  .route('/')
  .post(isValid(stockCheckingValidation.company.create), stockCheckingController.company.create)
  .get(isValid(stockCheckingValidation.company.get), stockCheckingController.company.get);

companyRouter
  .route('/:id')
  .put(isValid(stockCheckingValidation.company.update), stockCheckingController.company.update)
  .get(isValid(stockCheckingValidation.company.getById), stockCheckingController.company.getById);

router.use(
  '/company',
  auth.isAuthorized,
  auth.isCompanyModPermission,
  auth.hasStockPermission,
  companyRouter
);

companyMallRouter
  .route('/')
  .post(
    isValid(stockCheckingValidation.company_mall.create),
    stockCheckingController.company_mall.create
  )
  .get(isValid(stockCheckingValidation.company_mall.get), stockCheckingController.company_mall.get);

companyMallRouter
  .route('/:id')
  .put(
    isValid(stockCheckingValidation.company_mall.update),
    stockCheckingController.company_mall.update
  )
  .get(
    isValid(stockCheckingValidation.company_mall.getById),
    stockCheckingController.company_mall.getById
  );

router.use(
  '/company-mall',
  auth.isAuthorized,
  isMallModPermission([AllowedStaffRole.MallManager, AllowedStaffRole.MallStock]),
  companyMallRouter
);

export { router as stockCheckingRouter };
