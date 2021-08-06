import { findAdvanced, mergeObject } from '../../commons/utils';
import userHistoryModel from './user-history.model';

export default {
  type: {
    pay_order: 'pay_order',
    pay_cart: 'pay_cart',
    refund: 'refund',
    commission: 'commission',
    return_canceled_order: 'return_canceled_order'
  },
  async find({ limit, page, select, sort, populate, ...query }) {
    query = mergeObject({}, query);
    return await findAdvanced(userHistoryModel, {
      limit,
      page,
      populate,
      select,
      sort,
      query
    });
  },
  async findById(id) {
    return await userHistoryModel.findById(id);
  },
  /**
   *
   *
   * @param {UserHistoryCreate} doc
   * @param {any} session
   * @returns
   */
  async create(doc, { session } = {}) {
    if (doc.value) {
      doc.onModel = this.getOnModel(doc);
      return await new userHistoryModel(doc).save({ session });
    }
  },
  getOnModel(doc) {
    if (doc.onModel) return doc.onModel;
    switch (doc.type) {
      case 'pay_order':
        return 's_order';
      case 'return_canceled_order':
        return 's_order';
      case 'refund':
        return 's_order';
      case 'commission':
        return 's_order';
      case 'pay_cart':
        return 's_cart';
    }
  },
  async count(query) {
    return await userHistoryModel.countDocuments(query);
  },
  async aggregate(pipeline) {
    return await userHistoryModel.aggregate(pipeline);
  }
  // async
};
