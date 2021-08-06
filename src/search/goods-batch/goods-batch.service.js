import goodsBatchModel from './goods-batch.model';
import extendService from '../../commons/utils/extend-service';
import { FinalStatuses, AvailableStatuses } from './goods-batch.config';
import { BaseError, errorCode } from '../../commons/utils';

export default {
  ...extendService(goodsBatchModel),
  create(data, options) {
    const goodsBatch = new goodsBatchModel(data);
    return goodsBatch.save(options);
  },
  async createAndPopulate(doc, populate, options = {}) {
    const newDoc = await this.create(doc, options);
    return await goodsBatchModel.findOne({ _id: newDoc._id }, null, {
      populate,
      ...options
    });
  },
  async saveAndPopulate(doc, populate, options = {}) {
    const newDoc = await doc.save(options);
    return await goodsBatchModel.findOne({ _id: newDoc._id }, null, {
      populate,
      ...options
    });
  },
  async findOneEnsure(query, select, options) {
    const goodsBatch = await goodsBatchModel.findOne(query, select, options);
    if (!goodsBatch) {
      throw new BaseError({
        statusCode: 404,
        error: errorCode.client,
        errors: { goods_batch_id: errorCode['client.goodsBatchNotFound'] }
      });
    }
    return goodsBatch;
  },
  findOneActive(query, select, options) {
    const customQuery = { ...query, status: { $in: Object.values(AvailableStatuses) } };
    return goodsBatchModel.findOne(customQuery, select, options);
  },
  findOneActiveAndUpdate(query, updates, options = {}) {
    const customQuery = { ...query, status: { $in: Object.values(AvailableStatuses) } };
    const opts = { ...options, new: true };
    return goodsBatchModel.findOneAndUpdate(customQuery, updates, opts);
  },
  findOneActiveAndDelete(query) {
    const customQuery = { ...query, status: { $in: Object.values(AvailableStatuses) } };
    return goodsBatchModel.findOneAndDelete(customQuery);
  }
};
