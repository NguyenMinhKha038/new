import { Router } from 'express';
import cartValidation from './cart.validation';
import cartController from './cart.controller';
import { isValid, auth } from '../../commons/middlewares';
import { cartRouterV2 } from './v2/cart.router';
import { cartRouterV3 } from './v3/cart.router';

const user = Router(),
  router = Router();

user.get('/list', isValid(cartValidation.user.get), cartController.user.get);
user.get('/', cartController.user.getActive);
user.post('/product', isValid(cartValidation.user.addProduct), cartController.user.addProduct);
user.delete(
  '/product/',
  isValid(cartValidation.user.removeProduct),
  cartController.user.removeProduct
);
user.post('/confirm', cartController.user.confirm);
user.post('/checkout', isValid(cartValidation.user.checkout), cartController.user.checkout);

user.post('/lucky', isValid(cartValidation.user.addProduct), cartController.user.addProduct);
user.post(
  '/lucky/confirm',
  isValid(cartValidation.user.confirm),
  cartController.user.confirmLuckyCart
);

router.use('/user', auth.isAuthorized, user);
router.use('/v2', cartRouterV2);
router.use('/v3', cartRouterV3);
export { router as cartRouter };
