import elasticService from '../../../commons/elastic/elastic.service';
import { BaseError, errorCode, logger, mergeObject } from '../../../commons/utils';
import mallStoringModel, { mallStoringOptions } from './mall-storing.model';
import extendService from '../../../commons/utils/extend-service';
import { Statuses } from './mall-storing.config';

export default {
  ...extendService(mallStoringModel),
  findOneActive(query, select, options) {
    const customQuery = {
      ...query,
      status: Statuses.Active
    };
    return mallStoringModel.findOne(customQuery, select, options);
  },
  findOneAndUpdate(query, updates, options = {}) {
    return mallStoringModel.findOneAndUpdate(query, updates, { ...options, new: true });
  },
  findOneActiveAndUpdate(query, updates, options = {}) {
    const customQuery = {
      ...query,
      status: Statuses.Active
    };
    const opts = { ...options, new: true };
    return mallStoringModel.findOneAndUpdate(customQuery, updates, opts);
  },
  findOneActiveAndDelete(query) {
    const customQuery = {
      ...query,
      status: Statuses.Active
    };
    return mallStoringModel.findOneAndDelete(customQuery);
  },
  async findOneEnsure(query, select, options = {}) {
    const mallStoring = await mallStoringModel.findOne(query, select, options);
    if (!mallStoring) {
      throw new BaseError({
        statusCode: 404,
        error: errorCode.client,
        errors: {
          mall_storing_id: errorCode['client.mallStoringNotFound']
        }
      });
    }

    return productStoring;
  },
  create({ _id, id, __v, updatedAt, createdAt, ...doc }, options = {}) {
    return mallStoringModel.create(doc, options);
  },
  async indexElasticSearch(query) {
    if (!elasticService.active) return;
    const mallStorings = await this.find(mergeObject(query, mallStoringOptions.query), null, {
      populate: mallStoringOptions.populate
    });
    mallStorings.map((ms) => {
      try {
        const { mall_id, product_id, name } = ms;
        elasticService.client.index({
          id: ms.id,
          type: mallStoringModel.modelName,
          index: mallStoringModel.collection.name,
          body: {
            mall_id: ms.mall_id,
            product_id,
            name,
            price: ms.price,
            refund_rate: ms.refund_rate,
            promotion_refund_rate: ms.promotion_refund_rate,
            total_refund_rate: ms.total_refund_rate,
            discount_rate: ms.discount_rate,
            refund: ms.refund,
            discount: ms.discount,
            is_limited_stock: ms.is_limited_stock,
            stock: ms.stock,
            batch_stock: ps.batch_stock,
            on_sales_stock: ps.on_sales_stock,
            is_lucky: ms.is_lucky,
            sold: ms.sold,
            result_type: 'product',
            transportable: ms.transportable,
            true_refund: Math.round((ms.refund * 9) / 10),
            coordinates: mall_id.location.coordinates,
            showable: ms.is_active_product && ps.is_active_mall && ps.active
          }
        });
      } catch (error) {
        logger.error(error);
      }
    });
  }
};
