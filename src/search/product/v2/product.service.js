import { BaseError, errorCode, findAdvanced, mergeObject } from '../../../commons/utils';
import productModelV2 from './product.model';
import { Statuses } from './product.config';
import extendService from '../../../commons/utils/extend-service';

export default {
  ...extendService(productModelV2),
  async find({ limit, page, select, sort, populate, ...query }) {
    query = mergeObject({}, query);
    return await findAdvanced(productModelV2, {
      limit,
      page,
      select,
      sort,
      populate,
      query
    });
  },
  async createAndPopulate({ doc, options, populate }) {
    populate = populate ? populate : [];
    const product = new productModelV2(doc);
    await product.save(options);
    return product.populate(populate).execPopulate();
  },

  findOneActive({ query, select, options }) {
    return productModelV2.findOne({ ...query, status: Statuses.Approved }, select, options);
  },

  async findOneActiveEnsure({ query, select, options }) {
    const product = await productModelV2.findOne(
      { ...query, status: Statuses.Approved },
      select,
      options
    );
    if (!product)
      throw new BaseError({
        statusCode: 400,
        error: errorCode.client,
        errors: { product: errorCode['client.productNotExist'] }
      });
    return product;
  },

  async findOneEnsure({ query, select, options = {} }) {
    const product = await productModelV2.findOne(query, select, options);
    if (!product)
      throw new BaseError({
        statusCode: 400,
        error: errorCode.client,
        errors: { product: errorCode['client.productNotExist'] }
      });
    return product;
  },

  async updateOneAndPopulate({ query, data, options, populate }) {
    const opts = { ...options, new: true, runValidators: true };
    await productModelV2.findOneAndUpdate(query, data, opts);
    return await productModelV2.findOne(query, null, { populate });
  }
};
