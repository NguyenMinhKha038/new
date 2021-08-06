/* eslint-disable prettier/prettier */
import Bluebird, { Promise } from 'bluebird';
import elasticService from '../../commons/elastic/elastic.service';
import { BaseError, errorCode, findAdvanced, logger, mergeObject } from '../../commons/utils';
import productStoringModel, { productStoringOptions } from './product-storing.model';
import promotionService from '../promotion/promotion.service';
import globalPromotionRegistrationService from '../global-promotion-registration/global-promotion-registration.service';
import extendService from '../../commons/utils/extend-service';

const productStoringService = {
  ...extendService(productStoringModel),
  async create({ _id, ...doc }, options = {}) {
    const newDoc = new productStoringModel(doc);
    return await newDoc.save(options);
  },
  async findOne(query, select, options = {}) {
    return await productStoringModel.findOne(query, select, options);
  },
  async findOneEnsure(query, select, options = {}) {
    const productStoring = await productStoringModel.findOne(query, select, options);
    if (!productStoring)
      throw new BaseError({
        statusCode: 404,
        error: errorCode.client,
        errors: { productStoring: errorCode['client.productStoringNotFound'] }
      });
    return productStoring;
  },
  async find({ query, limit, page, select, sort, populate }) {
    return await findAdvanced(productStoringModel, {
      limit,
      page,
      select,
      sort,
      query,
      populate
    });
  },
  async rawFind(query, select, options) {
    return await productStoringModel.find(query, select, options);
  },
  async findByProductId(product_id, select) {
    return await productStoringModel.find({ product_id }, select);
  },
  async findActive({ populate, options = {}, select, ...query }) {
    const productStoring = await productStoringModel
      .findOne(
        {
          ...query,
          is_active_product: true,
          is_active_company: true,
          is_active_store: true
        },
        select,
        options
      )
      .populate(populate);
    if (!productStoring) {
      logger.info('query %o', query);
      throw new BaseError({
        statusCode: 400,
        error: errorCode.client,
        errors: {
          product_storing: errorCode['client.productNotExist']
        }
      });
    }
    return productStoring;
  },
  /**
   *
   *  update for cart v2, productStoring is active in a store
   *
   * @param {{ populate, select, ...query }} params
   * @returns {any}`productStoring`
   */
  async findActiveV2({ populate, select, ...query }) {
    const productStoring = await productStoringModel
      .findOne({
        ...query,
        is_active_product: true,
        is_active_company: true,
        is_active_store: true,
        active: true
      })
      .select(select)
      .populate(populate);
    if (!productStoring) {
      throw new BaseError({
        statusCode: 400,
        error: errorCode.client,
        errors: {
          product_storing: errorCode['client.productNotExist']
        }
      });
    }
    return productStoring;
  },
  async update(query, doc, options = {}) {
    return await productStoringModel.findOneAndUpdate(query, doc, {
      runValidators: true,
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
      ...options
    });
  },
  async updateMany(query, doc, options = {}) {
    return await productStoringModel
      .updateMany(query, doc, {
        runValidators: true,
        setDefaultsOnInsert: true,
        multi: true,
        ...options
      })
      .exec();
  },
  async remove(query) {
    return productStoringModel.findOneAndDelete(query);
  },
  async count(query) {
    return await productStoringModel.countDocuments(mergeObject({}, query));
  },
  async updateOneByPromotion({ productStoring, promotion, globalPromotion }) {
    if (!promotion) {
      promotion = await this.findPromotionOfProductStoring({
        company_id: productStoring.company_id,
        store_id: productStoring.store_id,
        product_id: productStoring.product_id
      });
    }

    if (!globalPromotion) {
      globalPromotion = await this.findGlobalPromotionOfProductStoring({ productStoring });
    }

    if (promotion) {
      const promotionProduct =
        promotion &&
        promotion.products.find(
          (product) => product._id.toString() === productStoring.product_id.toString()
        );
      if (!promotionProduct) {
        throw new BaseError({
          statusCode: 400,
          error: errorCode.client,
          errors: {
            product: errorCode['client.notValid']
          }
        });
      }
      promotionProduct.models.map((model) => {
        if (model.unlimited || model.remain > 0) {
          const productModel = productStoring.model_list.find(
            (item) => item._id.toString() === model.model_id.toString()
          );
          productModel.promotion_discount_rate = promotion ? promotion.value || 0 : 0;
          productModel.promotion_refund_rate = promotion ? promotion.refund || 0 : 0;
        }
      });
    }

    productStoring.model_list.map((model) => {
      if (!promotion) {
        model.promotion_discount_rate = 0;
        model.promotion_refund_rate = 0;
      }
      model.global_promotion_discount_rate = globalPromotion ? globalPromotion.value || 0 : 0;
      model.global_promotion_refund_rate = globalPromotion ? globalPromotion.refund || 0 : 0;
      model.discount_rate = model.global_promotion_discount_rate || model.promotion_discount_rate;
      model.discount = model.discount_rate * model.price;
      model.total_refund_rate =
        model.global_promotion_refund_rate || model.promotion_refund_rate || model.refund_rate;
      model.refund = model.total_refund_rate * model.price;
    });

    // if (productStoring.modifiedPaths().length) await productStoring.save();
    return await productStoring.save(); // TODO: FOR HOT FIX ONLY, ADD OPTIONS SESSION FOR THIS FUNC SOON AS POSSIBLE!
  },
  async updateByPromotion(company_id) {
    logger.info('update ProductStorings By Promotion Changes %s', company_id);
    const productStorings = await productStoringModel.find({ company_id: company_id });
    const promotions = await promotionService.mFind({
      company_id,
      expire_at: { $gte: new Date() },
      start_at: { $lte: new Date() },
      status: 'active'
    });
    const globalPromotionRegistrations = await globalPromotionRegistrationService.find({
      query: {
        company_id,
        start_at: { $lte: new Date() },
        expire_at: { $gte: new Date() },
        status: 'active',
        global_promotion_status: 'active'
      },
      options: {
        populate: { path: 'global_promotion' }
      }
    });
    await Promise.map(productStorings, async (productStoring) => {
      const productStoringPromotion = await this.findPromotionOfProductStoring({
        company_id: productStoring.company_id,
        store_id: productStoring.store_id,
        product_id: productStoring.product_id,
        promotions
      });
      const productStoringGlobalPromotion = await this.findGlobalPromotionOfProductStoring({
        productStoring,
        globalPromotionRegistrations
      });
      const update = await this.updateOneByPromotion({
        productStoring,
        promotion: productStoringPromotion,
        globalPromotion: productStoringGlobalPromotion
      });
      console.log("update",update)
    });
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
            pure_name: ps.pure_name,
            price: ps.price,
            refund_rate: ps.refund_rate,
            promotion_refund_rate: ps.promotion_refund_rate,
            total_refund_rate: ps.total_refund_rate,
            discount_rate: ps.discount_rate,
            refund: ps.refund,
            discount: ps.discount,
            is_limited_stock: ps.is_limited_stock,
            stock: ps.stock,
            batch_stock: ps.batch_stock,
            on_sales_stock: ps.on_sales_stock,
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
  async findPromotionOfProductStoring({ company_id, store_id, product_id, promotions }) {
    if (!promotions) {
      promotions = await promotionService.mFind({
        company_id,
        expire_at: { $gte: new Date() },
        start_at: { $lte: new Date() },
        status: 'active'
      });
    }
    // if V2
    if (promotions[0] && promotions[0].store_id) {
      return await this.findPromotionOfProductStoringV2({
        company_id,
        store_id,
        product_id,
        promotions
      });
    }
    for (const promotion of promotions) {
      const isExistProduct = promotion.product_ids
        .map((id) => id.toString())
        .includes(product_id.toString());
      const isRemain = promotion.remain > 0 || promotion.unlimit;
      if (isExistProduct && isRemain) return promotion;
    }
  },
  async findPromotionOfProductStoringV2({ company_id, store_id, product_id, promotions }) {
    if (!promotions) {
      promotions = await promotionService.mFind({
        company_id,
        expire_at: { $gte: new Date() },
        start_at: { $lte: new Date() },
        status: 'active'
      });
    }
    for (const promotion of promotions) {
      const isExistProduct = promotion.product_ids
        .map((id) => id.toString())
        .includes(product_id.toString());
      const isExactStore = promotion.store_id.toString() === store_id.toString();
      const productPromotion = promotion.products.id(product_id);
      const isRemain = productPromotion && productPromotion.is_remain;
      if (isExistProduct && isExactStore && isRemain) return promotion;
    }
  },
  async isMaxRefundOrDiscountOfCompany(productStoringId) {
    const [maxRefund, maxDiscount] = await Promise.all([
      productStoringService.findOne(
        {
          store_id: store._id,
          active: true,
          is_active_product: true
        },
        null,
        { sort: '-refund' }
      ),
      productStoringService.findOne(
        {
          store_id: store._id,
          active: true,
          is_active_product: true
        },
        null,
        { sort: '-discount' }
      )
    ]);
    return [maxRefund._id.toString(), maxDiscount._id.toString()].includes(
      productStoringId.toString()
    );
  },
  async findGlobalPromotionOfProductStoring({ productStoring, globalPromotionRegistrations }) {
    if (!globalPromotionRegistrations) {
      globalPromotionRegistrations = await globalPromotionRegistrationService.find({
        query: {
          company_id: productStoring.company_id,
          status: 'active',
          global_promotion_status: 'active',
          start_at: { $lte: new Date() },
          expire_at: { $gte: new Date() }
        },
        options: { populate: { path: 'global_promotion' } }
      });
    }
    const globalPromotionRegistration = globalPromotionRegistrations.find((registration) => {
      return registration.product_storing_ids.find((item) => item.equals(productStoring._id));
    });
    if (globalPromotionRegistration) {
      return globalPromotionRegistration.global_promotion;
    }
    return {};
  }
};

export default productStoringService;
