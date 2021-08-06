import { Router } from 'express';
import productController from './product.controller';
import { isValid, auth, upload, resize } from '../../commons/middlewares';
import productValidation from './product.validation';
import { productRouterV2 } from './v2/product.router';

const router = Router();
const admin = Router();
const user = Router();
const company = Router();

admin.get('/', isValid(productValidation.admin.get), productController.admin.get);
admin.get(
  '/statistic-by-sub-category',
  isValid(productValidation.admin.statisticBySubCategory),
  productController.admin.statisticBySubCategory
);
admin.get('/:id', isValid(productValidation.admin.getById), productController.admin.getById);
admin.put('/approve', isValid(productValidation.admin.approve), productController.admin.approve);

user.post('/like', isValid(productValidation.user.like), productController.user.like);
user.post('/share', isValid(productValidation.user.share), productController.user.share);
user.post('/favorite', isValid(productValidation.user.favorite), productController.user.favorite);
user.get(
  '/favorite',
  isValid(productValidation.user.getFavorite),
  productController.user.getFavorite
);
router.post(
  '/view',
  auth.noNeedAuthorized,
  isValid(productValidation.user.view),
  productController.user.view
);
user.get(
  '/view',
  auth.isAuthorized,
  isValid(productValidation.user.getView),
  productController.user.getView
);

//* only company
company.get('/', isValid(productValidation.company.get), productController.company.get);
company.get('/:id', isValid(productValidation.company.getById), productController.company.getById);
company.post('/', isValid(productValidation.company.post), productController.company.post);
company.post(
  '/upload',
  upload.uploadProductImageMiddleWare,
  resize.resize({ width: 500 }),
  productController.company.upload
);
company.put(
  '/stock',
  isValid(productValidation.company.updateStock),
  productController.company.updateStock
);
company.post(
  '/stock/request-move',
  isValid(productValidation.company.createMoveStockRequest),
  productController.company.createMoveStockRequest
);
company.put(
  '/stock/confirm-move',
  isValid(productValidation.company.confirmMoveStockRequest),
  productController.company.confirmMoveStockRequest
);
company.put('/:id', isValid(productValidation.company.put), productController.company.put);

router.use('/admin', auth.isAdminAuthorized, auth.isAdminPermission, admin);
router.use('/user', auth.isAuthorized, user);
router.use(
  '/company/',
  auth.isAuthorized,
  auth.isCompanyModPermission,
  auth.canCompanyEnter('approved', 'suspend'),
  company
);

//* public
router.get('/', auth.noNeedAuthorized, isValid(productValidation.get), productController.get);
router.get(
  '/top',
  auth.noNeedAuthorized,
  isValid(productValidation.getTop),
  productController.getTop
);
router.get(
  '/transport-fee',
  auth.noNeedAuthorized,
  isValid(productValidation.getTransportFee),
  productController.getTransportFee
);
router.use('/v2', productRouterV2);
router.get(
  '/:id',
  auth.noNeedAuthorized,
  isValid(productValidation.getById),
  productController.getById
);

export { router as productRouter };
