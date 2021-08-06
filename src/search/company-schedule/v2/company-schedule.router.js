import { Router } from 'express';
import { auth, isValid } from '../../../commons/middlewares';
import companyScheduleValidationV2 from './company-schedule.validation';
import companyScheduleControllerV2 from './company-schedule.controller';

const router = Router(),
  company = Router(),
  admin = Router();

admin.get(
  '/',
  isValid(companyScheduleValidationV2.admin.get),
  companyScheduleControllerV2.admin.get
);

company.get(
  '/',
  isValid(companyScheduleValidationV2.company.get),
  companyScheduleControllerV2.company.get
);

company.post(
  '/',
  isValid(companyScheduleValidationV2.company.create),
  companyScheduleControllerV2.company.create
);

company.put(
  '/',
  isValid(companyScheduleValidationV2.company.update),
  companyScheduleControllerV2.company.update
);
router.use('/admin', auth.isAdminAuthorized, auth.isAdminPermission, admin);
router.use('/company', auth.isAuthorized, auth.isCompanyModPermission, company);

export default router;
