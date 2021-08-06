import { Router } from 'express';
import adminActivityController from './admin-activity.controller';
import adminActivityValidation from './admin-activity.validation';
import { isValid } from '../middlewares';

const adminActivityRouter = Router();

adminActivityRouter.get('/', isValid(adminActivityValidation.get), adminActivityController.get);
adminActivityRouter.get(
  '/:activity_id',
  isValid(adminActivityValidation.getById),
  adminActivityController.getById
);

export default adminActivityRouter;
