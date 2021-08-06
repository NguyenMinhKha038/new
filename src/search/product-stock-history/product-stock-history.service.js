import { BaseError, errorCode, findAdvanced, logger, mergeObject } from '../../commons/utils';
import productStockHistoryModel from './product-stock-history.model';

const productStockHistoryService = {
  async saveAndPopulate(docToSave, options = {}) {
    const { session, populate, ...opts } = options;
    await docToSave.save({ session, ...opts });

    docToSave = await productStockHistoryModel.findOne({ _id: docToSave._id }, null, {
      session,
      populate,
      ...opts
    });

    return docToSave;
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
  },
  async findOne(query, select, options = {}) {
    return await productStockHistoryModel.findOne(query, select, options);
  },
  async find({ query, limit, page, select, sort, populate }) {
    return await findAdvanced(productStockHistoryModel, {
      limit,
      page,
      select,
      sort,
      query,
      populate
    });
  },
  async count(query) {
    return await productStockHistoryModel.countDocuments(query);
  }
};

export default productStockHistoryService;
