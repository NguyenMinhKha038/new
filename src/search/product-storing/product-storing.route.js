import { Router } from 'express';
import { auth, isValid } from '../../commons/middlewares';
import productStoringController from './product-storing.controller';
import productStoringControllerAdmin from './product-storing.controller.admin';
import productStoringControllerCompany from './product-storing.controller.company';
import productStoringValidate from './product-storing.validate';
import productStoringRouterV2 from './v2/product-storing.router';

const companyRouter = Router();
const adminRouter = Router();
const router = Router();

router.get('/', isValid(productStoringValidate.get), productStoringController.get);
companyRouter.get('/', isValid(productStoringValidate.find), productStoringControllerCompany.find);
companyRouter.post(
  '/import-product-to-store',
  isValid(productStoringValidate.importProductToStore),
  productStoringControllerCompany.importProductToStore
);
companyRouter.put(
  '/:product_storing_id',
  isValid(productStoringValidate.update),
  productStoringControllerCompany.update
);
companyRouter.get(
  '/search',
  isValid(productStoringValidate.search),
  productStoringControllerCompany.search
);
companyRouter.post(
  '/update-stock',
  isValid(productStoringValidate.updateStock),
  productStoringControllerCompany.updateStock
);
companyRouter.post(
  '/request-move-stock',
  isValid(productStoringValidate.createMoveStockRequest),
  productStoringControllerCompany.createMoveStockRequest
);
companyRouter.post(
  '/approve-move-stock',
  isValid(productStoringValidate.approveMoveStockRequest),
  productStoringControllerCompany.approveMoveStockRequest
);
companyRouter.post(
  '/confirm-move-stock',
  isValid(productStoringValidate.confirmMoveStockRequest),
  productStoringControllerCompany.confirmMoveStockRequest
);

adminRouter.get('/', isValid(productStoringValidate.get), productStoringControllerAdmin.get);

router.use('/company', auth.isAuthorized, auth.isCompanyModPermission, companyRouter);
router.use('/admin', auth.isAdminAuthorized, auth.isAdminPermission, adminRouter);
router.use('/v2', productStoringRouterV2);

export { router as productStoringRouter };
