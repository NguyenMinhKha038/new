import { Router } from 'express';
import { auth, joiValidate } from '../../commons/middlewares';
import companyBankValidate from './companyBank.validate';
import companyBankController from './companyBank.controller';

const router = Router();
const companyRouter = Router();
const adminRouter = Router();

companyRouter.post(
  '/',
  joiValidate.validate('body', companyBankValidate.create),
  companyBankController.create
);

companyRouter.get(
  '/',
  joiValidate.validate('query', companyBankValidate.get),
  companyBankController.getCompanyBank
);
companyRouter.put(
  '/',
  joiValidate.validate('body', companyBankValidate.update),
  companyBankController.update
);

adminRouter.get(
  '/',
  joiValidate.validate('query', companyBankValidate.get),
  companyBankController.admin.adminGet
);

router.use('/company', auth.isAuthorized, auth.isCompanyModPermission, companyRouter);
router.use('/admin', auth.isAdminAuthorized, adminRouter);

export { router as companyBankRouter };
