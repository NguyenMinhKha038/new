import { BaseError, errorCode, findAdvanced, mergeObject, logger } from '../../commons/utils';
import productModel from './product.model';
import categoryService from '../category/category.service';
import Promise from 'bluebird';
import storeService from '../store/store.service';
import productReactionModel from './product-reaction.model';
import statisticService from '../statistic/statistic.service';
import productStoringService from '../product-storing/product-storing.service';
import promotionService from '../promotion/promotion.service';
import companyService from '../company/company.service';
import notificationService from '../notification/notification.service';
import behaviorService from '../behavior/behavior.service';
import { Types as BehaviorTypes } from '../behavior/behavior.config';
const ReactionTypes = BehaviorTypes.Reaction;

const productService = {
  async findOneEnsure(query, select, options = {}) {
    const product = await productModel.findOne(query, select, options);
    if (!product)
      throw new BaseError({
        statusCode: 404,
        error: errorCode.client,
        errors: { product_id: errorCode['client.productNotExist'] }
      });

    return product;
  },
  async find({ limit, page, select, sort, populate, ...query }) {
    query = mergeObject({}, query);
    return await findAdvanced(productModel, {
      limit,
      page,
      select,
      sort,
      populate,
      query
    });
  },
  async findById(id, select, options = {}) {
    const product = await productModel.findById(id, select, options);
    if (!product)
      throw new BaseError({
        statusCode: 400,
        error: errorCode.client,
        errors: { product_id: errorCode['client.productNotExist'] }
      });
    return product;
  },
  async findReaction({ limit, page, select, sort, query, populate }) {
    return findAdvanced(productReactionModel, {
      query,
      limit,
      page,
      select,
      sort,
      populate
    });
  },
  async findOneReaction(query, update = {}, select) {
    return productReactionModel.findOneAndUpdate(query, update, {
      upsert: true,
      setDefaultsOnInsert: true,
      new: true,
      select
    });
  },
  async findReactionByIp(product_id, ip) {
    return productReactionModel.findOne({ product_id, ip, view: true }, null, {
      sort: '-last_view'
    });
  },
  async findOne(query, select, options = {}) {
    const product = await productModel.findOne(query, select, options);
    return product;
  },
  async findOneActive(query, select, options = {}) {
    return await productModel.findOne(
      { ...query, is_active_company: true, status: 'approved' },
      select,
      options
    );
  },
  async findActive(query, select, options = {}) {
    const product = await productModel.findOne(
      { ...query, status: 'approved', is_active_company: true },
      select,
      options
    );
    if (!product)
      throw new BaseError({
        statusCode: 400,
        error: errorCode.client,
        errors: { product_id: errorCode['client.productNotExist'] }
      });
    return product;
  },
  async findOneAndUpdate(query, doc, options) {
    const opts = { ...options, new: true };
    return await productModel.findOneAndUpdate(query, doc, opts);
  },
  async create(doc) {
    return await productModel.create(doc);
  },
  generate(doc) {
    return new productModel(doc);
  },
  async update(query, doc, isForcedIndex) {
    const product = await productModel.findOne(query);
    if (!product)
      throw new BaseError({
        statusCode: 400,
        error: errorCode.client,
        errors: { product_id: errorCode['client.productNotExist'] }
      });
    const is_new = product.is_new;
    Object.assign(product, doc);
    if (product.transportable && !product.packaging_weight)
      throw new BaseError({
        statusCode: 400,
        error: errorCode.client,
        errors: { packaging_attribute: errorCode['client.missingPackagingAttributes'] }
      });
    logger.info('modifiedPaths %o', product.modifiedPaths());
    const needIndex = product.modifiedPaths().length;
    if (
      needIndex &&
      !product
        .modifiedPaths()
        .every((path) => ['transportable', 'is_limited_stock', 'status'].includes(path))
    )
      product.status = 'pending';
    const needUpdatePs = product
      .modifiedPaths()
      .some((path) =>
        [
          'status',
          'transportable',
          'is_limited_stock',
          'price',
          'refund_rate',
          'promotion_refund_rate',
          'total_refund_rate',
          'refund',
          'discount_rate',
          'discount'
        ].includes(path)
      );
    const needUpdateLimit = product
      .modifiedPaths()
      .some((path) =>
        [
          'status',
          'price',
          'refund_rate',
          'promotion_refund_rate',
          'total_refund_rate',
          'refund',
          'discount_rate',
          'discount'
        ].includes(path)
      );
    const needUpdateByChangedStatus = product.isModified('status');
    logger.info('%o', { needIndex, needUpdateByChangedStatus, needUpdatePs, needUpdateLimit });
    await product.save();
    (async () => {
      if (needUpdatePs) {
        await productStoringService.updateMany(
          { product_id: product.id },
          {
            transportable: product.transportable,
            is_limited_stock: product.is_limited_stock,
            price: product.price,
            refund_rate: product.refund_rate,
            promotion_refund_rate: product.promotion_refund_rate,
            total_refund_rate: product.total_refund_rate,
            refund: product.refund,
            discount_rate: product.discount_rate,
            discount: product.discount,
            is_new: false,
            is_active_product: product.status === 'approved'
          }
        );
      }
      if (needIndex) {
        if (needUpdateByChangedStatus) {
          // + notify user about new product
          product.status === 'approved' && is_new && this.sendNotification(product);
          companyService.updateActiveProduct(product.company_id);
        }
        needUpdateLimit &&
          (await promotionService.updateMaxRefund({
            company_id: product.company_id
          }));
        productStoringService.indexElasticSearch({ product_id: product.id });
      }
    })();
    return product;
  },
  async updateMany(query, doc) {
    return await productModel.updateMany(query, doc, {
      runValidators: true,
      setDefaultsOnInsert: true,
      multi: true
    });
  },
  async count(query) {
    return await productModel.countDocuments(mergeObject({}, query));
  },
  async countReaction(query) {
    return await productReactionModel.countDocuments(mergeObject({}, query));
  },
  async isValidStore(store_id, company_id) {
    return await Promise.map(store_id, (_id) => {
      return storeService.findActive({ _id: store_id, company_id });
    });
  },
  async isValidCategory(category_id, parent_category_id) {
    const category = await categoryService.findActive(category_id);
    if (!category && category.parent_id.toString() !== parent_category_id.toString())
      throw new BaseError({
        statusCode: 400,
        error: errorCode.client,
        errors: { category_id: errorCode['client.categoryParentNotMatch'] }
      });
  },
  changeCount(product_id, change, options = {}) {
    try {
      options.select = Object.keys(change).toString().replace(',', ' ');
      //  * static
      // productStaticsService.create({ user_id: product.user_id, product_id }, { comments_count: change });
      return productModel
        .findByIdAndUpdate(product_id, { $inc: change }, { new: true, ...options })
        .exec();
    } catch (error) {
      logger.error(error);
    }
  },
  async viewUp({ product, ip, user }) {
    const { company_id, type_category_id, company_category_id, sub_category_id } = product;
    const { id: user_id, name: user_name } = user || {};
    if (!ip) return;
    // ip = '1.2.3.5';
    const [productReaction, productReactionIp] = await Promise.all([
      this.findOneReaction(
        mergeObject(
          { product_id: product.id },
          { user_id },
          !user && {
            ip,
            user_id: { $exists: false }
          }
        ),
        { user_name }
      ),
      this.findReactionByIp(product.id, ip)
    ]);
    if (user) {
      if (
        (productReaction.view === false && !productReactionIp) ||
        (productReactionIp &&
          new Date() - productReactionIp.last_view > 1000 * 60 * 60 * 24 &&
          new Date() - productReaction.last_view > 1000 * 60 * 60 * 24)
      ) {
        productReaction.view = true;
        productReaction.views_count++;
        productReaction.ip = ip;
        productReaction.last_view = new Date();
        productService.changeCount(product.id, { views_count: 1 });
        statisticService.update({ total_view: 1 });
      }

      //* behavior
      behaviorService.createReactionBehavior({
        user_id,
        type: ReactionTypes.View_Product,
        reaction_id: productReaction._id,
        on_model: 's_product_reaction',
        product_id: product.id,
        company_id,
        type_category_id,
        company_category_id,
        sub_category_id
      });
    } else {
      if (!productReactionIp) {
        productReaction.ip = ip;
        productReaction.view = true;
        productReaction.views_count++;
        productReaction.last_view = new Date();
        productService.changeCount(product.id, { views_count: 1 });
        statisticService.update({ total_view: 1 });
      } else {
        if (new Date() - productReactionIp.last_view > 1000 * 60 * 60 * 24) {
          productReaction.ip = ip;
          productReaction.views_count++;
          productReaction.view = true;
          productService.changeCount(product.id, { views_count: 1 });
          productReaction.last_view = new Date();
          statisticService.update({ total_view: 1 });
        }
      }
    }
    //* static
    await productReaction.save();
  },
  async statisticBySubCategory(query) {
    let pipeline = [
      {
        $group: {
          _id: '$sub_category_id',
          totalProduct: { $sum: 1 },
          company_category_id: { $first: '$company_category_id' },
          type_category_id: { $first: '$type_category_id' }
        }
      },
      {
        $lookup: {
          from: 's_categories',
          localField: '_id',
          foreignField: '_id',
          as: 'category'
        }
        // $lookup: {
        //   from: 's_categories',
        //   localField: 'company_category_id',
        //   foreignField: '_id',
        //   as: 'category'
        // }
      },
      {
        $lookup: {
          from: 's_categories',
          localField: 'company_category_id',
          foreignField: '_id',
          as: 'company_category'
        }
      },
      {
        $lookup: {
          from: 's_categories',
          localField: 'type_category_id',
          foreignField: '_id',
          as: 'type_category'
        }
      }
    ];
    if (query) {
      pipeline = [
        query && {
          $match: query
        }
      ].concat(pipeline);
    }
    return await productModel.aggregate(pipeline);
  },
  async sendNotification(product) {
    product.is_new = false;
    product.save();
    const followedUsers = await companyService.findReaction({
      query: { company_id: product.company_id, follow: true },
      limit: 0
    });
    if (followedUsers.length) {
      const user_ids = followedUsers.map((follow) => follow.user_id);
      notificationService.createAndSendMultiple({
        user_ids,
        type: 'user_new_product',
        message: `${product.name} - ${product.description}`,
        title: `Sản phẩm mới mà bạn quan tâm`,
        object_id: product.id,
        onModel: 's_product'
      });
    }
  },
  async updateByProductStoring(company_id) {
    logger.info('update Products By ProductStoring Changes %s', company_id);
    const products = await productModel.find({
      company_id: company_id
    });
    await Promise.map(products, async (product) => {
      await this.updateOneByProductStoring(product);
    });
  },
  async updateOneByProductStoring(product) {
    const productStorings = await productStoringService.find({
      product_id: product._id,
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
    product.promotion_discount_rate = maxDiscountModel
      ? maxDiscountModel.promotion_discount_rate
      : 0;
    product.promotion_refund_rate = maxRefundModel ? maxRefundModel.promotion_refund_rate : 0;
    product.discount_rate = maxDiscountModel ? maxDiscountModel.discount_rate : 0;
    product.discount = maxDiscountModel ? maxDiscountModel.discount : 0;
    product.global_promotion_refund_rate = maxRefundModel
      ? maxRefundModel.global_promotion_refund_rate
      : 0;
    product.global_promotion_discount_rate = maxDiscountModel
      ? maxDiscountModel.global_promotion_discount_rate
      : 0;
    product.total_refund_rate = maxRefundModel
      ? maxRefundModel.total_refund_rate
      : product.refund_rate;
    product.refund = maxRefundModel ? maxRefundModel.refund : product.refund;
    if (product.modifiedPaths().length) await product.save();
  },
  async updateByPromotion(company_id) {
    logger.info('update Products By Promotion Changes %s', company_id);
    const products = await productModel.find({
      company_id: company_id
    });
    const promotions = await promotionService.find({
      query: {
        company_id,
        expire_at: { $gte: new Date() },
        start_at: { $lte: new Date() },
        status: 'active'
      }
    });
    await Promise.each(products, async (product) => {
      const productPromotion = await this.findPromotionOfProduct({
        product_id: product.id,
        company_id,
        promotions
      });
      await this.updateOneByPromotion(product, productPromotion);
    });
  },
  async updateOneByPromotion(product, promotion) {
    if (!promotion) {
      promotion = await this.findPromotionOfProduct({
        company_id: product.company_id,
        product_id: product._id
      });
    }
    product.discount_rate = promotion ? promotion.value : 0;
    product.discount = product.discount_rate * product.price;
    product.promotion_refund_rate = promotion ? promotion.refund : 0;
    product.total_refund_rate = product.promotion_refund_rate || product.refund_rate;
    product.refund = product.total_refund_rate * product.price || 0;
    if (product.modifiedPaths().length) await product.save();
  },
  async findPromotionOfProduct({ promotions, company_id, product_id }) {
    if (!promotions) {
      promotions = await promotionService.find({
        query: {
          company_id,
          expire_at: { $gte: new Date() },
          start_at: { $lte: new Date() },
          status: 'active'
        }
      });
    }
    for (const promotion of promotions) {
      const isExist = promotion.product_ids
        .map((id) => id.toString())
        .includes(product_id.toString());
      const isRemain = promotion.remain > 0 || promotion.unlimit;
      if (isExist && isRemain) return promotion;
    }
  },
  async updateStock(productId, changedStock, options = {}) {
    const { force = false, ...opts } = options;
    const product = await productModel.findOne({ _id: productId }, null, { ...opts });

    if (product.is_limited_stock || force) {
      product.stock += changedStock;
    }

    return await product.save({ session: opts.session });
  },
  collectionName: productModel.collection.name
};

export default productService;
