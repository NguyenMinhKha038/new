import { BaseError, errorCode } from '../../commons/utils';
import extendService from '../../commons/utils/extend-service';
import { Statuses } from './product-attribute.config';
import productAttributeModel from './product-attribute.model';

export default {
  ...extendService(productAttributeModel),
  async create(doc) {
    return await productAttributeModel.create(doc);
  },
  async findOne({ query, select, populate }) {
    return await productAttributeModel.findOne(query, select, { populate });
  },
  async findOneActiveEnsure({ query, select, populate }) {
    const productAttribute = await productAttributeModel.findOne(
      { ...query, status: Statuses.Active },
      select,
      { populate }
    );
    if (!productAttribute)
      throw new BaseError({
        statusCode: 400,
        error: errorCode.client,
        errors: { productAttribute: errorCode['client.productAttributeNotFound'] }
      });
    return productAttribute;
  },
  async update(query, doc) {
    return await productAttributeModel.findOneAndUpdate(query, doc, {
      new: true,
      runValidators: true
    });
  },
  async deleteProductAttribute(query) {
    return await productAttributeModel.findOneAndUpdate(
      query,
      { status: Statuses.Disabled },
      {
        new: true,
        runValidators: true
      }
    );
  }
};
