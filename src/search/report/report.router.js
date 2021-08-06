import { Router } from 'express';
import reportValidation from './report.validation';
import reportController from './report.controller';
import { auth, isValid } from '../../commons/middlewares';

const router = Router(),
  user = Router(),
  admin = Router();

user.get('/', isValid(reportValidation.user.get), reportController.user.get);
user.get('/:id', isValid(reportValidation.user.getById), reportController.user.getById);
user.post('/', isValid(reportValidation.user.post), reportController.user.post);

admin.get('/', isValid(reportValidation.admin.get), reportController.admin.get);
admin.post('/confirm', isValid(reportValidation.admin.confirm), reportController.admin.confirm);
admin.get('/:id', isValid(reportValidation.admin.getById), reportController.admin.getById);
admin.put('/:id', isValid(reportValidation.admin.update), reportController.admin.update);

router.use('/user', auth.isAuthorized, user);
router.use('/admin', auth.isAdminAuthorized, auth.isAdminPermission, admin);

export { router as ReportRouter };
