import groupsPermissionModel from './group-permission.model';
import Joi from '@hapi/joi';
import { logger as Logger, BaseError } from '../utils';

const updatePermissionsCodeArray = Joi.object().keys({
  id: Joi.string().required(),
  permission_ids: Joi.array().optional(),
  name: Joi.string().optional(),
  description: Joi.string().optional()
});

const createNew = Joi.object().keys({
  name: Joi.string().required(),
  description: Joi.string().allow('')
});

const idSchema = Joi.object().keys({
  id: Joi.string()
    .regex(/^[0-9a-zA-Z]{24}$/)
    .required()
});

function validateId(data) {
  return Joi.validate(data, idSchema);
}

function validateUpdatePermissionsCode(data) {
  return Joi.validate(data, updatePermissionsCodeArray, { abortEarly: false });
}
function validateCreateNew(data) {
  return Joi.validate(data, createNew, { abortEarly: false });
}

async function create(query) {
  try {
    return await groupsPermissionModel.create(query);
  } catch (err) {
    Logger.error(err);
    throw new BaseError({
      statusCode: 500,
      error: 'can not create new',
      errors: err
    });
  }
}

async function find(query, skip = 0, limit = 0, sortQuery = {}) {
  try {
    return await groupsPermissionModel.find(query).limit(limit).skip(skip).sort(sortQuery).lean();
  } catch (err) {
    Logger.error(err);
    throw new BaseError({
      statusCode: 500,
      error: 'can not find data',
      errors: err
    });
  }
}

async function findById(id) {
  try {
    return await groupsPermissionModel.findById(id).lean().populate('permission_ids');
  } catch (err) {
    Logger.error(err);
    throw new BaseError({
      statusCode: 500,
      error: 'can not find data by id',
      errors: err
    });
  }
}

async function findByIdAndUpdate(id, update) {
  try {
    return await groupsPermissionModel
      .findByIdAndUpdate(id, update, {
        new: true
      })
      .populate('permission_ids');
  } catch (err) {
    Logger.error(err);
    throw new BaseError({
      statusCode: 500,
      error: 'can not update data',
      errors: err
    });
  }
}

async function findOneAndUpdate(query, update) {
  try {
    return await groupsPermissionModel.findOneAndUpdate(query, update, {
      new: true
    });
  } catch (err) {
    Logger.error(err);
    throw new BaseError({
      statusCode: 500,
      error: 'can not update data',
      errors: err
    });
  }
}

async function findByIdAndDelete(id) {
  try {
    return await groupsPermissionModel.findByIdAndDelete(id);
  } catch (err) {
    Logger.error(err);
    throw new BaseError({
      statusCode: 500,
      error: 'can not delete',
      errors: err
    });
  }
}

async function count(query) {
  try {
    return await groupsPermissionModel.find(query).count();
  } catch (err) {
    Logger.error(err);
    throw new BaseError({
      statusCode: 500,
      error: 'can not count',
      errors: err
    });
  }
}

export default {
  create,
  find,
  findById,
  findByIdAndUpdate,
  findByIdAndDelete,
  findOneAndUpdate,
  validateUpdatePermissionsCode,
  validateCreateNew,
  validateId,
  count
};
