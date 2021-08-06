import { Router } from 'express';
import { auth, isValid } from '../../../commons/middlewares';
import workScheduleValidation from './work-schedule.validation';
import workScheduleController from './work-schedule.controller';
import { MallStaffRoles } from '../staff/staff.config';

const router = Router(),
  admin = Router(),
  mall = Router(),
  staff = Router();

admin.get('/', isValid(workScheduleValidation.admin.get), workScheduleController.admin.get);
admin.get(
  '/:id',
  isValid(workScheduleValidation.admin.getById),
  workScheduleController.admin.getById
);

mall.get('/', isValid(workScheduleValidation.mall.get), workScheduleController.mall.get);
mall.get('/:id', isValid(workScheduleValidation.mall.getById), workScheduleController.mall.getById);
mall.put(
  '/status/:id',
  isValid(workScheduleValidation.mall.updateStatus),
  workScheduleController.mall.updateStatus
);
mall.put('/', isValid(workScheduleValidation.mall.update), workScheduleController.mall.update);
mall.post('/', isValid(workScheduleValidation.mall.create), workScheduleController.mall.create);

staff.get('/', isValid(workScheduleValidation.staff.get), workScheduleController.staff.get);
staff.put(
  '/status/:id',
  isValid(workScheduleValidation.staff.updateStatus),
  workScheduleController.staff.updateStatus
);
staff.get(
  '/:id',
  isValid(workScheduleValidation.staff.getById),
  workScheduleController.staff.getById
);
// staff.post(
//   '/',
//   isValid(workScheduleValidation.staff.register),
//   workScheduleController.staff.register
// );
staff.put('/', isValid(workScheduleValidation.staff.update), workScheduleController.staff.update);

router.use('/admin', auth.isAdminAuthorized, auth.isAdminPermission, admin);
router.use(
  '/mall',
  auth.isAuthorized,
  auth.isMallModPermission([MallStaffRoles.MallManager, MallStaffRoles.MallStaff]),
  mall
);
router.use('/staff', auth.isAuthorized, auth.isMallModPermission(), staff);

export { router as workScheduleRouter };
