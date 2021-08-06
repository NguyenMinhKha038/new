import productStockHistoryModel from './product-stock-history.model';
import extendService from '../../../commons/utils/extend-service';

export default {
  ...extendService(productStockHistoryModel),
  async saveAndPopulate(doc, populate, options = {}) {
    const { session, ...opts } = options;
    await doc.save({ session, ...opts });

    doc = await productStockHistoryModel.findOne({ _id: doc._id }, null, {
      session,
      populate,
      ...opts
    });

    return doc;
  },
  async create({ _id, ...doc }, options = {}) {
    const history = new productStockHistoryModel(doc);
    return await history.save(options);
  },
  async createMulti(doc_arr, options = {}) {
    return await Promise.all(doc_arr.map((doc) => this.create(doc, options)));
  },
  async createAndPopulate(doc, populate, options = {}) {
    const newDoc = await this.create(doc, options);
    return await productStockHistoryModel.findOne({ _id: newDoc._id }, null, {
      populate,
      ...options
    });
  }
};
