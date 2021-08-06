import { Router } from 'express';
import topupValidation from './topup.validation';
import topupController from './topup.controller';
import { auth, isValid } from '../../commons/middlewares';

export const router = Router(),
  user = Router(),
  admin = Router();

user.post('/pay', isValid(topupValidation.user.pay), topupController.user.pay);
user.post('/checkout', isValid(topupValidation.user.checkout), topupController.user.checkout);

user.get('/combo', isValid(topupValidation.user.getCombo), topupController.get('user', 'combo'));
user.get('/combo/:id', isValid(topupValidation.getById), topupController.getById('user', 'combo'));
user.get('/', isValid(topupValidation.user.get), topupController.get('user', 'topup'));
user.get('/:id', isValid(topupValidation.getById), topupController.getById('user', 'topup'));

admin.get('/combo', isValid(topupValidation.admin.getCombo), topupController.get('admin', 'combo'));
admin.get(
  '/combo/:id',
  isValid(topupValidation.getById),
  topupController.getById('admin', 'combo')
);
admin.get('/', isValid(topupValidation.admin.get), topupController.get('admin', 'topup'));
admin.get('/:id', isValid(topupValidation.getById), topupController.getById('admin', 'topup'));

admin.post('/manual-pay/:id', isValid(topupValidation.getById), topupController.admin.manualPay);

router.use('/user', auth.isAuthorized, user);
router.use('/admin', auth.isAdminAuthorized, auth.isAdminPermission, admin);

export { router as topupRouter };
