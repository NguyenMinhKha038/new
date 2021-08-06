import express from 'express';
import { user, admin, auth, permission, groupPermisson } from './commons';
import { auth as AuthMiddleware } from './commons/middlewares';
// import videoRoutes from './video/routes';
import searchRoutes from './search/routes';
import { configRouter } from './commons/config';
import { userRouter } from './commons/user/user.router';
import { userSmsRouter } from './commons/user-sms/user-sms.router';
const router = express.Router();

router.use('/auth', auth.router);

router.use('/admin', AuthMiddleware.isAdminAuthorized, admin.router);

router.use('/user', userRouter);

// router.use('/mod', mod.router.adminRouter);

// router.use('/user/admin',  user.router.adminRouter);

router.use(
  '/permission/admin',
  AuthMiddleware.isAdminAuthorized,
  AuthMiddleware.isAdminPermission,
  permission.router.adminRouter
);

router.use(
  '/permission-group',
  AuthMiddleware.isAdminAuthorized,
  AuthMiddleware.isAdminPermission,
  groupPermisson.router
);

router.use('/config', configRouter);

router.use('/user-sms/', userSmsRouter);

// router.use('/v_', videoRoutes);

router.use('/s_', searchRoutes);

export default router;
