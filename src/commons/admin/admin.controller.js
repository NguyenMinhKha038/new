import _ from 'lodash';
import { BaseError, BaseResponse, errorCode as Errors } from '../utils';
import { Over } from '../over_function';
import adminService from './admin.service';
import { groupPermissionService } from '../group-permisison';
import { authService } from '../auth';
import adminActivityService from '../admin-activity/admin-activity.service';

const adminUserName = process.env.ADMIN_USER_NAME;

function randomText(number_of_chars) {
  var text = '';
  var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz123456789!@#$%&*(){}[]';
  for (let i = 0; i < number_of_chars; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

async function findAllAdmin(req, res, next) {
  try {
    let limit = req.query.limit ? parseInt(req.query.limit) : 0;
    let skip = req.query.page ? limit * (req.query.page - 1) : 0;
    const total = await adminService.count();
    let totalPage = limit > 0 ? Math.ceil(total / limit) : 0;

    let adminList = await adminService.findAll(limit, skip);

    if (adminList.length > 0) {
      for (let i = 0; i < adminList.length; i++) {
        adminList[i] = _.pick(adminList[i], [
          '_id',
          'user_name',
          'name',
          'email',
          'permission_group_id',
          'status'
        ]);
      }
    }
    return res.send(
      new BaseResponse({ statusCode: 200, data: adminList }).addMeta({
        totalPage,
        page: req.query.page,
        total
      })
    );
  } catch (err) {
    return next(err);
  }
}

async function get(req, res, next) {
  try {
    let { limit, page, ...query } = req.validate;
    limit = limit ? limit : 0;
    const skip = page ? limit * (page - 1) : 0;
    query = {
      ...query,
      user_name: { $ne: adminUserName }
    };
    const total = await adminService.count(query);
    let totalPage = limit > 0 ? Math.ceil(total / limit) : 1;
    const response = await adminService.find({
      limit,
      skip,
      query,
      select: '-password -token'
    });
    return res.send(
      new BaseResponse({ setStatus: 200, data: response, totalPage }).addMeta({ total })
    );
  } catch (err) {
    return next(err);
  }
}

async function getFreeAdmin(req, res, next) {
  try {
    let limit = req.query.limit ? parseInt(req.query.limit) : 0;
    let skip = req.query.page ? limit * (req.query.page - 1) : 0;

    const query = {
      permission_group_id: { $exists: false },
      user_name: { $ne: adminUserName },
      status: 'active'
    };
    let adminList = await adminService.findSome(query, limit, skip);

    if (adminList.length > 0) {
      for (let i = 0; i < adminList.length; i++) {
        adminList[i] = _.pick(adminList[i], [
          '_id',
          'user_name',
          'name',
          'email',
          'permission_group_id',
          'status'
        ]);
      }
    }
    const total = await adminService.count(query);
    let totalPages = limit > 0 ? Math.ceil(total / limit) : 0;
    return res.send(
      new BaseResponse({ statusCode: 200, data: adminList }).addMeta({
        totalPages,
        page: req.query.page,
        total
      })
    );
  } catch (err) {
    return next(err);
  }
}

async function outOfPermissionGroup(req, res, next) {
  let { error, value } = adminService.validateId(req.params);
  if (error) return next(Over.getJoiError(error));
  try {
    let response = await adminService.findOneAndUpdate(
      { _id: value.id },
      { $unset: { permission_group_id: 1 } }
    );
    if (!response)
      return next(
        new BaseError({
          statusCode: 400,
          error: Errors.client,
          errors: { id: Errors['client.wrongInput'] }
        })
      );

    // Create admin activity
    adminActivityService.create({
      admin_id: req.admin.id,
      object_id: response._id,
      updated_fields: ['permission_group_id'],
      type: 'update',
      snapshot: response,
      resource: req.originalUrl
    });

    return res.send(new BaseResponse({ statusCode: 200, data: response }));
  } catch (err) {
    return next(err);
  }
}

async function createNewAdmin(req, res, next) {
  const { error, value } = adminService.validateCreate(req.body);
  if (error) {
    return next(Over.getJoiError(error));
  } else {
    try {
      value.token = randomText(40);
      value.status = 'active';
      let newAdmin = await adminService.create(value);
      // Create admin activity
      adminActivityService.create({
        admin_id: req.admin.id,
        object_id: newAdmin._id,
        type: 'insert',
        updated_fields: newAdmin,
        snapshot: newAdmin,
        resource: req.originalUrl
      });

      newAdmin = _.pick(newAdmin, ['_id', 'user_name', 'email', 'name', 'status']);
      return res.send(new BaseResponse({ statusCode: 200, data: newAdmin }));
    } catch (err) {
      return next(err);
    }
  }
}

async function deleteAdmin(req, res, next) {
  if (req.body.admin_id) {
    try {
      const admin_id = req.body.admin_id;
      if (admin_id === req.admin.id) {
        return next(
          new BaseError({
            statusCode: 400,
            error: Errors.authorization,
            errors: { admin_id: Errors['auth.yourself'] }
          }).addMeta({ admin_id: 'yourselves' })
        );
      }

      const admin = await adminService.findOneAndDelete({
        _id: req.body.admin_id,
        user_name: { $ne: adminUserName }
      });
      if (!admin) {
        return next(
          new BaseError({
            statusCode: 400,
            error: Errors.client,
            errors: { admin_id: Errors['client.global.notFound'] }
          }).addMeta({ message: 'admin not found' })
        );
      }

      // Create admin activity
      adminActivityService.create({
        admin_id: req.admin.id,
        on_model: 'admins',
        object_id: admin._id,
        updated_fields: admin,
        type: 'delete',
        snapshot: admin,
        resource: req.originalUrl
      });

      return res.send(new BaseResponse({ statusCode: 200 }));
    } catch (err) {
      return next(err);
    }
  } else {
    return next(
      new BaseError({
        statusCode: 400,
        error: Errors.validate,
        errors: { id: Errors['any.required'] }
      })
    );
  }
}

async function setStatus(req, res, next) {
  let { error, value } = adminService.validateSetStatus(req.body);
  if (error) {
    return next(Over.getJoiError(error));
  }
  try {
    const { status, admin_id } = value;
    if (admin_id === req.admin.id) {
      return next(
        new BaseError({
          statusCode: 400,
          error: Errors.authorization,
          errors: { admin_id: Errors['auth.yourself'] }
        }).addMeta({ message: 'yourselves' })
      );
    }

    let adminMod = await adminService.findOneAndUpdate(
      { _id: admin_id, user_name: { $ne: adminUserName } },
      { status: status }
    );
    if (!adminMod) {
      return next(
        new BaseError({
          statusCode: 400,
          error: Errors.client,
          errors: {
            admin_id: Errors['client.global.notFound']
          }
        }).addMeta({ message: 'admin not found' })
      );
    }

    // Create admin activity
    adminActivityService.create({
      admin_id: req.admin.id,
      on_model: 'admins',
      object_id: adminMod._id,
      updated_fields: ['status'],
      type: 'update',
      snapshot: adminMod,
      resource: req.originalUrl
    });

    adminMod = _.pick(adminMod, ['_id', 'user_name', 'name', 'email', 'status']);
    return res.send(new BaseResponse({ statusCode: 200, data: adminMod }));
  } catch (err) {
    return next(err);
  }
}

async function getAdminbyId(req, res, next) {
  if (req.params.id) {
    try {
      let finded = await adminService.findOne({ _id: req.params.id });
      finded = _.pick(finded, ['_id', 'name', 'email', 'status', 'permission_group_id']);
      return res.send(new BaseResponse({ statusCode: 200, data: finded }));
    } catch (err) {
      return next(err);
    }
  } else {
    return next(
      new BaseError({
        statusCode: 400,
        error: Errors.validate,
        errors: { id: Errors['any.required'] }
      })
    );
  }
}

async function changePassword(req, res, next) {
  let { error, value } = adminService.validateChangePassword(req.body);
  if (error) return next(Over.getJoiError(error));
  try {
    if (value.new_password == value.old_password) {
      return next(
        new BaseError({
          statusCode: 400,
          error: Errors.validate,
          errors: { new_password: Errors['password.used'] }
        })
      );
    }

    let admin = await adminService.findOne({ _id: req.admin.id });
    let result = await authService.comparePassword(value.old_password, admin.password);

    if (!result)
      return next(
        new BaseError({
          statusCode: 400,
          error: Errors.authorization,
          errors: {
            old_password: Errors['autho.notMatch']
          }
        })
      );

    let newPassword = await authService.hashing(value.new_password);
    let adminReset = await adminService.findOneAndUpdate(
      { _id: admin._id },
      { password: newPassword }
    );

    // Create admin activity
    adminActivityService.create({
      admin_id: req.admin.id,
      on_model: 'admins',
      object_id: adminReset._id,
      updated_fields: ['password'],
      type: 'update',
      snapshot: adminReset,
      resource: req.originalUrl
    });

    adminReset = _.pick(adminReset, ['email', 'name', 'status']);

    return res.send(new BaseResponse({ statusCode: 200, data: adminReset }));
  } catch (err) {
    return next(err);
  }
}

async function updatePermissionGroupId(req, res, next) {
  let { error, value } = adminService.validateUpdatePermissionGroup(req.body);
  if (error) return next(Over.getJoiError(error));
  try {
    if (req.admin.user_name === process.env.ADMIN_USER_NAME) {
      let adminUpdate = await adminService.findOneAndUpdate(
        { _id: value.admin_id, status: 'active' },
        _.omit(value, 'admin_id')
      );
      if (!adminUpdate) {
        return next(
          new BaseError({
            statusCode: 400,
            error: Errors.client,
            errors: { admin: Errors['status.disable'] }
          }).addMeta({ message: 'admin is disabled' })
        );
      }

      // Create admin activity
      adminActivityService.create({
        admin_id: req.admin.id,
        object_id: adminUpdate._id,
        updated_fields: _.omit(value, 'admin_id'),
        type: 'update',
        snapshot: adminUpdate,
        resource: req.originalUrl
      });

      adminUpdate = _.omit(adminUpdate, ['password', 'token']);
      return res.send(new BaseResponse({ statusCode: 200, data: adminUpdate }));
    } else {
      return next(
        new BaseError({
          statusCode: 400,
          error: Errors.authorization,
          errors: { permission: Errors['permission.notAllow'] }
        })
      );
    }
  } catch (err) {
    return next(err);
  }
}

export default {
  // initServer,
  updatePermissionGroupId,
  deleteAdmin,
  findAllAdmin,
  getFreeAdmin,
  // getMemberOfGroupPermisison,
  outOfPermissionGroup,
  createNewAdmin,
  setStatus,
  getAdminbyId,
  changePassword,
  get
};
