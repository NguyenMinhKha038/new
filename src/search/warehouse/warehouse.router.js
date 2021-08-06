import { Router } from 'express';
import { auth, isValid } from '../../commons/middlewares';
import warehouseController from './warehouse.controller';
import warehouseValidation from './warehouse.validation';

const router = Router();
const companyRouter = Router();
const adminRouter = Router();

companyRouter
  .route('/')
  .get(isValid(warehouseValidation.get), warehouseController.company.get)
  .post(isValid(warehouseValidation.company.create), warehouseController.company.create);
companyRouter
  .route('/:id')
  .get(isValid(warehouseValidation.getById), warehouseController.company.getById)
  .put(isValid(warehouseValidation.company.put), warehouseController.company.put)
  .delete(isValid(warehouseValidation.company.delete), warehouseController.company.delete);

adminRouter.get('/', isValid(warehouseValidation.get), warehouseController.admin.get);
adminRouter.get('/:id', isValid(warehouseValidation.getById), warehouseController.admin.getById);

router.use('/admin', auth.isAdminAuthorized, auth.isAdminPermission, adminRouter);
router.use(
  '/company',
  auth.isAuthorized,
  auth.isCompanyModPermission,
  auth.canCompanyEnter('approved', 'suspend', 'pending'),
  companyRouter
);

export { router as warehouseRouter };
