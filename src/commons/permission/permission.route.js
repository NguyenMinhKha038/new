import controller from './permission.controller';
import express from 'express';
import { permissionValidation } from './permission.validation';
import { joiValidate } from '../middlewares/joi.validate';

const userRouter = express.Router();
const adminRouter = express.Router();

// userRouter.get('')
adminRouter.post(
  '/create-new',
  // joiValidate.validate('body', permissionValidation.create),
  joiValidate.validate('body', permissionValidation.create),
  controller.createPermission
);
adminRouter.get('/get-permissions', controller.getAll);
adminRouter.get('/get-permission/:id', controller.getPermissionById);
adminRouter.post(
  '/update',
  joiValidate.validate('body', permissionValidation.update),
  controller.updatePermission
);
adminRouter.post('/delete', controller.deletePermission);

export default {
  userRouter,
  adminRouter
};
