import { Router } from 'express';
import { isValid, auth } from '../../commons/middlewares';
import notificationValidation from './notification.validation';
import notificationController from './notification.controller';
import { MallStaffRoles } from '../sum-mall/staff/staff.config';
import { MallStaffRole } from '../permission-group/permission-group.config';

const router = Router(),
  user = Router(),
  company = Router(),
  mall = Router();

company.get('/', isValid(notificationValidation.company.get), notificationController.company.get);
company.get(
  '/:id',
  isValid(notificationValidation.company.getById),
  notificationController.company.getById
);
user.get('/', isValid(notificationValidation.user.get), notificationController.user.get);
user.post('/mark-read', isValid(notificationValidation.read), notificationController.markRead);
company.post(
  '/device',
  isValid(notificationValidation.company.updateDevice),
  notificationController.company.updateDevice
);
company.post('/mark-read', isValid(notificationValidation.read), notificationController.markRead);

mall.post(
  '/device',
  isValid(notificationValidation.mall.updateDevice),
  notificationController.mall.updateDevice
);
mall.post('/mark-read', isValid(notificationValidation.read), notificationController.markRead);

router.post(
  '/user/device',
  auth.noNeedAuthorized,
  isValid(notificationValidation.user.updateDevice),
  notificationController.user.updateDevice
);

router.use('/company', auth.isAuthorized, auth.isCompanyModPermission, company);
router.use('/user', auth.isAuthorized, user);
router.use(
  '/mall',
  auth.isAuthorized,
  auth.isMallModPermission([MallStaffRoles.MallManager]),
  mall
);

export { router as notificationRouter };

/* 
+ notification when company (followed) up new product
+ notification about state of order
*/
