import { Router } from 'express';
import { isValid, auth } from '../../commons/middlewares';
import companyHistoryController from './company-history.controller';
import companyHistoryValidation from './company-history.validation';

const router = Router(),
  admin = Router();

admin.get('/', isValid(companyHistoryValidation.admin.get), companyHistoryController.admin.get);
router.get(
  '/',
  isValid(companyHistoryValidation.company.get),
  auth.isAuthorized,
  auth.isCompanyModPermission,
  companyHistoryController.company.get
);

router.use('/admin', auth.isAdminAuthorized, auth.isAdminPermission, admin);

export { router as companyHistoryRouter };
