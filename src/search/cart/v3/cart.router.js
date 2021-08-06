import { Router } from 'express';
import cartValidation from './cart.validation';
import cartController from './cart.controller';
import { isValid, auth } from '../../../commons/middlewares';

const user = Router(),
  router = Router();

user.get('/list', isValid(cartValidation.user.get), cartController.user.get);
user.get('/', cartController.user.getActive);
user.post('/product', isValid(cartValidation.user.addProduct), cartController.user.addProduct);
user.delete(
  '/product',
  isValid(cartValidation.user.removeProduct),
  cartController.user.removeProduct
);
user.post('/confirm', cartController.user.confirm);
user.post('/checkout', isValid(cartValidation.user.checkout), cartController.user.checkout);
user.get('/product-store', isValid(cartValidation.user.getStore), cartController.user.getStore);
user.post('/lucky', isValid(cartValidation.user.addProduct), cartController.user.addProduct);
user.post(
  '/lucky/confirm',
  isValid(cartValidation.user.confirm),
  cartController.user.confirmLuckyCart
);

router.use('/user', auth.isAuthorized, user);
export { router as cartRouterV3 };
