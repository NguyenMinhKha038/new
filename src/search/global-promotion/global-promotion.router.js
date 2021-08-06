import { Router } from 'express';
import { auth, isValid } from '../../commons/middlewares';
import globalPromotionValidation from './global-promotion.validation';
import globalPromotionController from './global-promotion.controller';

const router = Router();
const admin = Router();
const company = Router();

admin.get('/', isValid(globalPromotionValidation.admin.get), globalPromotionController.admin.get);
admin.post(
  '/',
  isValid(globalPromotionValidation.admin.create),
  globalPromotionController.admin.create
);
admin.put(
  '/:id',
  isValid(globalPromotionValidation.admin.update),
  globalPromotionController.admin.update
);
admin.get(
  '/search',
  isValid(globalPromotionValidation.search),
  globalPromotionController.admin.search
);
admin.get(
  '/:id',
  isValid(globalPromotionValidation.getById),
  globalPromotionController.admin.getById
);
admin.put(
  '/update-status/:id',
  isValid(globalPromotionValidation.admin.updateStatus),
  globalPromotionController.admin.updateStatus
);
company.get(
  '/running',
  isValid(globalPromotionValidation.company.get),
  globalPromotionController.company.getRunning
);
company.get(
  '/suitable',
  isValid(globalPromotionValidation.company.get),
  globalPromotionController.company.getSuitable
);
company.get(
  '/search',
  isValid(globalPromotionValidation.search),
  globalPromotionController.company.search
);
company.get(
  '/:id',
  isValid(globalPromotionValidation.getById),
  globalPromotionController.company.getById
);

router.use('/admin', auth.isAdminAuthorized, auth.isAdminPermission, admin);
router.use('/company', auth.isAuthorized, auth.isCompanyModPermission, company);

export { router as globalPromotionRouter };
