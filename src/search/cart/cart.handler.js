import Promise from 'bluebird';
import { userService } from '../../commons/user';
import { BaseError, errorCode, logger, transactionHelper } from '../../commons/utils';
import companyHistoryService from '../company-history/company-history.service';
import companyService from '../company/company.service';
import notificationService from '../notification/notification.service';
import orderService from '../order/order.service';
import productStoringHandler from '../product-storing/product-storing.handler';
import productStoringHandlerV2 from '../product-storing/v2/product-storing.handler';
import { Types as HistoryTypes } from '../product-stock-history/v2/product-stock-history.config';
import productService from '../product/product.service';
import promotionCodeService from '../promotion-code/promotion-code.service';
import userHistoryService from '../user-history/user-history.service';
import userMoneyFlowService from '../user-money-follow/user-money-flow.service';
import cartModel from './cart.model';
import cartService, { populateOptions } from './cart.service';
import './cart.typedef';
import moment from 'moment';
import addressService from '../address/address.service';
import luckyShoppingService from '../lucky-shopping/lucky-shopping.service';
import behaviorService from '../behavior/behavior.service';
import { Types as BehaviorTypes } from '../behavior/behavior.config';
import storeService from '../store/store.service';
const ShoppingTypes = BehaviorTypes.Shopping;

