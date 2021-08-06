import { Router } from 'express';
import productAttributeController from './product-attribute.controller';
import productAttributeValidation from './product-attribute.validation';

import { isValid, auth } from '../../commons/middlewares';

const router = Router();
const adminRouter = Router();

adminRouter
  .route('/')
  .post(isValid(productAttributeValidation.create), productAttributeController.create)
  .get(isValid(productAttributeValidation.get), productAttributeController.get);
adminRouter
  .route('/:id')
  .all(isValid(productAttributeValidation.getById))
  .get(productAttributeController.getById)
  .put(isValid(productAttributeValidation.update), productAttributeController.put)
  .delete(productAttributeController.delete);

router.use('/admin', auth.isAdminAuthorized, auth.isAdminPermission, adminRouter);

export { router as productAttributeRouter };
