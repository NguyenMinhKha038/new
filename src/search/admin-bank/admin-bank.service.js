import { logger, BaseError, errorCode } from '../../commons/utils';
import adminBankModel from './admin-bank.model';

async function create(data) {
  try {
    return await adminBankModel.create(data);
  } catch (err) {
    logger.error(err);
    throw new BaseError({
      statusCode: 500,
      error: 'cannot create adminBank',
      errors: err
    });
  }
}

async function insertMany(data) {
  try {
    return await adminBankModel.insertMany(data);
  } catch (err) {
    logger.error(err);
    throw new BaseError({
      statusCode: 500,
      error: 'cannot insert many admin bank',
      errors: err
    });
  }
}

async function find({ query, limit, skip, sort, populate = { path: 'none-path' } }, options = {}) {
  try {
    return await adminBankModel
      .find(query, options)
      .populate(populate)
      .limit(limit)
      .skip(skip)
      .sort(sort);
  } catch (err) {
    logger.error(err);
    throw new BaseError({
      statusCode: 500,
      error: 'cannot find adminBank',
      errors: err
    });
  }
}

async function findOne(query, populate = { path: 'none-path' }) {
  try {
    return await adminBankModel.findOne(query).populate(populate);
  } catch (err) {
    logger.error(err);
    throw new BaseError({
      statusCode: 500,
      error: 'cannot find adminBank',
      errors: err
    });
  }
}

/**
 *
 * @param {string} id
 * @param {any} select
 * @param {import('mongoose').QueryFindBaseOptions} options
 */
async function findById(id, select, options) {
  try {
    return await adminBankModel.findById(id, select, options);
  } catch (err) {
    logger.error(err);
    throw new BaseError({
      statusCode: 500,
      error: 'cannot find adminBank',
      errors: err
    });
  }
}

async function findOneAndUpdate(query, update) {
  try {
    return await adminBankModel.findOneAndUpdate(query, update, { new: true });
  } catch (err) {
    logger.error(err);
    throw new BaseError({
      statusCode: 500,
      error: 'cannot update adminBank',
      errors: err
    });
  }
}

async function findByIdAndUpdate(id, update) {
  try {
    return await adminBankModel.findByIdAndUpdate(id, update, { new: true });
  } catch (err) {
    logger.error(err);
    throw new BaseError({
      statusCode: 500,
      error: 'cannot update adminBank',
      errors: err
    });
  }
}

async function findByOneAndDelete(query) {
  try {
    return await adminBankModel.findOneAndDelete(query);
  } catch (err) {
    logger.error(err);
    throw new BaseError({
      statusCode: 500,
      error: 'cannot delete adminBank',
      errors: err
    });
  }
}

async function count(query) {
  try {
    return await adminBankModel.countDocuments(query);
  } catch (err) {
    logger.error(err);
    throw new BaseError({
      statusCode: 500,
      error: 'cannot count adminBank',
      errors: err
    });
  }
}

export default {
  create,
  insertMany,
  find,
  findById,
  findOne,
  findByOneAndDelete,
  findOneAndUpdate,
  findByIdAndUpdate,
  count
};