export default {
  async addProduct({ user_id, company_id, product_id, quantity, has_promotion }) {
    //* check isValid productStoring
    const [product, cart, company] = await Promise.all([
      productService.findActive({ _id: product_id }, null, { populate: 'productStorings' }),
      cartModel.findOneAndUpdate(
        { user_id, is_confirmed: false },
        { is_checkouted: false },
        { upsert: true, runValidators: true, new: true, setDefaultsOnInsert: true }
      ),
      companyService.findActive(company_id)
    ]);
    validateCart({ product, company, quantity });
    // * Is lucky
    if (product.is_lucky) {
      return generateTempLuckyCart({ user_id, product });
    }

    //* get store in order
    let isExistCompany = cart.orders.find((order) => order.company_id.toString() === company_id);
    //* get promotion code
    let codeObject =
      has_promotion && (!isExistCompany || (isExistCompany && !isExistCompany.promotion_code))
        ? await promotionCodeService.autoGet({ product_id })
        : {};
    const promotion_code = codeObject.code;
    const promotion_id = codeObject.promotion_id;
    if (!isExistCompany)
      cart.orders.push({
        _id: product.company_id,
        company_id: product.company_id,
        promotion_code,
        promotion_id,
        products: [
          {
            _id: product._id,
            id: product._id,
            company_id: product.company_id,
            quantity
          }
        ]
      });
    else {
      promotion_code && Object.assign(isExistCompany, { promotion_code, promotion_id });
      //* check product
      let isExistProduct = isExistCompany.products.find(
        (product) => product.id.toString() === product_id
      );
      !isExistProduct
        ? isExistCompany.products.push({
            _id: product._id,
            id: product._id,
            company_id: product.company_id,
            quantity
          })
        : Object.assign(isExistProduct, {
            quantity
          });
    }
    await cart.save();
    await cart
      .populate([populateOptions.detail, populateOptions.company, populateOptions.storing_detail])
      .execPopulate();
    await Promise.map(cart.orders, async (store) => {
      store.transport_fee = 0;
      await store.getPromotionCode();
      store.getPrice();
    });
    cart.getTotal();
    return cart;
  },
  async removeProduct({ user_id, product_id, company_id }) {
    const cart = await cartService.findActiveCart({
      user_id,
      populate: [
        populateOptions.detail,
        populateOptions.storing,
        populateOptions.company,
        populateOptions.storing_detail
      ]
    });
    const isExistCompany = cart.orders.find((order) => order.company_id.toString() === company_id);
    const isExistProduct =
      isExistCompany &&
      isExistCompany.products.find((product) => product.id.toString() === product_id);
    if (!isExistProduct)
      throw new BaseError({
        statusCode: 400,
        error: errorCode.client,
        errors: {
          product_storing: errorCode['client.productNotExist']
        }
      });
    isExistProduct.remove();
    if (isExistCompany && !isExistCompany.products.length) isExistCompany.remove();
    //* reset total, transport fee
    cart.is_checkouted = false;
    //*
    await cart.save();
    await Promise.map(cart.orders, async (order) => {
      order.getPrice();
    });
    cart.getTotal();
    return cart;
  },

  /**
   * @param {{cart: Cart, is_paid: boolean, user: User}} param
   */
  async handleConfirm({ cart, is_paid, user }) {
    const orders = await Promise.map(cart.orders, (order, i) => {
      return orderService.createByCart({
        cart_id: cart._id,
        products: order.products,
        user_id: user.id,
        company_id: order.company_id,
        store_id: order.store_id,
        store_address: order.store_address,
        code: cart.code + '_' + ++i,
        phone_number: cart.phone_number,
        payment_method: cart.payment_method,
        delivery_address: cart.delivery_address,
        transport_fee: order.transport_fee,
        calculated_transport_fee: order.calculated_transport_fee,
        is_discount_transport: order.is_discount_transport,
        total: order.total,
        total_discount: order.total_discount,
        total_refund: order.total_refund,
        original_total: order.original_total,
        promotion_code: order.promotion_code,
        promotion_id: order.promotion_id,
        logistics_info: order.logistics_info,
        logistics_provider: order.logistics_provider,
        logistics_display_name: order.logistics_display_name,
        is_lucky: cart.is_lucky,
        lucky_product_id: cart.is_lucky && order.products[0].id,
        is_received_at_store: order.is_received_at_store,
        expected_received_date: order.expected_received_date,
        progress_status: order.is_received_at_store ? 'pending' : undefined,
        note: order.note
      });
    });
    const payByWallet = cart.payment_method === 'WALLET';
    cart.is_confirmed = true;
    cart.is_paid = is_paid || payByWallet;
    const commission = cart.total_refund / 10;
    const refund = cart.total_refund - commission;
    const { bonus_available, s_prepaid } = userService.calculateWallet(user, cart.total);
    //* transaction
    let _user;
    await transactionHelper.withSession(async (session) => {
      [_user] = await transactionHelper.mapTransaction(
        payByWallet &&
          userService.updateWallet(user.id, {
            'wallet.total': -cart.total,
            'wallet.s_prepaid': -s_prepaid,
            'wallet.bonus_available': -bonus_available
          })
        // ...listUpdateCompany
      )(session);
      //* company refund history
      const updates = [];
      updates.push(
        Promise.map(orders, async (order, i) => {
          {
            if (payByWallet) order.is_paid = true;
            await order.save({ session });
          }
        })
      );
      if (payByWallet) {
        updates.push([
          userHistoryService.create(
            {
              user_id: user.id,
              type: userHistoryService.type.pay_cart,
              transaction_id: cart._id,
              new_balance: _user.wallet.total,
              value: -cart.total
            },
            { session }
          ),
          userMoneyFlowService.update(
            user.id,
            {
              total_pay: cart.total,
              total_loss: cart.total
            },
            { session }
          )
        ]);
      }
      updates.push(cartService.update({ _id: cart._id }, cart, { session }));
      await Promise.all(updates);
    });
    //* update limit
    // companyService.checkUpdateLimit(..._company);
    //* save orders
    Promise.each(orders, async (order) => {
      // * Notification
      if (order.is_lucky) {
        luckyShoppingService.updateSold({
          product_id: order.lucky_product_id,
          quantity: 1
        });
        notificationService.createAndSend({
          user_id: order.user_id,
          title: `Chúc mừng bạn đã tham gia thành công chương trình mua sắm may mắn ngày ${moment().format(
            'DD-MM-YYYY'
          )}`,
          message: `Giải thưởng sẽ được công bố vào ngày ${moment()
            .add(1, 'd')
            .format('DD-MM-YYYY')} lúc 11h30, hãy cùng đón xem nhé. `,
          type: 'user_pay_order_success',
          onModel: 's_order',
          object_id: order.id
        });
      } else {
        notificationService.getStaffAndSend({
          company_id: order.company_id,
          object_id: order._id,
          onModel: 's_order',
          staff_type: 'seller',
          store_id: order.store_id,
          type: 'company_new_order',
          title: 'Đơn hàng mới',
          message: `${user.name} đã đặt đơn hàng ${order.code} trên cửa hàng của bạn`
        });
      }
      // * update stock
      order.products.forEach((product) => {
        // product.is_limited_stock &&
        // productStoringHandler.updateStock({
        //   fromId: product._id,
        //   fromDeltaQuantity: -product.quantity,
        //   type: 'sell',
        //   performedUser: { _id: user.id },
        //   user: { _id: user.id },
        //   transactionId: order._id,
        //   onModel: 's_order'
        // });
        productStoringHandlerV2.updateStockAndCreateHistory(
          { productStoringId: product._id, stock: -product.quantity },
          {
            type: HistoryTypes.Sell,
            transactionId: order._id,
            onModel: 's_order',
            performedUser: user
          }
        );
      });
      promotionCodeService.findOneAndUpdate({ code: order.promotion_code }, { status: 'used' });

      // Create user behavior --
      const _location = cart.delivery_address;
      const dataToCreate = order.products.map((product) => {
        return {
          user_id: order.user_id,
          type: ShoppingTypes.Buy_Online,
          type_category_id: product.type_category_id,
          company_category_id: product.company_category_id,
          sub_category_id: product.sub_category_id,
          company_id: order.company_id,
          store_id: order.store_id,
          product_id: product.id,
          order_id: order._id,
          location: _location
        };
      });
      behaviorService.createMultiShoppingBehavior(dataToCreate);
    });

    return orders;
  },
  checkStock(product, justOne = false) {
    if (!product.detail.is_limited_stock) return;
    const total_stock = !justOne
      ? product.storings.reduce((prev, curt) => prev + curt.stock, 0)
      : product.storing.stock;
    if (product.quantity > total_stock) {
      throw new BaseError({
        statusCode: 400,
        error: errorCode.client,
        errors: {
          stock: errorCode['client.outOfStock']
        }
      });
    }
  },

  async checkingLucky({ product_id, company_id, address_id, quantity, user_id }) {
    const [product, address, company] = await Promise.all([
      productService.findActive({ _id: product_id }, null, { populate: 'productStorings' }),
      addressService.findActive({ _id: address_id, user_id: user_id }),
      companyService.findActive(company_id)
    ]);
    validateCart({ product, company });
    return generateTempLuckyCart({ product, address, user_id, quantity });
  }
};

