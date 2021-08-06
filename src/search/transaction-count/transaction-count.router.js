import { Router } from 'express';
import { auth } from '../../commons/middlewares';
import transactionCountController from './transaction-count.controller';

const router = Router();
const userRouter = Router();
const companyRouter = Router();

userRouter.get('/', transactionCountController.userGet);
companyRouter.get('/', transactionCountController.companyGet);

router.use('/user', auth.isAuthorized, userRouter);
router.use('/company', auth.isAuthorized, auth.isCompanyModPermission, companyRouter);

export { router as transactionCountRouter };
