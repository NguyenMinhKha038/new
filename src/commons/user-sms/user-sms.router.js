import { Router } from 'express';
import { joiValidate, auth } from '../middlewares';
import userSmsValidate from './user-sms.validate';
import phoneFormat from '../middlewares/phone.format';
import userSmsController from './user-sms.controller';

const router = Router();
const admin = Router();

admin.get(
  '/',
  phoneFormat.phoneFormat('query', 'phone'),
  joiValidate.validate('query', userSmsValidate.get),
  userSmsController.get
);
admin.get('/:id', joiValidate.validate('params', joiValidate.idSchema), userSmsController.getById);

router.use('/admin', auth.isAdminAuthorized, auth.isAdminPermission, admin);

export { router as userSmsRouter };
