import { Router } from 'express';
import sellingOptionValidation from './selling-option.validation';
import { isValid, auth, sanitizeRequestBody } from '../../commons/middlewares';
import sellingOptionController from './selling-option.controller';

const router = Router();
const adminRouter = Router();
const companyRouter = Router();

companyRouter
  .route('/')
  .get(isValid(sellingOptionValidation.company.get), sellingOptionController.company.get)
  .post(
    sanitizeRequestBody,
    isValid(sellingOptionValidation.company.create),
    sellingOptionController.company.create
  );
companyRouter
  .route('/:id')
  .get(isValid(sellingOptionValidation.company.getById), sellingOptionController.company.getById)
  .put(
    sanitizeRequestBody,
    isValid(sellingOptionValidation.company.update),
    sellingOptionController.company.update
  )
  .delete(isValid(sellingOptionValidation.company.delete), sellingOptionController.company.delete);

adminRouter
  .route('/')
  .get(isValid(sellingOptionValidation.admin.get), sellingOptionController.admin.get)
  .post(
    sanitizeRequestBody,
    isValid(sellingOptionValidation.admin.create),
    sellingOptionController.admin.create
  );
adminRouter
  .route('/:id')
  .get(isValid(sellingOptionValidation.admin.getById), sellingOptionController.admin.getById)
  .put(
    sanitizeRequestBody,
    isValid(sellingOptionValidation.admin.update),
    sellingOptionController.admin.update
  )
  .delete(isValid(sellingOptionValidation.admin.delete), sellingOptionController.admin.delete);

router.use(
  '/company',
  auth.isAuthorized,
  auth.isCompanyModPermission,
  auth.canCompanyEnter('approved'),
  companyRouter
);
router.use('/admin', auth.isAdminAuthorized, auth.isAdminPermission, adminRouter);

export { router as sellingOptionRouter };
