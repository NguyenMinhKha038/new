import { Router } from 'express';
import { auth, isValid } from '../../commons/middlewares';
import globalPromotionRegistrationController from './global-promotion-registration.controller';
import globalPromotionRegistrationValidation from './global-promotion-registration.validation';

const router = Router();
const admin = Router();
const company = Router();

admin.get(
  '/',
  isValid(globalPromotionRegistrationValidation.admin.get),
  globalPromotionRegistrationController.admin.get
);
admin.get(
  '/:id',
  isValid(globalPromotionRegistrationValidation.getById),
  globalPromotionRegistrationController.admin.getById
);
company.post(
  '/register',
  isValid(globalPromotionRegistrationValidation.company.register),
  globalPromotionRegistrationController.company.register
);
company.put(
  '/:id',
  isValid(globalPromotionRegistrationValidation.company.update),
  globalPromotionRegistrationController.company.update
);
company.get(
  '/:id',
  isValid(globalPromotionRegistrationValidation.getById),
  globalPromotionRegistrationController.company.getById
);
company.get(
  '/',
  isValid(globalPromotionRegistrationValidation.company.getMyRegistration),
  globalPromotionRegistrationController.company.getMyRegistration
);

router.use('/admin', auth.isAdminAuthorized, admin);
router.use('/company', auth.isAuthorized, auth.isCompanyModPermission, company);

export { router as globalPromotionRegistrationRouter };
