import { Router } from 'express';
import { auth, isValid } from '../../../commons/middlewares';
import staffCheckInValidation from './staff-check-in.validation';
import staffCheckInController from './staff-check-in.controller';
import { MallStaffRoles } from '../staff/staff.config';

const router = Router(),
  admin = Router(),
  mall = Router(),
  staff = Router();

admin.get('/', isValid(staffCheckInValidation.admin.get), staffCheckInController.admin.get);
admin.get(
  '/:id',
  isValid(staffCheckInValidation.admin.getById),
  staffCheckInController.admin.getById
);

mall.get('/', isValid(staffCheckInValidation.mall.get), staffCheckInController.mall.get);
mall.get('/:id', isValid(staffCheckInValidation.mall.getById), staffCheckInController.mall.getById);
mall.post('/', isValid(staffCheckInValidation.mall.checkIn), staffCheckInController.mall.checkIn);
mall.put('/:id', isValid(staffCheckInValidation.mall.update), staffCheckInController.mall.update);
mall.get(
  '/checkout/:id',
  isValid(staffCheckInValidation.mall.checkout),
  staffCheckInController.mall.checkout
);

staff.get('/', isValid(staffCheckInValidation.staff.get), staffCheckInController.staff.get);
staff.get(
  '/:id',
  isValid(staffCheckInValidation.staff.getById),
  staffCheckInController.staff.getById
);
staff.post(
  '/',
  isValid(staffCheckInValidation.staff.checkIn),
  staffCheckInController.staff.checkIn
);
// staff.put(
//   '/:id',
//   isValid(staffCheckInValidation.staff.update),
//   staffCheckInController.staff.update
// );
staff.get(
  '/checkout/:id',
  isValid(staffCheckInValidation.staff.checkout),
  staffCheckInController.staff.checkout
);

router.use('/admin', auth.isAdminAuthorized, auth.isAdminPermission, admin);
router.use(
  '/mall',
  auth.isAuthorized,
  auth.isMallModPermission([MallStaffRoles.MallManager, MallStaffRoles.MallWorking]),
  mall
);
router.use('/staff', auth.isAuthorized, auth.isMallModPermission(), staff);
export { router as staffCheckInRouter };
