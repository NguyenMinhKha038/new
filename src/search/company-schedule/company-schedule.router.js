import { Router } from 'express';
import { auth, isValid } from '../../commons/middlewares';
import companyScheduleValidation from './company-schedule.validation';
import companyScheduleController from './company-schedule.controller';
import { companyStaffRoles } from './company-schedule.config';
import companyScheduleV2 from './v2/company-schedule.router';

const router = Router(),
  admin = Router(),
  company = Router(),
  staff = Router();

admin.get('/', isValid(companyScheduleValidation.admin.get), companyScheduleController.admin.get);
admin.get(
  '/:id',
  isValid(companyScheduleValidation.admin.getById),
  companyScheduleController.admin.getById
);

company.get(
  '/',
  isValid(companyScheduleValidation.company.get),
  companyScheduleController.company.get
);
company.get(
  '/:id',
  isValid(companyScheduleValidation.company.getById),
  companyScheduleController.company.getById
);
company.put(
  '/status/:id',
  isValid(companyScheduleValidation.company.updateStatus),
  companyScheduleController.company.updateStatus
);
company.put(
  '/:id',
  isValid(companyScheduleValidation.company.update),
  companyScheduleController.company.update
);
company.post(
  '/',
  isValid(companyScheduleValidation.company.create),
  companyScheduleController.company.create
);

staff.get('/', isValid(companyScheduleValidation.staff.get), companyScheduleController.staff.get);
staff.put(
  '/status/:id',
  isValid(companyScheduleValidation.staff.updateStatus),
  companyScheduleController.staff.updateStatus
);
staff.get(
  '/:id',
  isValid(companyScheduleValidation.staff.getById),
  companyScheduleController.staff.getById
);
staff.post(
  '/',
  isValid(companyScheduleValidation.staff.update),
  companyScheduleController.staff.update
);

router.use('/admin', auth.isAdminAuthorized, auth.isAdminPermission, admin);
router.use('/company', auth.isAuthorized, auth.isCompanyModPermission, company);
router.use('/staff', auth.isAuthorized, auth.isCompanyStaff, staff);

router.use('/v2', companyScheduleV2);
export { router as companyScheduleRouter };
