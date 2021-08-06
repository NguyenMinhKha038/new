import { Router } from 'express';
import { isValid, auth } from '../../../commons/middlewares';
import productControllerV2 from './product.controller';
import productValidationV2 from './product.validation';

const router = Router();
const companyRouter = Router();
const adminRouter = Router();

companyRouter
  .route('/')
  .post(isValid(productValidationV2.company.post), productControllerV2.company.create)
  .get(isValid(productValidationV2.company.get), productControllerV2.company.get);

companyRouter
  .route('/:id')
  .get(isValid(productValidationV2.company.getById), productControllerV2.company.getById)
  .put(isValid(productValidationV2.company.put), productControllerV2.company.put);

adminRouter.route('/').get(isValid(productValidationV2.admin.get), productControllerV2.admin.get);

adminRouter
  .route('/:id')
  .get(isValid(productValidationV2.admin.getById), productControllerV2.admin.getById);

router.use(
  '/company/',
  auth.isAuthorized,
  auth.isCompanyModPermission,
  auth.canCompanyEnter('approved', 'suspend'),
  companyRouter
);
router.use('/admin', auth.isAdminAuthorized, auth.isAdminPermission, adminRouter);

router.get(
  '/top',
  auth.noNeedAuthorized,
  isValid(productValidationV2.getTop),
  productControllerV2.getTop
);

router.get(
  '/:id',
  auth.noNeedAuthorized,
  isValid(productValidationV2.getById),
  productControllerV2.getById
);
router.get('/', auth.noNeedAuthorized, isValid(productValidationV2.get), productControllerV2.get);
export { router as productRouterV2 };
