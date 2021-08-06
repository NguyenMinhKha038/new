import { Router } from 'express';
import settingController from './setting.controller';
import { auth, isValid } from '../../commons/middlewares';
import settingValidation from './setting.validation';

const router = Router(),
  company = Router();

company.get('/', settingController.company.get);
company.post('/', isValid(settingValidation.post), settingController.company.post);
company.post(
  '/discount-transport',
  isValid(settingValidation.addDiscountTransport),
  settingController.company.addDiscountTransport
);
company.put(
  '/discount-transport',
  isValid(settingValidation.updateDiscountTransport),
  settingController.company.updateDiscountTransport
);
company.delete(
  '/discount-transport',
  isValid(settingValidation.removeDiscountTransport),
  settingController.company.removeDiscountTransport
);
router.get('/', isValid(settingValidation.get), settingController.get);
router.use('/company', auth.isAuthorized, auth.isCompanyModPermission, company);

export { router as settingRouter };
