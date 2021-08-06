import { Router } from 'express';
import { isValid, auth } from '../../commons/middlewares';
import productTemplateController from './product-template.controller';
import productTemplateValidation from './product-template.validation';

const router = Router();
const adminRouter = Router();
const companyRouter = Router();

adminRouter.post(
  '/update-status/:id',
  isValid(productTemplateValidation.admin.updateStatus),
  productTemplateController.admin.updateStatus
);
adminRouter
  .route('/')
  .post(isValid(productTemplateValidation.admin.create), productTemplateController.admin.create)
  .get(isValid(productTemplateValidation.admin.get), productTemplateController.admin.get);
adminRouter
  .route('/:id')
  .get(isValid(productTemplateValidation.admin.getById), productTemplateController.admin.getById)
  .put(isValid(productTemplateValidation.admin.update), productTemplateController.admin.update);

// company router
companyRouter.get(
  '/get-latest-template',
  isValid(productTemplateValidation.company.getLatestTemplate),
  productTemplateController.company.getLatestProductTemplateByCategoryId
);
// companyRouter
//   .route('/:id')
//   .get(isValid(productTemplateValidation.getById), productTemplateController.company.getById);

router.use('/admin', auth.isAdminAuthorized, auth.isAdminPermission, adminRouter);
router.use(
  '/company/',
  auth.isAuthorized,
  auth.isCompanyModPermission,
  auth.canCompanyEnter('approved', 'suspend'),
  companyRouter
);

export { router as productTemplateRouter };
