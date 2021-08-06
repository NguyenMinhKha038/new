import { Router } from 'express';
import { isValid, auth } from '../../commons/middlewares';
import userHistoryValidation from './user-history.validation';
import userHistoryController from './user-history.controller';

const router = Router(),
  admin = Router(),
  company = Router(),
  user = Router();

admin.get('/', isValid(userHistoryValidation.admin.get), userHistoryController.admin.get);
user.get('/', isValid(userHistoryValidation.user.get), userHistoryController.user.get);

router.use('/admin', auth.isAdminAuthorized, auth.isAdminPermission, admin);
router.use('/user', auth.isAuthorized, user);

export { router as userHistoryRouter };
