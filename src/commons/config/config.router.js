import { Router } from 'express';
import configController from './config.controller';
import configValidation from './config.validation';
import isValid from '../middlewares/validator';
import { auth as AuthMiddleware } from '../middlewares';

const router = Router();

router.get('/init', configController.init);
router.get('/', isValid(configValidation.get), configController.get);
router.get('/:key', configController.getByKey);
router.post(
  '/',
  AuthMiddleware.isAdminAuthorized,
  AuthMiddleware.isAdminPermission,
  isValid(configValidation.create),
  configController.create
);

router.put(
  '/app-version',
  AuthMiddleware.isAdminAuthorized,
  AuthMiddleware.isAdminPermission,
  isValid(configValidation.updateAppVersion),
  configController.updateAppVersion
);

router.put(
  '/',
  AuthMiddleware.isAdminAuthorized,
  AuthMiddleware.isAdminPermission,
  isValid(configValidation.update),
  configController.update
);

router.put(
  '/topup',
  AuthMiddleware.isAdminAuthorized,
  AuthMiddleware.isAdminPermission,
  configController.updateTopupConfig
);
router.delete(
  '/',
  AuthMiddleware.isAdminAuthorized,
  AuthMiddleware.isAdminPermission,
  isValid(configValidation.delete),
  configController.delete
);

export default router;
