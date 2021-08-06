import { Router } from 'express';
import { isValid, auth } from '../../../commons/middlewares';
import mallValidation from './mall.validation';
import mallController from './mall.controller';
import { MallStaffRoles } from '../staff/staff.config';

const router = Router(),
  admin = Router(),
  mall = Router(),
  company = Router();

admin.get('/', isValid(mallValidation.admin.get), mallController.admin.get);
admin.post('/', isValid(mallValidation.admin.create), mallController.admin.create);
admin.get('/search', isValid(mallValidation.search), mallController.admin.search);
admin.get('/:id', isValid(mallValidation.admin.getById), mallController.admin.getById);
admin.put(
  '/:id',
  isValid(mallValidation.admin.updateMallManager),
  mallController.admin.updateMallManager
);
admin.put(
  '/status/:id',
  isValid(mallValidation.admin.updateStatus),
  mallController.admin.updateStatus
);

mall.get('/', isValid(mallValidation.mall.get), mallController.mall.get);
mall.get('/me', mallController.mall.getMyInfo);
mall.get('/:id', isValid(mallValidation.mall.getById), mallController.mall.getById);
mall.put('/:id', isValid(mallValidation.mall.update), mallController.mall.update);
mall.put(
  '/status/:id',
  isValid(mallValidation.mall.updateStatus),
  mallController.mall.updateStatus
);

company.get('/', mallController.get);

router.use('/admin', auth.isAdminAuthorized, auth.isAdminPermission, admin);
router.use(
  '/mall',
  auth.isAuthorized,
  auth.isMallModPermission([MallStaffRoles.MallManager]),
  mall
);
router.use('/company', auth.isAuthorized, auth.isCompanyModPermission, company);

// router.get('/', isValid(mallValidation.get), mallController.get);
router.get('/search', isValid(mallValidation.search), mallController.search);
router.get('/:id', isValid(mallValidation.getById), mallController.getById);

export { router as mallRouter };
