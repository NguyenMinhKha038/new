import { logger, BaseError, errorCode } from '../../commons/utils';
import transferModel from './transfer.model';

/**
 *
 * @param {any} data
 * @param {import('mongoose').SaveOptions} options
 */
async function create(data, options) {
  try {
    return await transferModel.create(data, options);
  } catch (err) {
    logger.error(err);
    throw new BaseError({
      statusCode: 500,
      error: 'cannot create transfer',
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
    return await transferModel.find(query, select, options);
  } catch (err) {
    logger.error(err);
    throw new BaseError({
      statusCode: 500,
      error: 'cannot find transfer',
      errors: err
    });
  }
}

/**
 *
 * @param {any} query
 * @param {any} select
 * @param {import('mongoose').QueryFindBaseOptions} options
 */
async function findOne(query, select, options) {
  try {
    return await transferModel.findOne(query, select, options);
  } catch (err) {
    logger.error(err);
    throw new BaseError({
      statusCode: 500,
      error: 'cannot find transfer',
      errors: err
    });
  }
}

/**
 *
 * @param {string} id
 * @param {*} select
 * @param {import('mongoose').QueryFindBaseOptions} options
 */
async function findById(id, select, options) {
  try {
    return await transferModel.findById(id, select, options);
  } catch (err) {
    logger.error(err);
    throw new BaseError({
      statusCode: 500,
      error: 'cannot find transfer',
      errors: err
    });
  }
}

async function findOneAndUpdate(query, update) {
  try {
    return await transferModel.findOneAndUpdate(query, update, { new: true });
  } catch (err) {
    logger.error(err);
    throw new BaseError({
      statusCode: 500,
      error: 'cannot update transfer',
      errors: err
    });
  }
}

async function findByIdAndUpdate(id, update) {
  try {
    return await transferModel.findByIdAndUpdate(id, update, { new: true });
  } catch (err) {
    logger.error(err);
    throw new BaseError({
      statusCode: 500,
      error: 'cannot update transfer',
      errors: err
    });
  }
}

async function findByOneAndDelete(query) {
  try {
    return await transferModel.findOneAndDelete(query);
  } catch (err) {
    logger.error(err);
    throw new BaseError({
      statusCode: 500,
      error: 'cannot delete transfer',
      errors: err
    });
  }
}

async function count(query) {
  try {
    return await transferModel.countDocuments(query);
  } catch (err) {
    logger.error(err);
    throw new BaseError({
      statusCode: 500,
      error: 'cannot count transfer',
      errors: err
    });
  }
}

async function statistics(query, sort = 'date') {
  const pipeline = [
    {
      $match: query
    },
    {
      $group: {
        _id: {
          $dateToString: {
            date: '$createdAt',
            format: '%Y-%m-%d'
          }
        },
        date: { $first: '$createdAt' },
        values: { $push: '$value' },
        count: { $sum: 1 }
      }
    },
    {
      $addFields: {
        total: {
          $sum: '$values'
        },
        min: {
          $min: '$values'
        },
        max: {
          $max: '$values'
        },
        avg: {
          $avg: '$values'
        }
      }
    },
    {
      $sort: { [sort]: -1 }
    }
  ];
  return await transferModel.aggregate(pipeline);
}

export default {
  create,
  find,
  findById,
  findOne,
  findByOneAndDelete,
  findOneAndUpdate,
  findByIdAndUpdate,
  count,
  statistics
};
