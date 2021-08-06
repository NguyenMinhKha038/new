import { BaseError, logger } from '../../commons/utils';
import permissionGroupModel from './permission-group.model';

async function create(data) {
  try {
    return await permissionGroupModel.create(data);
  } catch (err) {
    logger.error(err);
    throw new BaseError({ statusCode: 500, error: err, errors: {} });
  }
}

async function find({
  query,
  limit,
  skip,
  sort = {},
  populate = [{ path: 'none-path' }],
  options = {}
}) {
  try {
    return await permissionGroupModel
      .find(query, options)
      .populate(populate)
      .limit(limit)
      .skip(skip)
      .sort(sort);
  } catch (err) {
    logger.error(err);
    throw new BaseError({ statusCode: 500, error: err, errors: {} });
  }
}

async function findOneActive(query, select, options) {
  const _query = { status: 'active', ...query };
  return await permissionGroupModel.findOne(_query, select, options);
}

async function findOne(query, populate, select, options) {
  try {
    return await permissionGroupModel.findOne(query, select, options).populate(populate);
  } catch (err) {
    logger.error(err);
    throw new BaseError({ statusCode: 500, error: err, errors: {} });
  }
}

async function findById(id, populate = [{ path: 'none-path' }]) {
  try {
    return await permissionGroupModel.findById(id).populate(populate);
  } catch (err) {
    logger.error(err);
    throw new BaseError({ statusCode: 500, error: err, errors: {} });
  }
}

/**
 *
 * @param {any} query
 * @param {any} update
 * @param {any} populate
 * @param {import('mongoose').QueryFindOneAndUpdateOptions} options
 */
async function findOneAndUpdate(query, update, populate = {}, options) {
  try {
    // return await permissionGroupModel.findOneAndUpdate(query, update);
    return await permissionGroupModel
      .findOneAndUpdate(query, update, { new: true, ...options })
      .populate(populate);
  } catch (err) {
    logger.error(err);
    throw new BaseError({ statusCode: 500, error: err, errors: {} });
  }
}

async function findOneAndDelete(query) {
  try {
    return await permissionGroupModel.findOneAndDelete(query);
  } catch (err) {
    logger.error(err);
    throw new BaseError({ statusCode: 500, error: err, errors: {} });
  }
}

async function count(query = {}) {
  try {
    return await permissionGroupModel.countDocuments(query);
  } catch (err) {
    logger.error(err);
    throw new BaseError({ statusCode: 500, error: err, errors: {} });
  }
}

export default {
  create,
  find,
  findOneActive,
  findOne,
  findById,
  findOneAndDelete,
  findOneAndUpdate,
  count
};
