import _ from 'lodash';
import { errorCode as Errors, BaseError, BaseResponse } from '../utils';
import over from '../over_function/over';
import { permissionService } from '../permission';
import permissionGroupService from './group-permission.service';
import { adminService } from '../admin';

function getNotAvailableError(listObjectAvailable, listChecked, keyInObject, keyInput) {
  for (let i = 0; i < listChecked.length; i++) {
    if (!over.isExistedInArray(listObjectAvailable, listChecked[i], keyInObject).status) {
      return new BaseError({
        statusCode: 400,
        error: Errors.validate,
        errors: {
          [keyInput]: Errors['any.notAvailable']
        }
      }).addMeta({ message: `value is not available position ${i}` });
    }
  }
  return false;
}

function getNotUniqueInListError(listChecked, keyInput) {
  for (let i = 0; i < listChecked.length; i++) {
    let isUniqueInList = over.isUniqueInArray(listChecked, listChecked[i], i);
    if (!isUniqueInList.status) {
      return new BaseError({
        statusCode: 400,
        error: Errors.validate,
        errors: {
          [keyInput]: Errors['array.duplicate']
        }
      }).addMeta({
        message: `duplicate at position ${i} and ${isUniqueInList.position}`
      });
    }
  }
  return false;
}

async function create(req, res, next) {
  try {
    let { error, value } = permissionGroupService.validateCreateNew(req.body);
    if (error) return next(over.getJoiError(error));
    value.permission_ids = [];
    var response = await permissionGroupService.create(value);
    return res.send(new BaseResponse({ statusCode: 200, data: response }));
  } catch (err) {
    return next(err);
  }
}

async function update(req, res, next) {
  var { error, value } = permissionGroupService.validateUpdatePermissionsCode(req.body);
  if (error) return next(over.getJoiError(error));
  try {
    let { id, ...query } = value;
    var permissionsList = await permissionService.findAll();
    if (value.permission_ids.length > 0) {
      let availableError = getNotAvailableError(
        permissionsList,
        value.permission_ids,
        '_id',
        'permission_ids'
      );
      let uniqueError = getNotUniqueInListError(value.permission_ids, 'permission_ids');

      if (availableError) return next(availableError);
      else if (uniqueError) return next(uniqueError);
    }

    const response = await permissionGroupService.findByIdAndUpdate(value.id, {
      ...query
    });

    return res.send(new BaseResponse({ statusCode: 200, data: response }));
  } catch (err) {
    return next(err);
  }
}

// async function updatePermissionGroupsIdAdmin(req, res, next){

// }

async function getPermissionGroup(req, res, next) {
  try {
    const { limit, page, ...query } = req.query;

    const skip = page ? limit * (page - 1) : 0;
    const total = await permissionGroupService.count(query);
    const totalPage = limit ? Math.ceil(total / limit) : 1;
    const permissionGroupsList = await permissionGroupService.find({}, skip, limit, { name: 1 });
    return res.send(
      new BaseResponse({
        statusCode: 200,
        data: permissionGroupsList
      }).addMeta({ totalPage, total })
    );
  } catch (err) {
    return next(err);
  }
}

async function getPermissionGroupById(req, res, next) {
  try {
    if (req.query.id) {
      var permissionGroup = await permissionGroupService.findById(req.query.id);

      return res.send(new BaseResponse({ statusCode: 200, data: permissionGroup }));
    } else {
      return next(
        new BaseError({
          statusCode: 400,
          error: Errors.validate,
          errors: { id: Errors['any.empty'] }
        })
      );
    }
  } catch (err) {
    return next(err);
  }
}

async function getMemberOfPermissionGroup(req, res, next) {
  try {
    const { limit, page } = req.query;
    const { id } = req.params;
    const skip = page ? limit * (page - 1) : 0;
    const query = { permission_group_id: id };
    let listMember = await adminService.findSome(query, limit, skip);
    for (let i = 0; i < listMember.length; i++) {
      listMember[i] = _.omit(listMember[i], ['password', 'token']);
    }
    const total = await permissionGroupService.count(query);
    const totalPage = limit ? Math.ceil(total / limit) : 1;
    // listMember = _.omit(listMember,['password','token']);
    return res.send(
      new BaseResponse({ statusCode: 200, data: listMember }).addMeta({
        totalPage,
        total
      })
    );
  } catch (err) {
    return next(err);
  }
}

async function deletePermissionGroupByid(req, res, next) {
  try {
    if (req.query.id) {
      await adminService.updateMany(
        { permission_group_id: req.query.id },
        { $unset: { permission_group_id: 1 } }
      );
      await permissionGroupService.findByIdAndDelete(req.query.id);
      return res.send(new BaseResponse({ statusCode: 200 }));
    } else {
      return next(
        new BaseError({
          statusCode: 400,
          error: Errors.validate,
          errors: { id: Errors['any.empty'] }
        })
      );
    }
  } catch (err) {
    return next(err);
  }
}

export default {
  create,
  update,
  getPermissionGroup,
  getPermissionGroupById,
  getMemberOfPermissionGroup,
  deletePermissionGroupByid
};
