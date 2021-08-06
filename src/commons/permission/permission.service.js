import Permission from './permission.model';
import Joi from '@hapi/joi';
import { logger as Logger, BaseError } from '../utils';

const permissionCreate = Joi.object().keys({
  path: Joi.string().required()
});

function validateCreate(data) {
  return Joi.validate(data, permissionCreate, {
    abortEarly: false,
    allowUnknown: true
  });
}

async function create(query) {
  try {
    return await Permission.create(query);
  } catch (err) {
    Logger.error(err);
    throw new BaseError({
      statusCode: 500,
      error: 'can not create permission',
      errors: err
    });
  }
}

async function findAll() {
  try {
    return await Permission.find({});
  } catch (err) {
    Logger.error(err);
    throw new BaseError({
      statusCode: 500,
      error: 'can not find all permission',
      errors: err
    });
  }
}

async function findOneAndUpdate(query, update, options) {
  try {
    return await Permission.findOneAndUpdate(query, update, { new: true, ...options });
  } catch (err) {
    Logger.error(err);
    throw new BaseError({
      statusCode: 500,
      error: 'can not update permission',
      errors: err
    });
  }
}

async function findOne(query) {
  try {
    return await Permission.findOne(query);
  } catch (err) {
    Logger.error(err);
    throw new BaseError({
      statusCode: 500,
      error: 'can not find perssmion',
      errors: err
    });
  }
}

async function findOneAndDelete(query) {
  try {
    return await Permission.findOneAndDelete(query);
  } catch (err) {
    Logger.error(err);
    throw new BaseError({
      statusCode: 500,
      error: 'can not delete permission',
      errors: err
    });
  }
}

async function insertMany(list) {
  try {
    return await Permission.insertMany(list);
  } catch (err) {
    Logger.error(err);
    throw new BaseError({
      statusCode: 500,
      error: 'can not create permission',
      errors: err
    });
  }
}

export default {
  create,
  findAll,
  validateCreate,
  findOne,
  findOneAndUpdate,
  findOneAndDelete,
  insertMany
};
