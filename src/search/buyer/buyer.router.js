import { Router } from 'express';
import { auth, isValid } from '../../commons/middlewares';
import buyerController from './buyer.controller';
import buyerValidation from './buyer.validation';

const admin = Router(),
  company = Router(),
  router = Router();

admin.get('/', isValid(buyerValidation.admin.get), buyerController.admin.get);
admin.get('/:id', isValid(buyerValidation.admin.getById), buyerController.admin.getById);

company.get('/', isValid(buyerValidation.company.get), buyerController.company.get);
company.get('/:id', isValid(buyerValidation.company.getById), buyerController.company.getById);

router.use('/admin', auth.isAdminAuthorized, auth.isAdminPermission, admin);
router.use('/company', auth.isAuthorized, auth.isCompanyModPermission, company);

export { router as buyerRouter };
