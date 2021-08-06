import { Router } from 'express';
import { auth, isValid } from '../../commons/middlewares';
import stockCheckingItemValidation from './stock-checking-item.validation';
import stockCheckingItemController from './stock-checking-item.controller';

const router = Router();
const companyRouter = Router();

companyRouter
  .route('/:id')
  .put(
    isValid(stockCheckingItemValidation.company.update),
    stockCheckingItemController.company.update
  )
  .get(
    isValid(stockCheckingItemValidation.company.getById),
    stockCheckingItemController.company.getById
  );

companyRouter
  .route('/')
  .get(isValid(stockCheckingItemValidation.company.get), stockCheckingItemController.company.get)
  .put(
    isValid(stockCheckingItemValidation.company.updateMany),
    stockCheckingItemController.company.updateMany
  )
  .post(
    isValid(stockCheckingItemValidation.company.create),
    stockCheckingItemController.company.create
  );

router.use(
  '/company',
  auth.isAuthorized,
  auth.isCompanyModPermission,
  auth.canCompanyEnter('approved', 'suspend'),
  companyRouter
);

export { router as stockCheckingItemRouter };
