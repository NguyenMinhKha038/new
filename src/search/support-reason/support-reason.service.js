import supportReasonModel from './support-reason.model';

/**
 *
 * @param {import('mongoose').FilterQuery} condition
 * @param {*} projection
 * @param {import('mongoose').QueryFindOptions } options
 */
const find = async (condition, projection, options) => {
  return supportReasonModel.find(condition, projection, options);
};

/**
 *
 * @param {*} condition
 * @param {*} projection
 * @param {import('mongoose').QueryFindBaseOptions} options
 */
const findOne = async (condition, projection, options) => {
  return supportReasonModel.findOne(condition, projection, options);
};

/**
 *
 * @param {any} id
 * @param {*} projection
 * @param {import('mongoose').QueryFindBaseOptions} options
 */
const findById = async (id, projection, options) => {
  return supportReasonModel.findById(id, projection, options);
};

/**
 *
 * @param {*} condition
 * @param {*} doc
 * @param {import('mongoose').QueryFindOneAndUpdateOptions} options
 */
const findOneAndUpdate = async (condition, doc, options) => {
  return supportReasonModel.findOneAndUpdate(condition, doc, options);
};

const count = async (condition) => {
  return supportReasonModel.countDocuments(condition);
};

/**
 *
 * @param {*} doc
 * @param {import('mongoose').SaveOptions} options
 */
const create = async (doc, options) => {
  return supportReasonModel.create(doc, options);
};

export default {
  find,
  findOne,
  findById,
  findOneAndUpdate,
  count,
  create
};
