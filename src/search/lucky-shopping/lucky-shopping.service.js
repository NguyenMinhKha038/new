import { getDate, BaseError, errorCode, findAdvanced } from '../../commons/utils';
import luckyShoppingModel from './lucky-shopping.model';

export default {
  find({ limit, page, populate, select, sort, ...query }) {
    return findAdvanced(luckyShoppingModel, { limit, page, populate, query, select, sort });
  },
  async updateSold({ product_id, quantity }) {
    const luckyShopping = await this.findOne({ date: getDate() });
    const product = luckyShopping.products.find(
      (product) => product.product_id.toString() === product_id.toString()
    );
    product.sold += quantity;
    await luckyShopping.save();
  },
  findOne(...params) {
    return luckyShoppingModel.findOne(...params).exec();
  },
  count(query) {
    return luckyShoppingModel.countDocuments(query).exec();
  },
  async findActive(...params) {
    const luckyShopping = await luckyShoppingModel.findOne(...params).exec();
    if (!luckyShopping)
      throw new BaseError({
        statusCode: 404,
        error: errorCode.client,
        errors: { lucky_shopping: errorCode['client.notFound'] }
      });
    return luckyShopping;
  },
  async updateByDate(updates = {}) {
    return luckyShoppingModel.findOneAndUpdate({ date: getDate() }, updates, {
      upsert: true,
      new: true,
      runValidators: true
    });
  }
};
