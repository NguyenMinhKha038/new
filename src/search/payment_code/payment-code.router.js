import { Router } from 'express';
import paymentCodeController from './payment-code.controller';
import { auth } from '../../commons/middlewares';

const router = Router(),
  user = Router();

user.post('/', paymentCodeController.user.post);

router.use('/user', auth.isAuthorized, user);

export { router as paymentCodeRouter };
