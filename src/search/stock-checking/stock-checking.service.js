import { BaseError, errorCode } from '../../commons/utils';
import extendService from '../../commons/utils/extend-service';
import stockCheckingModel from './stock-checking.model';

export default {
  ...extendService(stockCheckingModel),
  async createAndPopulate({ doc, populate, options }) {
    return await (await new stockCheckingModel(doc).save(options))
      .populate(populate)
      .execPopulate();
  },
  async findOneEnsure(query, select, options) {
    const stockChecking = await stockCheckingModel.findOne(query, select, options);
    if (!stockChecking)
      throw new BaseError({
        statusCode: 404,
        error: errorCode.client,
        errors: { stockChecking: errorCode['client.stockCheckingNotFound'] }
      });
    return stockChecking;
  },
  async updateAndPopulate({ query, doc, populate, options }) {
    const opts = { ...options, new: true, runValidators: true };
    return await (
      await stockCheckingModel.findOneAndUpdate(query, doc, opts).populate(populate)
    ).execPopulate();
  }
};
