import { Router } from 'express';
import companyActivityController from './company-activity.controller';
import companyActivityValidation from './company-activity.validation';
import { auth, isValid } from '../../commons/middlewares';

const company = Router(),
  router = Router();

company.get('/:id', isValid(companyActivityValidation.getById), companyActivityController.getById);
company.get('/', isValid(companyActivityValidation.get), companyActivityController.get);

router.use('/company', auth.isAuthorized, auth.isCompanyModPermission, company);
export default router;
