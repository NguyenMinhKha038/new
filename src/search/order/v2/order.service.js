/* eslint-disable prettier/prettier */
import orderService from '../order.service';
import { BaseError, errorCode, selectToPopulate } from '../../../commons/utils';
import extendService from '../../../commons/utils/extend-service';
import orderModel from '../order.model';
import { PopulatedFields, SaleForms } from './order.config';
import { Promise } from 'bluebird';
import productStoringService from '../../product-storing/v2/product-storing.service';

export default {
  ...extendService(orderModel),
  ...orderService,
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
    const {
      needGetPrice = true,
      populate: populatedStr,
      mustGotPromotionCode = false,
      ...opts
    } = options;

    const order = new orderModel(doc);
    order.products.map((product) => { //duyệt qua mỗi sản phẩm trong order để tạo storing_detail
      product.storing_detail = product; //mỗi 1 sp sẽ có 1 mục chi tiết sản phẩm đó

      const { model_id } = product;
      const model = product.model_list.find( //kiểm tra modile_id sp đó có nằm trong model list k
        (model) => model._id.toString() === model_id.toString()
      );

      product.storing_detail.price = 
        product.type === SaleForms.Retail
          ? model.price
          : Math.ceil(model.box_price / model.stock_per_box);
      product.storing_detail.discount = model.discount;
      product.storing_detail.discount_rate = model.discount_rate;
      product.storing_detail.refund_rate = model.refund_rate;
      product.storing_detail.total_refund_rate = model.total_refund_rate;
    });
    needGetPrice && (await order.getPriceV3({ mustGotPromotionCode }));
    await order.save(opts);

    // Populate fields (if any)
    if (populatedStr) {
      const { populate } = selectToPopulate(populatedStr, PopulatedFields);
      await order.populate(populate).execPopulate();
    }

    return order;
  },
  async findOneExists(query, select, options = {}) {
    const order = await orderModel.findOne(query, select, options);
    if (!order) {
      throw new BaseError({
        statusCode: 404,
        error: errorCode.client,
        errors: { order_id: errorCode['client.orderNotExist'] }
      });
    }

    return order;
  }
};
