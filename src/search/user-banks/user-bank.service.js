import { logger, BaseError } from '../../commons/utils';
import userBankModel from './user-bank.model';

const find = async ({ query, limit, skip = 0, sort = {}, populate, select }) => {
  try {
    return userBankModel
      .find(query)
      .limit(limit)
      .skip(skip)
      .sort(sort)
      .populate(populate)
      .select(select);
  } catch (error) {
    logger.error(error);
    throw new BaseError({ statusCode: 500, errors: error, error: 'cannot get user banks' });
  }
};
/**
 *
 * @param {string} user_id
 * @param {UserBankBankData} data
 */
const create = async (data) => {
  try {
    return userBankModel.create(data);
  } catch (error) {
    logger.error(error);
    throw new BaseError({ statusCode: 500, errors: error, error: 'cannot create user bank' });
  }
};

/**
 *
 * @param {{id: string, select: any, options: QueryFindBaseOptions}} param0
 */
const getById = async ({ id, select, options }) => {
  try {
    return userBankModel.findById(id, select, options);
  } catch (error) {
    logger.error(error);
    throw new BaseError({ statusCode: 500, errors: error, error: 'cannot get user bank' });
  }
};

/**
 *
 * @param {{query: any, options: QueryFindBaseOptions, select: any}} param0
 */
const findOne = async ({ query, select, options }) => {
  try {
    return userBankModel.findOne(query, select, options);
  } catch (error) {
    logger(error);
    throw new BaseError({ statusCode: 500, erorrs: error, error: 'cannot get user bank' });
  }
};

/**
 *
 * @param {{query:any, updated: any, options: UserBankOptions}} param0
 */
const findOneAndUpdate = async ({ query, updated, options }) => {
  try {
    return userBankModel.findOneAndUpdate(query, updated, { new: true, ...options });
  } catch (error) {
    logger(error);
    throw new BaseError({ statusCode: 500, error: 'cannot update user bank', errors: error });
  }
};

const count = async (query) => {
  try {
    return userBankModel.countDocuments(query);
  } catch (error) {
    logger(error);
    throw new BaseError({ statusCode: 500, error: 'cannot count user bank', errors: error });
  }
};

const findById = async (id) => {
  try {
  } catch (error) {
    logger(error);
    throw new BaseError({ statusCode: 500, error: 'cnanot find user bank', errors: error });
  }
};

export default {
  find,
  create,
  getById,
  findOne,
  findOneAndUpdate,
  count,
  findById
};
