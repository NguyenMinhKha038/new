import { Router } from 'express';
import AuthMiddleware from '../../commons/middlewares/auth';
import joiValidate from '../../commons/middlewares/joi.validate';
import promotionProductValidate from './promotionProduct.validate';
import promotionProductController from './promotionProduct.controller';

const router = Router();
const adminRouter = Router();
const companyRouter = Router();

companyRouter.get(
  '/',
  joiValidate.validate('query', promotionProductValidate.find),
  promotionProductController.find
);

router.use('/company', AuthMiddleware.isAuthorized, companyRouter);

export { router as promotionProductStatisticRouter };
