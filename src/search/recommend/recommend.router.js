import { Router } from 'express';
import { isValid, auth } from '../../commons/middlewares';
import recommendValidation from './recommend.validation';
import recommendController from './recommend.controller';

const router = Router();
const userRouter = Router();

userRouter.get(
  '/product',
  isValid(recommendValidation.product),
  recommendController.getRecommendedProducts
);

router.use('/user', auth.isAuthorized, userRouter);

export { router as recommendRouter };
