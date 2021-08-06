import { BaseError, errorCode, mergeObject, selectToPopulate } from '../../commons/utils';
import findAdvanced from '../../commons/utils/find-advanced';
import orderCachingModel from './order-caching.model';
import extendService from '../../commons/utils/extend-service';
import { getDateRangeQuery } from '../../commons/utils/utils';
import { PopulatedFields } from '../order/v2/order.config';

export default {
  ...extendService(orderCachingModel),
  findOneActive(query, select, options = {}) {
    return orderCachingModel.findOne(
      {
        ...query,
        ...getDateRangeQuery('expiresAt', { fromDate: new Date() }),
        is_confirmed: false
      },
      select,
      options
    );
  },
  findOneActiveAndUpdate(query, select, options = {}) {
    return orderCachingModel.findOneAndUpdate(
      {
        ...query,
        ...getDateRangeQuery('expiresAt', { fromDate: new Date() }),
        is_confirmed: false
      },
      select,
      options
    );
  },
  async findOneExists(query, select, options = {}) {
    const order = await orderCachingModel.findOne(
      {
        ...query,
        ...getDateRangeQuery('expiresAt', { fromDate: new Date() }),
        is_confirmed: false
      },
      select,
      options
    );
    if (!order) {
      throw new BaseError({
        statusCode: 404,
        error: errorCode.client,
        errors: { order_id: errorCode['client.orderNotExist'] }
      });
    }

    return order;
  },
  async getNewest(query, select, options = {}) {
    const { session, ...opts } = options;
    let populate = opts.populate || [];
    // Populate `products.product` for up-to-date info from storing (in case: not included)
    if (!populate.find((p) => p.path === 'products.product_storing')) {
      populate = [
        ...populate,
        {
          path: 'products.product_storing',
          select:
            'stock batch_stock on_sales_stock is_limited_stock true_refund total_refund_rate refund promotion product_id refund_rate'
        }
      ];
      opts.populate = populate;
    }

    const order = await this.findOneExists(query, select, { session, ...opts });

    if (order && !order.without_product) {
      order.products.forEach((product) => {
        const productDetail = { ...product.toObject(), ...product.product_storing.toObject() };
        product.storing_detail = productDetail;
      });
      await order.getPriceV3({
        mustGotPromotionCode: false,
        options: { session },
        isChangePromotionQuantity: false
      });
    }

    return await order.save({ session });
  },
  async find({ limit, page, select, sort, populate, ...query }) {
    return await findAdvanced(orderCachingModel, {
      query: mergeObject({}, query),
      limit,
      page,
      select,
      sort,
      populate
    });
  },
  /**
   *
   *
   * @param {{
   *       without_product: boolean,
   *       total: string,
   *       original_total: string,
   *       refund_rate: string,
   *       total_refund: string,
   *       total_discount: string,
   *       discount_rate: string,
   *       user_id: string,
   *       store_id: string,
   *       company_id: string,
   *       seller_id: string,
   *       cashier_id: string,
   *       products: {},
   *       type: 'offline',
   *       payment_method: string,
   *       is_created_from_menu: boolean
   *       position: string
   *       company_note: string,
   *       progress_status: string
   *     }} doc
   * @param {object} options
   * @returns {Promise<SOrder>}
   */
  async createOffline(doc, options = {}) {
    const { needGetPrice = true, populate: populatedStr, ...opts } = options;
    const orderCaching = new orderCachingModel(doc);

    orderCaching.products.forEach((product) => {
      product.storing_detail = product;
    });
    needGetPrice && (await orderCaching.getPriceV3());
    await orderCaching.save(opts);

    // Populate fields (if any)
    if (populatedStr) {
      const { populate } = selectToPopulate(populatedStr, PopulatedFields);
      await orderCaching.populate(populate).execPopulate();
    }

    return orderCaching;
  },
  /**
   *
   * @param {string} id
   * @returns {SOrder}
   */
  async findById(id) {
    return await orderCachingModel.findById(id);
  },
  /**
   *
   * @param {{ code, user_id, company_id, _id, select, populate, ...query }} param
   * @returns {SOrder}
   */
  async findByCode({ code, user_id, company_id, _id, select, populate, ...query }) {
    const order = await orderCachingModel.findOne(
      mergeObject({}, { _id, code, user_id, company_id, ...query }),
      select,
      mergeObject({}, { populate })
    );
    if (!order)
      throw new BaseError({
        statusCode: 400,
        error: errorCode.client,
        errors: {
          order_id: errorCode['client.orderNotExist']
        }
      });
    return order;
  },
  /**
   *
   *
   * @param {*} query
   * @param {*} select
   * @param {*} options
   * @returns {Promise<SOrder>}
   */
  async findOne(query, select, options) {
    return await orderCachingModel.findOne(query, select, options);
  },
  async statistic(query) {
    return orderCachingModel.aggregate([
      {
        $match: query
      },
      {
        $group: {
          _id: {
            $dateToString: {
              date: '$createdAt',
              format: '%Y-%m-%d'
            }
          },
          date: { $first: '$createdAt' },
          totals: { $push: '$total' },
          total_refunds: { $push: '$total_refund' },
          total_service_fees: { $push: '$total_service_fee' },
          total_discounts: { $push: '$total_discounts' },
          count: { $sum: 1 }
        }
      },
      {
        $addFields: {
          total: {
            $sum: '$totals'
          },
          min: {
            $min: '$totals'
          },
          max: {
            $max: '$totals'
          },
          avg: {
            $avg: '$totals'
          },
          total_refund: {
            $sum: '$total_refunds'
          },
          total_service_fee: {
            $sum: '$total_service_fees'
          },
          total_discount: {
            $sum: '$total_discounts'
          }
        }
      },
      {
        $sort: { date: -1 }
      }
    ]);
  },
  async aggregate({ limit = 10, skip = 0, sort = '-totalOrders', pipeline }) {
    return await orderCachingModel.aggregate(pipeline).limit(limit).skip(skip).sort(sort);
  },
  update(query, doc, options) {
    return orderCachingModel
      .findOneAndUpdate(query, doc, {
        new: true,
        runValidators: true,
        setDefaultsOnInsert: true,
        ...options
      })
      .exec();
  },
  async count(query) {
    return await orderCachingModel.countDocuments(mergeObject({}, query));
  }
};
