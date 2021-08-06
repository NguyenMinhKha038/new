import { Router } from 'express';
import { auth, isValid } from '../../commons/middlewares';
import companyMoneyFlowValidation from './company-money-flow.validation';
import companyMoneyFlowController from './company-money-flow.controller';

const router = Router();

router.get(
  '/',
  auth.isAdminAuthorized,
  isValid(companyMoneyFlowValidation.get),
  companyMoneyFlowController.get
);

export { router as companyMoneyFlowRouter };
