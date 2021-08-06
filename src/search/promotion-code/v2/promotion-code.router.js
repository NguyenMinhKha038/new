import { Router } from 'express';
import { joiValidate, auth, isValid } from '../../../commons/middlewares';
import { autoGetSchema } from './promotion-code.validation';
import { promotionCodeControllerV2 } from './promotion-code.controller';
import globalPromotionCodeService from './global-promotion-code.service';
import globalPromotionCodeValidation from './global-promotion-code.validation';
import globalPromotionCodeController from './global-promotion-code.controller';

const router = Router();
const companyRouter = Router();
const userRouter = Router();

companyRouter.post(
  '/auto-get',
  joiValidate.validate('body', autoGetSchema),
  promotionCodeControllerV2.autoGet
);
userRouter.post(
  '/auto-get',
  isValid(globalPromotionCodeValidation.user.autoGet),
  globalPromotionCodeController.user.autoGet
);
router.use('/company', auth.isAuthorized, auth.isCompanyModPermission, companyRouter);
router.use('/user', auth.isAuthorized, userRouter);
export { router as promotionCodeRouterV2 };
