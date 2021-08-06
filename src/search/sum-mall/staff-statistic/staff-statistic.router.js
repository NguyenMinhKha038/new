import { Router } from 'express';
import mallStaffStatisticValidation from './staff-statistic.validation';
import mallStaffStatisticController from './staff-statistic.controller';
import { isValid, auth } from '../../../commons/middlewares';
import { MallStaffRoles } from '../staff/staff.config';

const router = Router(),
  admin = Router(),
  mall = Router(),
  staff = Router();

admin.get(
  '/',
  isValid(mallStaffStatisticValidation.admin.get),
  mallStaffStatisticController.admin.get
);
mall.get(
  '/',
  isValid(mallStaffStatisticValidation.mall.get),
  mallStaffStatisticController.mall.get
);
staff.get(
  '/',
  isValid(mallStaffStatisticValidation.staff.get),
  mallStaffStatisticController.staff.get
);

router.use('/admin', auth.isAdminAuthorized, auth.isAdminPermission, admin);
router.use(
  '/mall',
  auth.isAuthorized,
  auth.isMallModPermission([MallStaffRoles.MallManager, MallStaffRoles.MallStaff]),
  mall
);
router.use('/staff', auth.isAuthorized, auth.isMallModPermission(), staff);

export { router as mallStaffStatisticRouter };
