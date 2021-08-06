import paymentModel from './payment.model';
import { logger, BaseError } from '../../commons/utils';

async function create(data) {
  try {
    return await paymentModel.create(data);
  } catch (err) {
    logger.error(err);
    throw new BaseError({
      statusCode: 500,
      error: 'cannot reate payment data',
      errors: err
    });
  }
}

async function find({ query, limit, skip, sort, populate = { path: 'none-path' } }) {
  try {
    return await paymentModel.find(query).populate(populate).limit(limit).skip(skip).sort(sort);
  } catch (err) {
    logger.error(err);
    throw new BaseError({
      statusCode: 500,
      error: 'cannot find payment data',
      errors: err
    });
  }
}

async function findById(id, populate = { path: 'none-path' }) {
  try {
    return await paymentModel.findById(id).populate(populate);
  } catch (err) {
    logger.error(err);
    throw new BaseError({
      statusCode: 500,
      error: 'cannot find payment data',
      errors: err
    });
  }
}

async function findOne(query, populate = { path: 'none-path' }) {
  try {
    return await paymentModel.findOne(query).populate(populate);
  } catch (err) {
    logger.error(err);
    throw new BaseError({
      statusCode: 500,
      error: 'cannot find payment data',
      errors: err
    });
  }
}

async function findOneAndUpdate(query, update) {
  try {
    return await paymentModel.findOneAndUpdate(query, update, { new: true });
  } catch (err) {
    logger.error(err);
    throw new BaseError({
      statusCode: 500,
      error: 'cannot update payment data',
      errors: err
    });
  }
}

async function findByIdAndUpdate(id, update) {
  try {
    return await paymentModel.findByIdAndUpdate(id, update, { new: true });
  } catch (err) {
    logger.error(err);
    throw new BaseError({
      statusCode: 500,
      error: 'cannot update payment data',
      errors: err
    });
  }
}

async function findOneAndDelete(query) {
  try {
    return await paymentModel.findOneAndDelete(query);
  } catch (err) {
    logger.error(err);
    throw new BaseError({
      statusCode: 500,
      error: 'cannot delete payment data',
      errors: err
    });
  }
}

async function count(query) {
  try {
    return await paymentModel.count(query);
  } catch (err) {
    logger.error(err);
    throw new BaseError({
      statusCode: 500,
      error: 'cannot count payment data',
      errors: err
    });
  }
}

export default {
  create,
  find,
  findById,
  findOne,
  findByIdAndUpdate,
  findOneAndDelete,
  findOneAndUpdate,
  count
};
