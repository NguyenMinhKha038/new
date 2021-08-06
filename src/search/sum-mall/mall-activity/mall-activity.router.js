import { Router } from 'express';
import mallActivityController from './mall-activity.controller';
import mallActivityValidation from './mall-activity.validation';
import { auth, isValid } from '../../../commons/middlewares';
import { MallStaffRoles } from '../staff/staff.config';

const mall = Router(),
  admin = Router(),
  router = Router();

admin.get('/', isValid(mallActivityValidation.admin.get), mallActivityController.admin.get);
admin.get(
  '/:id',
  isValid(mallActivityValidation.admin.getById),
  mallActivityController.admin.getById
);

mall.get('/', isValid(mallActivityValidation.mall.get), mallActivityController.mall.get);
mall.get('/:id', isValid(mallActivityValidation.mall.getById), mallActivityController.mall.getById);

router.use(
  '/mall',
  auth.isAuthorized,
  auth.isMallModPermission([MallStaffRoles.MallManager]),
  mall
);
router.use('/admin', auth.isAdminAuthorized, auth.isAdminPermission, admin);

export { router as mallActivityRouter };
