import { Router } from 'express';
import productStoringValidation from './product-storing.validation';
import productStoringController from './product-storing.controller';
import { isValid, auth, sanitizeRequestBody } from '../../../commons/middlewares';

const router = Router();
const companyRouter = Router();
const adminRouter = Router();

// Company --
companyRouter.get(
  '/search',
  isValid(productStoringValidation.search),
  productStoringController.company.search
);
companyRouter
  .route('/')
  .get(isValid(productStoringValidation.get), productStoringController.company.get)
  .post(
    sanitizeRequestBody,
    isValid(productStoringValidation.company.importProducts),
    productStoringController.company.importProducts
  );
companyRouter
  .route('/:id')
  .get(isValid(productStoringValidation.getById), productStoringController.company.getById)
  .put(
    sanitizeRequestBody,
    isValid(productStoringValidation.company.update),
    productStoringController.company.update
  );
companyRouter.post(
  '/update-status',
  isValid(productStoringValidation.company.updateStatus),
  productStoringController.company.updateStatus
);
// --

// Admin --
adminRouter.get(
  '/:id',
  isValid(productStoringValidation.getById),
  productStoringController.admin.getById
);
adminRouter.get('/', isValid(productStoringValidation.get), productStoringController.admin.get);
// --

router.use('/company', auth.isAuthorized, auth.isCompanyModPermission, companyRouter);
router.use('/admin', auth.isAdminAuthorized, auth.isAdminPermission, adminRouter);

// For browsing products
router.get('/', isValid(productStoringValidation.get), productStoringController.get);
router.get('/:id', isValid(productStoringValidation.getById), productStoringController.getById);

export default router;
