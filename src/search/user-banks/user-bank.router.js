import { Router } from 'express';
import { auth, joiValidate } from '../../commons/middlewares';
import userBankValidation from './user-bank.validation';
import userBankController from './user-bank.controller';

const router = Router();
const userRouter = Router();

userRouter.post(
  '/',
  joiValidate.validate('body', userBankValidation.create),
  userBankController.create
);

userRouter.get(
  '/',
  joiValidate.validate('query', userBankValidation.get),
  userBankController.getUserBank
);

userRouter.get(
  '/:id',
  joiValidate.validate('params', joiValidate.idSchema),
  userBankController.findById
);
userRouter.put(
  '/',
  joiValidate.validate('body', userBankValidation.update),
  userBankController.update
);

router.use('/user', auth.isAuthorized, userRouter);

export { router as userBankRouter };
