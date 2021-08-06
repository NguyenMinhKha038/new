import { Router } from 'express';
import mallStaffValidation from './staff.validation';
import mallStaffController from './staff.controller';
import { isValid, auth } from '../../../commons/middlewares';
import { MallStaffRoles } from './staff.config';

const router = Router(),
  admin = Router(),
  mall = Router(),
  staff = Router();

admin.get('/search', isValid(mallStaffValidation.search), mallStaffController.admin.search);
admin.get('/', isValid(mallStaffValidation.admin.get), mallStaffController.admin.get);
admin.get('/:id', isValid(mallStaffValidation.admin.getById), mallStaffController.admin.getById);
admin.put(
  '/:id',
  isValid(mallStaffValidation.admin.updateManagerStatus),
  mallStaffController.admin.updateManagerStatus
);

mall.put('/:id', isValid(mallStaffValidation.mall.update), mallStaffController.mall.update);
mall.post('/', isValid(mallStaffValidation.mall.create), mallStaffController.mall.create);
mall.get('/', isValid(mallStaffValidation.mall.get), mallStaffController.mall.get);
mall.get('/search', isValid(mallStaffValidation.search), mallStaffController.mall.search);
mall.get('/:id', isValid(mallStaffValidation.mall.getById), mallStaffController.mall.getById);

staff.get('/', isValid(mallStaffValidation.staff.get), mallStaffController.staff.get);
staff.get('/me', mallStaffController.staff.getMyInfo);
staff.get('/:id', isValid(mallStaffValidation.staff.getById), mallStaffController.staff.getById);

router.use('/admin', auth.isAdminAuthorized, auth.isAdminPermission, admin);
router.use(
  '/mall',
  auth.isAuthorized,
  auth.isMallModPermission([MallStaffRoles.MallManager, MallStaffRoles.MallStaff]),
  mall
);
router.use('/staff', auth.isAuthorized, auth.isMallModPermission(), staff);

export { router as mallStaffRouter };
