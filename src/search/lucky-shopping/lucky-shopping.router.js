import { Router } from 'express';
import luckyShoppingController from './lucky-shopping.controller';
import { auth, isValid } from '../../commons/middlewares';
import luckyShoppingValidation from './lucky-shopping.validation';

const router = Router(),
  admin = Router();

admin.put('/', isValid(luckyShoppingValidation.put), luckyShoppingController.admin.put);
admin.post(
  '/sale-date',
  isValid(luckyShoppingValidation.setDate),
  luckyShoppingController.admin.setDate
);
router.get('/', isValid(luckyShoppingValidation.get), luckyShoppingController.get);

admin.get(
  '/users',
  isValid(luckyShoppingValidation.get),
  luckyShoppingController.admin.statisticsDate
);

router.use('/admin', auth.isAdminAuthorized, auth.isAdminPermission, admin);

export { router as luckyShoppingRouter };
