import express from 'express';
import Admin from './admin.controller';
import AuthMiddleware from '../middlewares/auth';
import { joiValidate } from '../middlewares';
import adminValidate from './admin.validate';
import adminActivityRouter from '../admin-activity/admin-activity.router';
const router = express.Router();

router.get(
  '/',
  AuthMiddleware.isAdminPermission,
  joiValidate.validate('query', adminValidate.get),
  Admin.get
);
router.get('/get-admins', AuthMiddleware.isAdminPermission, Admin.findAllAdmin);
router.get('/get-admin/:id', Admin.getAdminbyId);
router.get('/free-admin', AuthMiddleware.isAdminPermission, Admin.getFreeAdmin);
// router.get('/member-of-group/:id', AuthMiddleware.isAdminPermission, Admin.getMemberOfGroupPermisison);

router.post('/out-group/:id', AuthMiddleware.isAdminPermission, Admin.outOfPermissionGroup);
router.post('/create-new', AuthMiddleware.isAdminPermission, Admin.createNewAdmin);
router.post('/delete-admin', AuthMiddleware.isAdminPermission, Admin.deleteAdmin);
router.post('/set-status', AuthMiddleware.isAdminPermission, Admin.setStatus);
router.post('/change-password', Admin.changePassword);
router.post(
  '/update-permission-group',
  AuthMiddleware.isAdminPermission,
  Admin.updatePermissionGroupId
);

router.use('/activities', adminActivityRouter);

export default router;
