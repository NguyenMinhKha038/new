import { BaseError, errorCode } from '../../commons/utils';
import extendService from '../../commons/utils/extend-service';
import stockCheckingItemModel from './stock-checking-item.model';

export default {
  ...extendService(stockCheckingItemModel),
  async create(doc, options) {
    return await new stockCheckingItemModel(doc).save(options);
  },
  async createAndPopulate({ doc, populate, options }) {
    if (!populate) populate = [];
    return await (await new stockCheckingItemModel(doc).save(options))
      .populate(populate)
      .execPopulate();
  },
  async updateOne(query, doc, options) {
    const opts = { ...options, new: true, runValidators: true };
    return await stockCheckingItemModel.findOneAndUpdate(query, doc, opts);
  },
  async updateAndPopulate({ query, doc, populate, options }) {
    const opts = { ...options, new: true, runValidators: true };
    return await (
      await stockCheckingItemModel.findOneAndUpdate(query, doc, opts).populate(populate)
    ).execPopulate();
  },
  async findOneEnsure(query, select, options) {
    const stockCheckingItem = await stockCheckingItemModel.findOne(query, select, options);
    if (!stockCheckingItem)
      throw new BaseError({
        statusCode: 404,
        error: errorCode.client,
        errors: { stockCheckingItem: errorCode['client.stockCheckingItemNotFound'] }
      });

    return stockCheckingItem;
  }
};
