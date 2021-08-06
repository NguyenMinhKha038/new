import { Router } from 'express';
import providerValidation from './provider.validation';
import providerController from './provider.controller';
import { isValid, auth } from '../../commons/middlewares';

const router = Router();
const companyRouter = Router();
const adminRouter = Router();

adminRouter.get('/:id', isValid(providerValidation.getById), providerController.admin.getById);
adminRouter.get('/', isValid(providerValidation.get), providerController.admin.get);
adminRouter.post('/', isValid(providerValidation.create), providerController.admin.create);
adminRouter.put('/:id', isValid(providerValidation.update), providerController.admin.update);
adminRouter.delete('/:id', isValid(providerValidation.delete), providerController.admin.delete);

companyRouter.get('/:id', isValid(providerValidation.getById), providerController.company.getById);
companyRouter.get('/', isValid(providerValidation.get), providerController.company.get);
companyRouter.post('/get', isValid(providerValidation.getOne), providerController.company.getOne);
companyRouter.post('/', isValid(providerValidation.create), providerController.company.create);
companyRouter.put('/:id', isValid(providerValidation.update), providerController.company.update);
companyRouter.delete('/:id', isValid(providerValidation.delete), providerController.company.delete);

router.use('/admin', auth.isAdminAuthorized, auth.isAdminPermission, adminRouter);
router.use('/company', auth.isAuthorized, auth.isCompanyModPermission, companyRouter);

export { router as providerRouter };
