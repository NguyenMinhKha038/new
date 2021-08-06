import { Router } from 'express';
import mallStoringValidation from './mall-storing.validation';
import mallStoringController from './mall-storing.controller';
import { isValid, auth, sanitizeRequestBody } from '../../../commons/middlewares';
import { MallStaffRoles } from '../staff/staff.config';

const router = Router();
const mallRouter = Router();
const adminRouter = Router();

mallRouter.get(
  '/search',
  isValid(mallStoringValidation.mall.search),
  mallStoringController.mall.search
);

mallRouter.get('/', isValid(mallStoringValidation.get), mallStoringController.mall.get);
mallRouter
  .route('/:id')
  .get(isValid(mallStoringValidation.getById), mallStoringController.mall.getById)
  .put(
    sanitizeRequestBody,
    isValid(mallStoringValidation.mall.update),
    mallStoringController.mall.update
  );
mallRouter.put(
  '/update-status',
  isValid(mallStoringValidation.mall.updateStatus),
  mallStoringController.mall.updateStatus
);

adminRouter.get(
  '/:id',
  isValid(mallStoringValidation.getById),
  mallStoringController.admin.getById
);
adminRouter.get('/', isValid(mallStoringValidation.get), mallStoringController.admin.get);

router.use(
  '/mall',
  auth.isAuthorized,
  auth.isMallModPermission([MallStaffRoles.MallManager, MallStaffRoles.MallStock]),
  mallRouter
);
router.use('/admin', auth.isAdminAuthorized, auth.isAdminPermission, adminRouter);

// For browsing products
router.get('/', auth.isAuthorized, isValid(mallStoringValidation.get), mallStoringController.get);
router.get(
  '/:id',
  auth.isAuthorized,
  isValid(mallStoringValidation.getById),
  mallStoringController.getById
);

export { router as mallStoringRouter };