/**
 *
 *
 * @param {{product: SProduct, company, quantity: number}} param
 */
function validateCart({ product, company, quantity }) {
  const total_stock = product.productStorings.reduce((prev, curt) => prev + curt.stock, 0);
  if (product.company_id.toString() !== company.id)
    throw new BaseError({
      statusCode: 403,
      error: errorCode.client,
      errors: { company_id: errorCode['client.companyNotExist'] }
    });
  if (!company.online_sales)
    throw new BaseError({
      statusCode: 403,
      error: errorCode.client,
      errors: { logistics: errorCode['client.logisticsIsUnavailable'] }
    });
  if (product.is_limited_stock && total_stock - quantity < 0) {
    throw new BaseError({
      statusCode: 400,
      error: errorCode.client,
      errors: {
        stock: errorCode['client.outOfStock']
      }
    });
  }
}

/**
 * Create temp `lucky cart` `without saving`
 *
 * @param {{user_id, product:SProduct, address, quantity: number }} param
 * @returns
 */
async function generateTempLuckyCart({ user_id, product, address, quantity }) {
  if (!product.is_on_sale)
    throw new BaseError({
      statusCode: 400,
      error: errorCode.client,
      errors: {
        cantBuyThisProductAtThisTime: errorCode['client.cannotBuyThisTime']
      }
    });
  const cart = cartService.generate({
    delivery_address: address,
    user_id,
    orders: [
      {
        store_id: product.productStorings[0].store_id,
        store_address: {},
        company_id: product.company_id,
        products: [
          {
            _id: product.productStorings[0]._id,
            id: product._id,
            company_id: product.company_id,
            store_id: product.productStorings[0].store_id,
            quantity: quantity
          }
        ]
      }
    ],
    is_checkouted: true,
    is_paid: false,
    is_lucky: true,
    payment_method: 'WALLET'
  });
  await cart
    .populate([populateOptions.detail, populateOptions.company, populateOptions.storing_detail])
    .execPopulate();
  logger.info('_cart %o', cart);
  await Promise.map(cart.orders, async (store) => {
    store.transport_fee = 0;
    await store.getPromotionCode();
    store.getPrice();
  });
  cart.getTotal();
  return cart;
}
