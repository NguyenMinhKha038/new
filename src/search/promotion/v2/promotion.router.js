import { Router } from 'express';
import { joiValidate, auth } from '../../../commons/middlewares';
import { promotionValidationV2 } from './promotion.validation';
import { promotionCompanyControllersV2 } from './promotion.owner.controller';
import { promotionAdminControllerV2 } from './promotion.admin.controller';

const companyRouter = Router();
const adminRouter = Router();
const router = Router();

companyRouter.post(
  '/',
  joiValidate.validate('body', promotionValidationV2.company.createdSchema),
  promotionCompanyControllersV2.create
);

companyRouter.put(
  '/status',
  joiValidate.validate('body', promotionValidationV2.company.updateStatusSchema),
  promotionCompanyControllersV2.updateStatus
);

companyRouter.put(
  '/',
  joiValidate.validate('body', promotionValidationV2.company.updateSchema),
  promotionCompanyControllersV2.update
);

companyRouter.get(
  '/:id',
  joiValidate.validate('params', joiValidate.idSchema),
  joiValidate.validate('query', promotionValidationV2.company.getById),
  promotionCompanyControllersV2.getById
);

adminRouter.get(
  '/:id',
  joiValidate.validate('params', joiValidate.idSchema),
  promotionAdminControllerV2.getById
);

// companyRouter.get('/', joi)

router.use('/company', auth.isAuthorized, auth.isCompanyModPermission, companyRouter);
router.use('/admin', auth.isAdminAuthorized, auth.isAdminPermission, adminRouter);

export { router as promotionRouterV2 };
