import { Router } from 'express';
import { auth, isValid } from '../../commons/middlewares';
import stockController from './stock.controller';
import stockValidation from './stock.validation';

const companyRouter = Router();
const router = Router();

companyRouter.post(
  '/request-move',
  isValid(stockValidation.company.requestMove),
  stockController.company.createMoveStockRequest
);
companyRouter.post(
  '/confirm-move',
  isValid(stockValidation.company.confirmMove),
  stockController.company.confirmMoveStockRequest
);
companyRouter.post(
  '/approve-move',
  isValid(stockValidation.company.approveMove),
  stockController.company.approveMoveStockRequest
);
companyRouter.post(
  '/update-stock',
  isValid(stockValidation.company.updateStock),
  stockController.company.updateStock
);

router.use('/company', auth.isAuthorized, auth.isCompanyModPermission, companyRouter);

export { router as stockRouter };
