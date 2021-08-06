import extendService from '../../commons/utils/extend-service';
import productTemplateModel from './product-template.model';
import { BaseError, errorCode } from '../../commons/utils';
import { PopulatedFields } from './product-template.config';
import { Statuses } from './product-template.config';

export default {
  ...extendService(productTemplateModel),
  async createAndPopulate({ doc, populate = [], options = {} }) {
    const productTemplate = new productTemplateModel(doc);
    await productTemplate.save(options);
    return await productTemplate.populate(populate).execPopulate();
  },
  async getOne({ query, select, options }) {
    return await productTemplateModel.findOne(query, select, options);
  },
  async findOneActiveEnsure({ query, select, options }) {
    const productTemplate = await productTemplateModel.findOne(
      { ...query, status: Statuses.Active },
      select,
      options
    );
    if (!productTemplate)
      throw new BaseError({
        statusCode: 404,
        error: errorCode.client,
        errors: { productTemplate: errorCode['client.productTemplateNotFound'] }
      });
    return productTemplate;
  },
  async getLatestProductTemplate(query) {
    const productTemplates = await productTemplateModel
      .find({ ...query, status: Statuses.Active }, null, {
        populate: PopulatedFields,
        sort: '-version'
      })
      .limit(1);
    return productTemplates[0];
  },
  async getLatestProductTemplateEnsure(query) {
    const productTemplates = await productTemplateModel
      .find({ ...query, status: Statuses.Active }, null, {
        populate: PopulatedFields,
        sort: '-version'
      })
      .limit(1);
    if (!productTemplates || productTemplates.length == 0)
      throw new BaseError({
        statusCode: 404,
        error: errorCode.client,
        errors: { productTemplate: errorCode['client.productTemplateNotFound'] }
      });
    return productTemplates[0];
  },
  async deleteMany(query, options) {
    return await productTemplateModel.updateMany(
      query,
      { status: Statuses.Disabled },
      {
        new: true,
        runValidators: true
      }
    );
  },
  async updateOneAndPopulate({ query, data, options, populate }) {
    const opts = { ...options, new: true, runValidators: true };
    const updated = await productTemplateModel.findOneAndUpdate(query, data, opts);
    return await updated.populate(populate).execPopulate();
  }
};
