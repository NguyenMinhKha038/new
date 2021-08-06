import { Router } from 'express';
import { isValid, auth } from '../../commons/middlewares';
import supportReasonController from './support-reason.controller';
import supportReasonValidation from './support-reason.validation';

const router = Router();
const adminRouter = Router();

router.get('/', isValid(supportReasonValidation.get.query), supportReasonController.get);
adminRouter.post(
  '/',
  isValid(supportReasonValidation.admin.post),
  supportReasonController.admin.create
);
adminRouter.post(
  '/',
  isValid(supportReasonValidation.admin.put),
  supportReasonController.admin.update
);

router.use('/admin', auth.isAdminPermission, adminRouter);

export { router as supportReasonRouter };
