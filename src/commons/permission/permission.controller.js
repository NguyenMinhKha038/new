import service from './permission.service';
import _ from 'lodash';
import { errorCode as Errors, BaseError, BaseResponse } from '../utils';
import Over from '../over_function';
import adminActivityService from '../admin-activity/admin-activity.service';

async function createPermission(req, res, next) {
  // let { error, value } = service.validateCreate(req.body);
  // if (error) {
  //   return next(Over.getJoiError(error));
  // }
  try {
    const data = req.body;
    data.created_by_id = req.admin._id;
    let newPermission = await service.create(data);

    // Create admin activity
    adminActivityService.create({
      admin_id: req.admin.id,
      on_model: 'Permissions',
      object_id: newPermission._id,
      updated_fields: newPermission,
      type: 'insert',
      snapshot: newPermission,
      resource: req.originalUrl
    });

    return new BaseResponse({ statusCode: 200, data: newPermission }).return(res);
  } catch (err) {
    return next(err);
  }
}

async function getAll(req, res, next) {
  try {
    let permissions = await service.findAll();
    let response = new BaseResponse({
      statusCode: 200,
      data: permissions
    });
    return res.send(response);
  } catch (err) {
    return next(err);
  }
}

async function getPermissionById(req, res, next) {
  if (req.params.id) {
    try {
      let permission = await service.findOne({ _id: req.params.id });
      return res.send(
        new BaseResponse({
          statusCode: 200,
          data: permission
        })
      );
    } catch (err) {
      return next(err);
    }
  } else {
    return next(
      new BaseError({
        statusCode: 400,
        error: Errors.validate,
        errors: {
          code: Errors['any.required']
        }
      })
    ).addMeta({ message: 'id is required' });
  }
}

async function updatePermission(req, res, next) {
  if (req.body.id) {
    try {
      let permission = await service.findOneAndUpdate(
        { _id: req.body.id },
        _.omit(req.body, ['id'])
      );

      // Create admin activity
      adminActivityService.create({
        admin_id: req.admin.id,
        on_model: 'Permissions',
        object_id: permission._id,
        updated_fields: _.omit(req.body, ['id']),
        type: 'update',
        snapshot: permission,
        resource: req.originalUrl
      });

      return res.send(
        new BaseResponse({
          statusCode: 200,
          data: permission
        })
      );
    } catch (err) {
      return next(err);
    }
  } else {
    return next(
      new BaseError({
        statusCode: 400,
        error: Errors.validate,
        errors: {
          id: Errors['any.required']
        }
      })
    ).addMeta({ message: 'id is required' });
  }
}

async function deletePermission(req, res, next) {
  if (req.body.id) {
    try {
      const deletedPermission = await service.findOneAndDelete({ _id: req.body.id });
      let response = new BaseResponse({ statusCode: 200 });

      // Create admin activity
      adminActivityService.create({
        admin_id: req.admin.id,
        on_model: 'Permissions',
        object_id: deletedPermission._id,
        updated_fields: deletedPermission,
        type: 'delete',
        snapshot: deletedPermission,
        resource: req.originalUrl
      });

      return res.send(response);
    } catch (err) {
      return next(err);
    }
  } else {
    let error = new BaseError({
      statusCode: 400,
      error: Errors.validate,
      errors: {
        id: Errors['any.required']
      }
    }).addMeta({ message: 'id is required' });
    return next(error);
  }
}

export default {
  createPermission,
  getAll,
  getPermissionById,
  updatePermission,
  deletePermission
};
