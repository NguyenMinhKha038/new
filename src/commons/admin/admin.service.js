import Admin from './admin.model';
import Joi from '@hapi/joi';
import BaseError from '../utils/base-error';
import { logger as Logger } from '../utils';

const adminSchema = Joi.object()
  .keys({
    user_name: Joi.string().min(5).max(15).required(),
    name: Joi.string().required(),
    email: Joi.string().email({ minDomainSegments: 2 }).required(),
    password: Joi.string().required(),
    permission_group_id: Joi.string()
  })
  .pattern(/./, Joi.string());

const resetPassSchema = Joi.object().keys({
  email: Joi.string().email({ minDomainSegments: 2 }).required(),
  token: Joi.string().required(),
  new_password: Joi.string().min(6).required(),
  confirm_password: Joi.string().min(6).required()
});

const changePassword = Joi.object().keys({
  new_password: Joi.string().min(6).required(),
  old_password: Joi.string().required()
});

const setStatusSchema = Joi.object().keys({
  admin_id: Joi.string().required(),
  status: Joi.string().required().valid(['active', 'disabled'])
});

const loginSchema = Joi.object().keys({
  user_name: Joi.string().required(),
  password: Joi.string().required()
});

const updatePermissionGroup = Joi.object().keys({
  admin_id: Joi.string().required(),
  permission_group_id: Joi.string()
});

const idSchema = Joi.object().keys({
  id: Joi.string()
    .regex(/^[0-9a-zA-Z]{24}$/)
    .required()
});

function validateId(data) {
  return Joi.validate(data, idSchema);
}

function validateUpdatePermissionGroup(data) {
  return Joi.validate(data, updatePermissionGroup, { abortEarly: false });
}

function validateChangePassword(data) {
  return Joi.validate(data, changePassword, { abortEarly: false });
}

function validateLogin(data) {
  return Joi.validate(data, loginSchema, { abortEarly: false });
}

function validateSetStatus(data) {
  return Joi.validate(data, setStatusSchema, { abortEarly: false });
}

function validateCreate(data) {
  return Joi.validate(data, adminSchema, {
    abortEarly: false,
    allowUnknown: true
  });
}

function validateResetPassword(data) {
  return Joi.validate(data, resetPassSchema, { abortEarly: false });
}

async function create(data) {
  try {
    return await Admin.create(data);
  } catch (err) {
    Logger.error(err);
    throw new BaseError({
      statusCode: 500,
      error: 'create admin error',
      errors: err
    });
  }
}

async function findAll(limit, skip, sort = { createdAt: -1 }) {
  try {
    return await Admin.find({ user_name: { $ne: process.env.ADMIN_USER_NAME } })
      .populate('permission_group_id')
      .limit(limit)
      .skip(skip)
      .lean()
      .sort(sort);
  } catch (err) {
    Logger.error(err);
    throw new BaseError({
      statusCode: 500,
      error: 'find all admin error',
      errors: err
    });
  }
}

async function find({ limit, skip, sort = { createdAt: -1 }, query, options, select }) {
  try {
    return await Admin.find(query, options)
      .limit(limit)
      .skip(skip)
      .sort(sort)
      .select(select)
      .populate({ path: 'permission_group_id' });
  } catch (error) {
    Logger.error(err);
    throw new BaseError({
      statusCode: 500,
      error: 'cannot find admin',
      errors: error
    });
  }
}

async function findSome(query, limit, skip, sort) {
  try {
    return await Admin.find(query)
      .limit(limit)
      .skip(skip)
      .populate('permission_group_id')
      .lean()
      .sort(sort);
  } catch (err) {
    Logger.error(err);
    throw new BaseError({
      statusCode: 500,
      error: 'find some admin error ',
      errors: err
    });
  }
}

async function findOne(query, options = {}) {
  try {
    return await Admin.findOne(query, options).populate('permission_group_id').lean();
  } catch (err) {
    Logger.error(err);
    throw new BaseError({
      statusCode: 500,
      error: 'find one admin error',
      errors: err
    });
  }
}

async function findOneAndUpdate(query, update) {
  try {
    return await Admin.findOneAndUpdate(query, update, { new: true }).select('-password -token');
  } catch (err) {
    Logger.error(err);
    throw new BaseError({
      statusCode: 500,
      error: 'update admin fail',
      errors: {
        code: 5001,
        message: err
      }
    });
  }
}

async function findOneAndDelete(query) {
  try {
    return await Admin.findOneAndDelete(query);
  } catch (err) {
    Logger.error(err);
    throw new BaseError({
      statusCode: 50,
      error: 'delete admin fail',
      errors: {
        code: 5004,
        message: 'can not delete admin'
      }
    });
  }
}

async function updateMany(query, update) {
  try {
    return await Admin.updateMany(query, update);
  } catch (errors) {
    Logger.error(error);
    throw new BaseError({
      statusCode: 500,
      error: 'cannot update',
      errors: error
    });
  }
}

async function count(query) {
  try {
    return await Admin.find(query).count();
  } catch (err) {
    Logger.error(err);
    throw new BaseError({
      statusCode: 500,
      error: 'can not count data',
      errors: err
    });
  }
}
/**
 *
 * @param {string} id
 * @param {any} options
 */
async function findById(id, options) {
  try {
    return await Admin.findById(id, options);
  } catch (err) {
    Logger.error(err);
    throw new BaseError({
      statusCode: 500,
      error: 'cannot find admin',
      errors: err
    });
  }
}

export default {
  validateCreate,
  validateResetPassword,
  validateSetStatus,
  validateLogin,
  validateChangePassword,
  validateUpdatePermissionGroup,
  validateId,
  findAll,
  find,
  findSome,
  findOne,
  findOneAndUpdate,
  findOneAndDelete,
  create,
  count,
  updateMany,
  findById
};
