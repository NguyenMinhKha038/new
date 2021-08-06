import _ from 'lodash';
import { Model, QueryPopulateOptions } from 'mongoose';

/**
 *
 *
 * @export
 * @param {Model<any>} model
 * @returns
 */
export default function extendService(model) {
  _.bindAll(model, [
    'create',
    'findOne',
    'find',
    'findById',
    'findOneAndUpdate',
    'countDocuments',
    'updateOne',
    'updateMany',
    'update',
    'aggregate',
    'findByIdAndUpdate'
  ]);

  /**
   * find with pagination
   *
   * @param {{ page: number, limit: number, select: any, sort: any, populate: string|QueryPopulateOptions|QueryPopulateOptions[], query: Record<string, any> }} param
   * @returns {Promise<[data: any[], {total_page: number, total: number}]>}
   */
  const findWithPagination = ({ page = 1, limit = 50, select, sort, populate, query } = {}) =>
    Promise.all([
      model.find(query, select, { sort, skip: page && (page - 1) * limit, populate, limit }),
      model
        .countDocuments(query)
        .then((res) => ({ total: res, total_page: Math.ceil(res / limit) }))
    ]);

  const methods = {
    create: model.create,
    findOne: model.findOne,
    find: model.find,
    findById: model.findById,
    findOneAndUpdate: model.findOneAndUpdate,
    countDocuments: model.countDocuments,
    updateOne: model.updateOne,
    updateMany: model.updateMany,
    findByIdAndUpdate: model.findByIdAndUpdate,
    update: model.update,
    aggregate: model.aggregate,
    generate: (doc) => new model(doc),
    findWithPagination: findWithPagination
  };
  return methods;
}
