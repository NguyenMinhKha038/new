import { Router } from 'express';
import goodsBatchValidation from './goods-batch.validation';
import goodsBatchController from './goods-batch.controller';
import goodsBatchMiddleWare from './goods-batch.middleware';
import { isValid, auth, sanitizeRequestBody } from '../../commons/middlewares';

const router = Router();
const companyMallRouter = Router();
const adminRouter = Router();

companyMallRouter.put(
  '/on-sales/:id',
  isValid(goodsBatchValidation.updateOnSales),
  goodsBatchController.company_mall.updateOnSales
);
companyMallRouter
  .route('/:id')
  .get(isValid(goodsBatchValidation.getById), goodsBatchController.company_mall.getById)
  .put(
    sanitizeRequestBody,
    isValid(goodsBatchValidation.update),
    goodsBatchController.company_mall.update
  )
  .delete(isValid(goodsBatchValidation.delete), goodsBatchController.company_mall.delete);
companyMallRouter.get(
  '/',
  isValid(goodsBatchValidation.get),
  goodsBatchController.company_mall.get
);

adminRouter.get('/:id', isValid(goodsBatchValidation.getById), goodsBatchController.admin.getById);
adminRouter.get('/', isValid(goodsBatchValidation.get), goodsBatchController.admin.get);

router.use(
  '/company-mall',
  auth.isAuthorized,
  goodsBatchMiddleWare.hasStockPermission,
  companyMallRouter
);
router.use('/admin', auth.isAdminAuthorized, auth.isAdminPermission, adminRouter);

// Used for importing/exporting goods batche(s)
router.post(
  '/import',
  auth.isAuthorized,
  goodsBatchMiddleWare.hasStockPermission,
  sanitizeRequestBody,
  // TEMPORARY FOR TESTING GOODS BATCHES MOVING --
  (req, res, next) => {
    try {
      // if (req.body.place_of_stock === 'warehouse' && !req.body.warehouse_id) {
      //   req.body.warehouse_id = req.stock_permission.warehouse_ids[0];
      // }
      next();
    } catch (err) {
      next(err);
    }
  },
  // --
  isValid(goodsBatchValidation.importBatch),
  goodsBatchController.importBatch
);
router.post(
  '/export',
  auth.isAuthorized,
  goodsBatchMiddleWare.hasStockPermission,
  sanitizeRequestBody,
  // TEMPORARY FOR TESTING GOODS BATCHES MOVING --
  (req, res, next) => {
    try {
      if (req.body.place_of_stock === 'warehouse' && !req.body.warehouse_id) {
        req.body.warehouse_id = req.stock_permission.warehouse_ids[0];
      }
      next();
    } catch (err) {
      next(err);
    }
  },
  // --
  isValid(goodsBatchValidation.exportBatches),
  goodsBatchController.exportBatches
);
router.post(
  '/import-export',
  auth.isAuthorized,
  goodsBatchMiddleWare.hasStockPermission,
  sanitizeRequestBody,
  // TEMPORARY FOR TESTING GOODS BATCHES MOVING --
  (req, res, next) => {
    try {
      if (req.body.place_of_stock === 'warehouse' && !req.body.warehouse_id) {
        req.body.warehouse_id = req.stock_permission.warehouse_ids[0];
      }
      next();
    } catch (err) {
      next(err);
    }
  },
  // --
  isValid(goodsBatchValidation.handleBatchesForSale),
  goodsBatchController.handleBatchesForSale
);

// Used for moving goods batches
router.post(
  '/request-move',
  auth.isAuthorized,
  goodsBatchMiddleWare.hasMoveStockPermission,
  sanitizeRequestBody,
  // TEMPORARY FOR TESTING GOODS BATCHES MOVING --
  (req, res, next) => {
    try {
      if (req.body.moving_type.startsWith('warehouse') && !req.body.from_warehouse_id) {
        req.body.from_warehouse_id = req.move_permission.warehouse_ids[0];
      }
      if (req.body.moving_type.endsWith('warehouse') && !req.body.to_warehouse_id) {
        req.body.to_warehouse_id = req.move_permission.warehouse_ids[0];
      }
      next();
    } catch (err) {
      next(err);
    }
  },
  // --
  isValid(goodsBatchValidation.requestMove),
  goodsBatchController.requestMove
);
router.post(
  '/update-move',
  auth.isAuthorized,
  goodsBatchMiddleWare.hasStockPermission,
  sanitizeRequestBody,
  isValid(goodsBatchValidation.updateMove),
  goodsBatchController.updateMove
);
router.post(
  '/approve-move',
  auth.isAuthorized,
  goodsBatchMiddleWare.hasMoveStockPermission,
  sanitizeRequestBody,
  isValid(goodsBatchValidation.approveMove),
  goodsBatchController.approveMove
);
router.post(
  '/confirm-move',
  auth.isAuthorized,
  goodsBatchMiddleWare.hasMoveStockPermission,
  sanitizeRequestBody,
  isValid(goodsBatchValidation.confirmMove),
  goodsBatchController.confirmMove
);
router.post(
  '/confirm-difference',
  auth.isAuthorized,
  goodsBatchMiddleWare.hasMoveStockPermission,
  sanitizeRequestBody,
  isValid(goodsBatchValidation.confirmDifference),
  goodsBatchController.confirmDifference
);

// Used for browsing goods batches
router.get(
  '/',
  auth.isAuthorized,
  goodsBatchMiddleWare.hasStockPermission,
  isValid(goodsBatchValidation.get),
  goodsBatchController.get
);
router.get(
  '/:id',
  auth.isAuthorized,
  goodsBatchMiddleWare.hasStockPermission,
  isValid(goodsBatchValidation.getById),
  goodsBatchController.getById
);

export { router as goodsBatchRouter };
