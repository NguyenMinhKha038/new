import { default as Bluebird, default as Promise } from 'bluebird';
import { getDistance } from 'geolib';
import elasticService from '../../commons/elastic/elastic.service';
import { BaseError, errorCode, findAdvanced, logger, mergeObject } from '../../commons/utils';
import companyLimitService from '../company/company-limit.service';
import companyService from '../company/company.service';
import baseLogistics from '../logistics/provider/base-logistics';
import productStoringService from '../product-storing/product-storing.service';
import storeModel, { storeOptions } from './store.model';

export default {
  async find({ limit = 100, page, select, sort, populate, ...query }) {
    return findAdvanced(storeModel, {
      limit,
      page,
      select,
      sort,
      query: mergeObject({}, query),
      populate
    });
  },
  async findById(id) {
    const store = await storeModel.findById(id);
    if (!store)
      throw new BaseError({
        statusCode: 400,
        error: errorCode.client,
        errors: {
          store_id: errorCode['client.storeNotExist']
        }
      });
    return store;
  },
  async findOne(query, select, options) {
    return storeModel.findOne(query, select, options);
  },
  async findOneEnsure(query, select, options) {
    const store = await storeModel.findOne(query, select, options);
    if (!store) {
      throw new BaseError({
        statusCode: 404,
        error: errorCode.client,
        errors: { product: errorCode['client.storeNotExist'] }
      });
    }

    return store;
  },
  async findOneActive(query, select, options) {
    return await storeModel.findOne({ ...query, status: 'active' }, select, options);
  },
  async findOneActiveAndUpdate(query, updates, options = {}) {
    const customQuery = {
      ...query,
      status: 'active'
    };
    const opts = { ...options, new: true };
    return storeModel.findOneAndUpdate(customQuery, updates, opts);
  },
  async findManyActive(query, select, options) {
    return await storeModel.find({ ...query, status: 'active' }, select, options);
  },
  async findActive(query, select, options = {}) {
    const store = await storeModel.findOne({ status: 'active', ...query }, select, options);
    if (!store)
      throw new BaseError({
        statusCode: 404,
        error: errorCode.client,
        errors: {
          store_id: errorCode['client.storeNotExist']
        }
      });
    return store;
  },
  async isOwner(store_id, user_id) {
    const store = await this.findById(store_id);
    if (store.user_id.toString() !== user_id)
      throw new BaseError({
        statusCode: 400,
        error: errorCode.authorization,
        errors: {
          store_id: errorCode['permission.notAllow']
        }
      });
  },
  async create(doc) {
    try {
      return await storeModel.create(doc);
    } catch (error) {
      logger.error(error);
      throw new BaseError({ statusCode: 400, error: errorCode.client, errors: error });
    }
  },
  async update(query, doc, { online_sales } = {}) {
    const store = await storeModel.findOne(query);
    if (!store)
      throw new BaseError({
        statusCode: 400,
        error: errorCode.client,
        errors: {
          store_id: errorCode['client.storeNotExist']
        }
      });
    mergeObject(store, doc);
    const needIndexAll = store.isModified('status');
    const needIndex = store.modifiedPaths().length;
    (store.isModified('address') || store.isModified('name')) &&
      online_sales &&
      baseLogistics.ghn.updateStore(store);
    await store.save();
    if (needIndex) {
      this.updateOneByPromotion(store).then(async () => {
        if (needIndexAll) {
          companyService.changeCount(store.company_id, {
            total_store: store.status === 'active' ? 1 : -1
          });
          await productStoringService.updateMany(
            { store_id: store.id },
            { is_active_store: store.status === 'active' }
          );
          await companyLimitService.update(store.company_id);
        }
        this.indexElasticSearch({ _id: store.id });
        productStoringService.indexElasticSearch({ store_id: store.id });
      });
    }
    return store;
  },
  async count(query) {
    return storeModel.countDocuments(mergeObject({}, query));
  },
  async changeCount(store_id, change, options = {}) {
    try {
      return await storeModel.findByIdAndUpdate(
        store_id,
        { $inc: change },
        { setDefaultsOnInsert: true, ...options }
      );
    } catch (error) {
      throw error;
    }
  },
  async updateMany(query, doc) {
    return await storeModel.updateMany(query, doc, {
      runValidators: true,
      setDefaultsOnInsert: true,
      multi: true
    });
  },
  async updateProductCount(store_id, options = {}) {
    const [totalProduct, activeProduct] = await Promise.all([
      productStoringService.count({ store_id }),
      productStoringService.count({ store_id, active: true })
    ]);
    await storeModel.findByIdAndUpdate(
      store_id,
      { active_product: activeProduct, total_product: totalProduct },
      { new: true, session: options.session }
    );
  },
  async updateOneByPromotion(store) {
    try {
      const productStorings = await productStoringService.find({
        store_id: store._id,
        active: true,
        is_active_product: true
      });
      let maxDiscount = 0;
      let maxRefund = 0;
      let maxDiscountModel;
      let maxRefundModel;
      productStorings.map((productStoring) => {
        productStoring.model_list.map((model) => {
          if (model.refund > maxRefund) {
            maxRefund = model.refund;
            maxRefundModel = model;
          }
          if (model.discount > maxDiscount) {
            maxDiscount = model.discount;
            maxDiscountModel = model;
          }
        });
      });

      store.max_refund = maxRefundModel ? maxRefundModel.refund : 0;
      store.max_refund_rate = maxRefundModel ? maxRefundModel.total_refund_rate : 0;
      store.max_discount = maxDiscountModel ? maxDiscountModel.discount : 0;
      store.max_discount_rate = maxDiscountModel ? maxDiscountModel.discount_rate : 0;
      if (store.modifiedPaths().length) {
        await store.save();
        this.indexElasticSearch({ _id: store._id });
      }
    } catch (error) {
      logger.error(error);
      throw error;
    }
  },
  async updateByPromotion(company_id) {
    try {
      logger.info('update Store By Promotion Changes');
      const stores = await storeModel.find({ company_id });
      await Bluebird.each(stores, async (store) => {
        await this.updateOneByPromotion(store);
      });
    } catch (error) {
      logger.error(error);
    }
  },
  async getNearestStore({ company_id, location, stores, multi = false }) {
    stores =
      stores ||
      (await this.find({
        company_id,
        populate: 'store',
        status: 'active'
      }));
    stores.forEach((store) => {
      const distance = getDistance(
        { lat: store.location.coordinates[1], lon: store.location.coordinates[0] },
        { lat: location[1], lon: location[0] }
      );
      store.distance = distance;
    });
    const sortByDistanceOrder = stores.sort((a, b) => {
      return a.distance - b.distance;
    });
    return !multi ? sortByDistanceOrder[0] : sortByDistanceOrder;
  },
  async indexElasticSearch(query) {
    if (!elasticService.active) return;
    storeModel.find(query, null, { populate: storeOptions.populate }).then((stores) => {
      stores.map((store) => {
        try {
          const {
            name,
            address,
            max_refund,
            max_discount,
            discount_rate,
            company_id,
            type_category_id,
            company_category_id
          } = store;
          elasticService.client.index({
            id: store.id,
            type: storeModel.modelName,
            index: storeModel.collection.name,
            body: {
              name,
              address,
              company_id,
              max_refund,
              max_discount,
              discount_rate,
              type_category_id,
              company_category_id,
              coordinates: store.location.coordinates,
              result_type: 'store',
              true_max_refund: Math.round((max_refund * 9) / 10),
              showable: store.status === 'active' && store.is_active_company === true
            }
          });
        } catch (error) {
          return;
        }
      });
    });
  }
};
