import { Promise } from 'bluebird';
import elasticService from '../../../commons/elastic/elastic.service';
import productStoringServiceV1 from '../product-storing.service';
import { logger, mergeObject, BaseError, errorCode } from '../../../commons/utils';
import productStoringModel, { productStoringOptions } from '../product-storing.model';
import extendService from '../../../commons/utils/extend-service';
import { Statuses } from './product-storing.config';

export default {
  ...extendService(productStoringModel),
  ...productStoringServiceV1,
  async findOneEnsure(query, select, options = {}) {
    const productStoring = await productStoringModel.findOne(query, select, options);
    if (!productStoring) {
      throw new BaseError({
        statusCode: 404,
        error: errorCode.client,
        errors: {
          product_storing: errorCode['client.productNotExistInStore']
        }
      });
    }

    return productStoring;
  },
  async findManyEnsure(queries, select, options = {}) {
    const productStorings = await Promise.map(
      queries,
      (query) => this.findOneEnsure(query, select, options),
      { concurrency: 10 }
    );

    return productStorings;
  },
  findOneActive(query, select, options) {
    const customQuery = {
      ...query,
      status: Statuses.Active
    };
    return productStoringModel.findOne(customQuery, select, options);
  },
  findOneAndUpdate(query, updates, options = {}) {
    return productStoringModel.findOneAndUpdate(query, updates, { ...options, new: true });
  },
  findOneActiveAndUpdate(query, updates, options = {}) {
    const customQuery = {
      ...query,
      status: Statuses.Active
    };
    const opts = { ...options, new: true };
    return productStoringModel.findOneAndUpdate(customQuery, updates, opts);
  },
  findOneActiveAndDelete(query) {
    const customQuery = {
      ...query,
      status: Statuses.Active
    };
    return productStoringModel.findOneAndDelete(customQuery);
  },
  findManyActive(query, select, options) {
    return productStoringModel.find({ ...query, status: Statuses.Active }, select, options);
  },
  create({ _id, id, __v, updatedAt, createdAt, ...doc }, options = {}) {
    return new productStoringModel(doc).save(options);
  },
  createFromProduct({ productDoc, newFields = {} }, options = {}) {
    const { _id, id, __v, status, updatedAt, createdAt, ...dataToCreate } = productDoc.toObject
      ? productDoc.toObject()
      : productDoc;
    dataToCreate.product_id = dataToCreate.product_id || id;
    Object.assign(dataToCreate, newFields);

    return new productStoringModel(dataToCreate).save(options);
  },
  async indexElasticSearch(query) {
    if (!elasticService.active) return;
    const productStorings = await productStoringModel.find(
      mergeObject(query, productStoringOptions.query),
      null,
      {
        populate: productStoringOptions.populate
      }
    );
    productStorings.map((ps) => {
      try {
        const { store_id, product_id, name } = ps;
        elasticService.client.index({
          id: ps.id,
          type: productStoringModel.modelName,
          index: productStoringModel.collection.name,
          body: {
            store_id: ps.store_id,
            company_id: ps.company_id,
            product_id: ps.product_id,
            name: ps.name,
            price: ps.price,
            refund_rate: ps.refund_rate,
            promotion_refund_rate: ps.promotion_refund_rate,
            total_refund_rate: ps.total_refund_rate,
            discount_rate: ps.discount_rate,
            refund: ps.refund,
            discount: ps.discount,
            is_limited_stock: ps.is_limited_stock,
            stock: ps.stock,
            is_lucky: ps.is_lucky,
            sold: ps.sold,
            result_type: 'product',
            transportable: ps.transportable,
            true_refund: Math.round((ps.refund * 9) / 10),
            coordinates: store_id.location.coordinates,
            showable: ps.is_active_product && ps.is_active_store && ps.is_active_company
          }
        });
      } catch (error) {
        logger.error(error);
      }
    });
  },
  async updateSoldCount({ productStoringId, modelId, quantity }) {
    try {
      const productStoring = await productStoringModel.findById(productStoringId);
      const model = productStoring.model_list.find(
        (model) => model._id.toString() === modelId.toString()
      );
      model.sold += quantity;
      productStoring.sold_count += quantity;
      return await productStoring.save();
    } catch (error) {
      logger.error(error);
    }
  }
};
