import Model from './permission.model';
import { logger, BaseError } from '../../commons/utils';

async function create(data) {
  try {
    return await Model.create(data);
  } catch (err) {
    logger.error(err);
    throw new BaseError({
      statusCode: 500,
      error: "can't create data permisison from search project",
      errors: err
    });
  }
}

/**
 *
 * @param {any} query
 * @param {any} select
 * @param {import('mongoose').QueryFindOptions} options
 */
async function find(query, select, options) {
  try {
    return await Model.find(query, select, options);
  } catch (err) {
    logger.error(err);
    throw new BaseError({
      statusCode: 500,
      error: "can't find data permission from search project",
      errors: err
    });
  }
}

async function findById(id) {
  try {
    return await Model.findById(id);
  } catch (err) {
    logger.error(err);
    throw new BaseError({
      statusCode: 500,
      error: "can't find data permission by id from search project",
      errors: err
    });
  }
}

async function findOne(query) {
  try {
    return await Model.findOne(query);
  } catch (err) {
    logger.error(err);
    throw new BaseError({
      statusCode: 500,
      error: "can't find data permission from search project",
      errors: err
    });
  }
}

async function findOneAndUpdate(query, updateQuery) {
  try {
    return await Model.findOneAndUpdate(query, updateQuery, { new: true });
  } catch (err) {
    logger.error(err);
    throw new BaseError({
      statusCode: 500,
      error: "can't update data from search project ",
      errors: err
    });
  }
}

async function findOneAndDelete(query) {
  try {
    return await Model.findOneAndDelete(query);
  } catch (err) {
    logger.error(err);
    throw new BaseError({
      statusCode: 500,
      error: "can't delete data from search project",
      errors: err
    });
  }
}

async function insertMany(list) {
  try {
    return await Model.insertMany(list);
  } catch (err) {
    logger.error(err);
    throw new BaseError({
      statusCode: 500,
      error: "can't create list data",
      erorrs: err
    });
  }
}

async function count(query) {
  try {
    return await Model.countDocuments(query);
  } catch (err) {
    logger.error(err);
    throw new BaseError({
      statusCode: 500,
      error: "can't count data from search project",
      errors: err
    });
  }
}

export default {
  create,
  find,
  findById,
  findOne,
  findOneAndUpdate,
  findOneAndDelete,
  insertMany,
  count
};
