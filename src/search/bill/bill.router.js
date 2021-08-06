import { Router } from 'express';
import { isValid, auth } from '../../commons/middlewares';
import billValidation from './bill.validation';
import billController from './bill.controller';

const router = Router(),
  user = Router(),
  admin = Router();

/** get payment bill */
user.get('/query', isValid(billValidation.user.queryBill), billController.user.queryBill);
/** pay bill */
user.post('/pay', isValid(billValidation.user.payBill), billController.user.payBill);
user.get('/', isValid(billValidation.user.get), billController.get('user'));
user.get('/:id', isValid(billValidation.getById), billController.getById('user'));

admin.get('/', isValid(billValidation.admin.get), billController.get('admin'));
admin.get('/:id', isValid(billValidation.getById), billController.getById('admin'));

router.use('/user', auth.isAuthorized, user);
router.use('/admin', auth.isAdminAuthorized, auth.isAdminPermission, admin);

export { router as billRouter };
