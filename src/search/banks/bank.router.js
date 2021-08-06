import { Router } from 'express';
import joiValidate from '../../commons/middlewares/joi.validate';
import bankController from './bank.controller';
import bankValidation from './bank.validation';

const router = Router();
const userRouter = Router();

userRouter.get('/banks', bankController.getBankList);
userRouter.get(
  '/provinces',
  joiValidate.validate('query', bankValidation.getProvinceList),
  bankController.getProvinceList
);
userRouter.get(
  '/districts',
  joiValidate.validate('query', bankValidation.getDistrictList),
  bankController.getDistrictList
);
userRouter.get(
  '/branches',
  joiValidate.validate('query', bankValidation.getBranchList),
  bankController.getBranchList
);

router.use('/', userRouter);

export { router as bankRouter };
