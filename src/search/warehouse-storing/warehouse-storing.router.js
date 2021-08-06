import { Router } from 'express';
import warehouseStoringValidation from './warehouse-storing.validation';
import warehouseStoringController from './warehouse-storing.controller';
import { isValid, auth, sanitizeRequestBody } from '../../commons/middlewares';

const router = Router();
const companyRouter = Router();
const adminRouter = Router();

companyRouter.get(
  '/',
  isValid(warehouseStoringValidation.get),
  warehouseStoringController.company.get
);
companyRouter
  .route('/:id')
  .get(isValid(warehouseStoringValidation.getById), warehouseStoringController.company.getById)
  .put(
    sanitizeRequestBody,
    isValid(warehouseStoringValidation.company.update),
    warehouseStoringController.company.update
  );
companyRouter.post(
  '/update-status',
  isValid(warehouseStoringValidation.company.updateStatus),
  warehouseStoringController.company.updateStatus
);

adminRouter.get(
  '/:id',
  isValid(warehouseStoringValidation.getById),
  warehouseStoringController.admin.getById
);
adminRouter.get('/', isValid(warehouseStoringValidation.get), warehouseStoringController.admin.get);

router.use('/company', auth.isAuthorized, auth.isCompanyModPermission, companyRouter);
router.use('/admin', auth.isAdminAuthorized, auth.isAdminPermission, adminRouter);

export { router as warehouseStoringRouter };
