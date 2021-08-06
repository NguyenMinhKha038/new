import express from 'express';
import joiValidate from '../middlewares/joi.validate';
import permissionGroupController from './group-permission.controller';
import groupPermissionValidation from './group-permission.validation';
// joiValidate
const permissionGroupRouter = express.Router();

permissionGroupRouter.post('/create-new', permissionGroupController.create);
permissionGroupRouter.post('/update-permissions', permissionGroupController.update);

permissionGroupRouter.get(
  '/get-permission-groups',
  joiValidate.validate('query', groupPermissionValidation.get),
  permissionGroupController.getPermissionGroup
);
permissionGroupRouter.get(
  '/get-permission-group-by-id',
  permissionGroupController.getPermissionGroupById
);
permissionGroupRouter.get(
  '/members/:id',
  joiValidate.validate('params', joiValidate.idSchema),
  joiValidate.validate('query', groupPermissionValidation.get),
  permissionGroupController.getMemberOfPermissionGroup
);

permissionGroupRouter.delete(
  '/delete-permission-group-by-id',
  permissionGroupController.deletePermissionGroupByid
);

export default permissionGroupRouter;
