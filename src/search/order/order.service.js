import { BaseError, errorCode, mergeObject, logger } from '../../commons/utils';
import findAdvanced from '../../commons/utils/find-advanced';
import productModel from '../product/product.model';
import orderModel from './order.model';

export default {
  async find({ limit, page, select, sort, populate, ...query }) {
    return await findAdvanced(orderModel, {
      query: mergeObject({}, query),
      limit,
      page,
      select,
      sort,
      populate
    });
  },
  /**
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
   *       products: [],
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
    const { needGetPrice = true, mustGotPromotionCode = false, ...opts } = options;
    const order = new orderModel(doc);
    order.products.forEach((product) => {
      product.storing_detail = product;
    });
    needGetPrice && (await order.getPriceV3({ mustGotPromotionCode }));
    return await order.save(opts);
  },
  async createOfflineCompanyPost(doc, options = {}) {
    const order = new orderModel(doc);
    return await order.save(options);
  },
  /**
   *
   * @param {string} id
   * @returns {Promise<SOrder>}
   */
  async findById(id) {
    return await orderModel.findById(id);
  },
  /**
   *
   * @param {{ code, user_id, company_id, _id, select, populate, ...query }} param
   * @returns {Promise<SOrder>}
   */
  async findByCode({ code, user_id, company_id, _id, select, populate, ...query }) {
    const order = await orderModel.findOne(
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
    return await orderModel.findOne(query, select, options);
  },

  async saveAndPopulate(docToSave, options = {}) {
    const { session, populate, ...opts } = options;
    await docToSave.save({ session, ...opts });

    docToSave = await orderModel.findOne({ _id: docToSave._id }, null, {
      session,
      populate,
      ...opts
    });

    return docToSave;
  },
  async statistic(query) {
    return orderModel.aggregate([
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
    return orderModel.aggregate(pipeline).skip(skip).limit(limit).sort(sort);
    // return await orderModel.aggregate(pipeline).limit(limit).skip(skip).sort(sort);
  },
  /**
   *
   * @param {{
   * cart_id,
   * products,
   * transport_fee,
   * calculated_transport_fee,
   * is_discount_transport,
   * user_id,
   * store_id,
   * company_id,
   * code,
   * payment_method,
   * delivery_address,
   * total,
   * address,
   * original_total,
   * total_discount,
   * total_refund,
   * promotion_code,
   * logistics_provider,
   * logistics_info,
   * is_lucky,
   * lucky_product_id
   * is_received_at_store
   * progress_status: 'pending'}} order
   * @returns {Order}
   */
  createByCart(order) {
    const orderProduct = order.products.map((item) => ({
      ...item.detail.toObject(),
      ...item.toObject(),
      price: item.original_price
    }));
    return new orderModel({
      ...order,
      products: orderProduct
    });
  },
  update(query, doc) {
    return orderModel
      .findOneAndUpdate(query, doc, {
        new: true,
        runValidators: true,
        setDefaultsOnInsert: true
      })
      .exec();
  },
  async count(query) {
    return await orderModel.countDocuments(mergeObject({}, query));
  },
  async statisticByProduct(query) {
    // console.log('query', query);
    const pipeline = [
      { $match: query },
      {
        $unwind: '$products'
      },
      {
        $group: {
          _id: '$products.id',
          quantity: { $sum: '$products.quantity' },
          order_id: { $first: '$_id' },
          applied_promotion_quantity: { $sum: '$products.applied_promotion_quantity' },
          total_discount: { $sum: '$products.total_discount' },
          total_refund: { $sum: '$products.total_refund' },
          total_price: { $sum: '$products.price' }
          // date: { $first: '$createdAt' }
        }
      },
      {
        $lookup: {
          from: productModel.collection.name,
          localField: '_id',
          foreignField: '_id',
          as: 'product'
        }
      },
      {
        $project: {
          'product.name': 1,
          'product.price': 1,
          'product._id': 1,
          // 'product.condition': 1,
          totalSale: 1,
          order_id: 1,
          applied_promotion_quantity: 1,
          total_discount: 1,
          total_refund: 1,
          quantity: 1,
          total_price: 1
        }
      },
      {
        $sort: { applied_promotion_quantity: -1 }
      }
    ];
    return await orderModel.aggregate(pipeline);
  },
  collectionName: orderModel.collection.name
};
