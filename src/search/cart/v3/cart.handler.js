import Promise from 'bluebird';
import moment from 'moment';
import { userService } from '../../../commons/user';
import { BaseError, errorCode, logger, transactionHelper } from '../../../commons/utils';
import addressService from '../../address/address.service';
import companyService from '../../company/company.service';
import luckyShoppingService from '../../lucky-shopping/lucky-shopping.service';
import notificationService from '../../notification/notification.service';
import orderService from '../../order/order.service';
import productStoringHandlerV2 from '../../product-storing/v2/product-storing.handler';
import { Types as HistoryTypes } from '../../product-stock-history/v2/product-stock-history.config';
import productService from '../../product/product.service';
import promotionCodeService from '../../promotion-code/promotion-code.service';
import userHistoryService from '../../user-history/user-history.service';
import userMoneyFlowService from '../../user-money-follow/user-money-flow.service';
import cartModel from '../cart.model';
import cartService, { populateOptions } from '../cart.service';
import '../cart.typedef';
import productStoringService from '../../product-storing/product-storing.service';
import { promotionCodeServiceV2 } from '../../promotion-code/v2/promotion-code.service';
import { getDistance } from 'geolib';
import storeService from '../../store/store.service';
import {
  AccompaniedProductStatuses,
  ModelStatuses
} from '../../product-storing/v2/product-storing.config';
import sellingOptionService from '../../selling-option/selling-option.service';

export default {
  async addProduct({
    user_id,
    company_id,
    product_storing_id,
    quantity,
    model_id,
    options = [],
    accompanied_products = [],
    old_model_id
  }) {
    //* check isValid productStoring
    const requestOptions = options;
    const [productStoring, cart, company] = await Promise.all([
      productStoringService.findActive({
        _id: product_storing_id,
        populate: 'product options.option'
      }),
      cartModel.findOneAndUpdate(
        { user_id, is_confirmed: false },
        { is_checkouted: false },
        { upsert: true, runValidators: true, new: true, setDefaultsOnInsert: true }
      ),
      companyService.findActive(company_id)
    ]);
    accompanied_products.length &&
      (await Promise.map(accompanied_products, (product) => {
        productStoringService.findActive({ _id: product.product_storing_id });
      }));
    console.log(`===>: addProduct -> productStoring`, productStoring);
    const { standardizeOptions, validModel } = validateCart({
      product: productStoring,
      company,
      quantity,
      model_id,
      options,
      accompanied_products
    });
    // * Is lucky
    if (productStoring.is_lucky) {
      return generateTempLuckyCart({
        user_id,
        product: productStoring,
        model_id,
        accompanied_products,
        options: standardizeOptions
      });
    }
    //* get store in order
    let isExistStore = cart.orders.find(
      (order) => order.store_id.toString() === productStoring.store_id.toString()
    );
    if (!isExistStore)
      cart.orders.push({
        // _id: product.company_id,
        company_id: productStoring.company_id,
        store_id: productStoring.store_id,
        products: [
          {
            _id: productStoring._id,
            id: productStoring.product_id,
            product_id: productStoring.product_id,
            product_storing_id: productStoring._id,
            company_id: productStoring.company_id,
            store_id: productStoring.store_id,
            quantity,
            model_id,
            accompanied_products,
            options: standardizeOptions,
            model_list: productStoring.model_list,
            tier_variations: productStoring.tier_variations,
            model_name: validModel.name,
            model_images: validModel.images || []
          }
        ]
      });
    else {
      // update product model
      if (old_model_id) {
        let index;
        const oldProductModel = isExistStore.products.find((product, i) => {
          if (
            product.product_storing_id.toString() === product_storing_id &&
            product.model_id.toString() === old_model_id
          ) {
            index = i;
            return true;
          }
        });
        oldProductModel && isExistStore.products.splice(index, 1);
      }
      //* check product
      let isExistProduct = isExistStore.products.find(
        (product) =>
          productStoring.product_id.toString() === product.id.toString() &&
          product.model_id.toString() === model_id.toString()
      );
      isExistProduct
        ? Object.assign(isExistProduct, {
            quantity,
            accompanied_products,
            options: standardizeOptions,
            model_name: validModel.name,
            model_images: validModel.images || [],
            model_list: productStoring.model_list
          })
        : isExistStore.products.push({
            _id: productStoring._id,
            id: productStoring.product_id,
            product_id: productStoring.product_id,
            product_storing_id: productStoring._id,
            company_id: productStoring.company_id,
            store_id: productStoring.store_id,
            quantity,
            model_id,
            accompanied_products,
            options: standardizeOptions,
            model_list: productStoring.model_list,
            model_name: validModel.name,
            mode_images: validModel.images || [],
            tier_variations: productStoring.tier_variations
          });
    }
    await cart.save();
    await cart
      .populate([populateOptions.detail, populateOptions.company, populateOptions.storing_detail])
      .execPopulate();

    await Promise.map(cart.orders, async (order) => {
      order.transport_fee = 0;
      await order.getPriceV3({ cart: { isInCart: true, options: requestOptions } });
    });
    cart.getTotal();
    return cart;
  },
  async removeProduct({ user_id, product_storing_id, store_id, model_id }) {
    const cart = await cartService.findActiveCart({
      user_id,
      populate: [
        populateOptions.detail,
        populateOptions.storing,
        populateOptions.company,
        populateOptions.storing_detail
      ]
    });
    const existStore = cart.orders.find((order) => order.store_id.toString() === store_id);
    if (!existStore)
      throw new BaseError({
        statusCode: 400,
        error: errorCode.client,
        errors: {
          store: errorCode['client.storeNotExist']
        }
      });
    let isExistProduct;
    let index;
    isExistProduct = existStore.products.find((product, i) => {
      if (
        product.product_storing_id.toString() === product_storing_id &&
        product.model_id.toString() === model_id.toString()
      ) {
        index = i;
        return true;
      }
    });
    if (!isExistProduct)
      throw new BaseError({
        statusCode: 400,
        error: errorCode.client,
        errors: {
          product_storing: errorCode['client.productNotExist']
        }
      });
    if (isExistProduct.promotion_code_id)
      await promotionCodeServiceV2.autoGetV2({
        product_id: isExistProduct.id,
        company_id: isExistProduct.company_id,
        store_id: isExistProduct.store_id,
        promotion_code_id: isExistProduct.promotion_code_id,
        apply_count: 0,
        model_id
      });

    // isExistProduct.remove();
    existStore.products.splice(index, 1);
    if (!existStore.products.length) existStore.remove();
    //* reset total, transport fee
    cart.is_checkouted = false;
    //*
    await cart.save();

    await Promise.map(cart.orders, async (order) => {
      await order.getPriceV3({ cart: { isInCart: true } });
    });
    cart.getTotal();
    return cart;
  },

  /**
   * @param {{cart: Cart, is_paid: boolean, user: User}} param
   */
  async handleConfirm({ cart, is_paid, user }) {
    const orders = await Promise.map(cart.orders, (order, i) => {
      companyService.changeCount(order.company_id, { total_order: 1 });
      storeService.changeCount(order.store_id, { total_order: 1 });
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
        global_promotion_id: order.global_promotion_id,
        global_promotion_code: order.global_promotion_code,
        logistics_info: order.logistics_info,
        logistics_provider: order.logistics_provider,
        logistics_display_name: order.logistics_display_name,
        is_lucky: cart.is_lucky,
        lucky_product_id: cart.is_lucky && order.products[0].id,
        is_received_at_store: order.is_received_at_store,
        expected_received_date: order.expected_received_date,
        progress_status: order.is_received_at_store ? 'pending' : undefined,
        note: order.note,
        options: order.options,
        model_id: order.model_id,
        accompanied_products: order.accompanied_products,
        accompanied_product_price: order.accompanied_product_price,
        model_name: order.model_name,
        model_images: order.model_images || [],
        model_list: order.model_list
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
    await Promise.each(orders, async (order) => {
      // * Notification
      if (order.is_lucky) {
        luckyShoppingService.updateSold({
          product_id: order.lucky_product_id,
          quantity: 1
        });
        notificationService.createAndSend({
          user_id: order.user_id,
          title: `Ch??c m???ng b???n ???? tham gia th??nh c??ng ch????ng tr??nh mua s???m may m???n ng??y ${moment().format(
            'DD-MM-YYYY'
          )}`,
          message: `Gi???i th?????ng s??? ???????c c??ng b??? v??o ng??y ${moment()
            .add(1, 'd')
            .format('DD-MM-YYYY')} l??c 11h30, h??y c??ng ????n xem nh??. `,
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
          title: '????n h??ng m???i',
          message: `${user.name} ???? ?????t ????n h??ng ${order.code} tr??n c???a h??ng c???a b???n`
        });
      }
      // * update stock
      order.products.forEach((product) => {
        // product.is_limited_stock &&
        //   productStoringHandler.updateStock({
        //     fromId: product._id,
        //     fromDeltaQuantity: -product.quantity,
        //     type: 'sell',
        //     performedUser: { _id: user.id },
        //     user: { _id: user.id }
        //   });
        productStoringHandlerV2.updateStockAndCreateHistory(
          {
            productStoringId: product._id,
            stock: -product.quantity,
            model_stock: { stock: -product.quantity, model_id: product.model_id },
            accompanied_stock: {
              accompanied_products: product.accompanied_products,
              action: 'add_product'
            }
          },
          {
            type: HistoryTypes.Sell,
            transactionId: order._id,
            onModel: 's_order',
            performedUser: user
          }
        );
      });
    });
    return orders;
  },
  checkStock(product) {
    if (!product.detail.is_limited_stock) return;
    if (product.quantity > product.storing.stock) {
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
  },
  async getDefaultStore({ product_id, quantity, location }) {
    const productStorings = await productStoringService.find({
      query: {
        product_id: product_id,
        is_active_product: true,
        is_active_company: true,
        is_active_store: true,
        active: true
      },
      populate: 'store'
    });
    const filterProductStoringByStock = productStorings.filter(
      (productStoring) => productStoring.stock >= quantity
    );
    filterProductStoringByStock.forEach(({ store }) => {
      const distance = getDistance(
        { lat: store.location.coordinates[1], lon: store.location.coordinates[0] },
        { lat: location[1], lon: location[0] }
      );
      store.distance = distance;
    });
    const sortByDistanceOrder = filterProductStoringByStock.sort((a, b) => {
      return a.store.distance - b.store.distance;
    });
    return sortByDistanceOrder[0] && sortByDistanceOrder[0].store;
  }
};

/**
 *
 *
 * @param {{product: SProduct, company, quantity: number}} param
 */
function validateCart({
  product,
  company,
  quantity,
  model_id,
  options = [],
  accompanied_products = []
}) {
  const total_stock = product.stock;
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

  const validModel = product.model_list.find(
    (model) => model._id.toString() === model_id.toString() && model.status === ModelStatuses.Active
  );
  if (!validModel) {
    throw new BaseError({
      statusCode: 400,
      error: errorCode.client,
      errors: {
        model: errorCode['client.invalidProductModel']
      }
    });
  }

  accompanied_products.length &&
    accompanied_products.map((ac_product) => {
      const existAccompaniedProduct = product.accompanied_products.find(
        (item) =>
          item.product_storing_id.toString() === ac_product.product_storing_id.toString() &&
          item.status === AccompaniedProductStatuses.Active
      );
      if (!existAccompaniedProduct) {
        throw new BaseError({
          statusCode: 400,
          error: errorCode.client,
          errors: {
            accompanied_product: errorCode['client.accompaniedProductNotFound']
          }
        });
      }
    });
  let optionDocs = [];
  if (options && options.length) {
    const pStoring = { ...product.toObject() };
    options.forEach((option) => {
      const productStoringOption = product.options.find(
        (item) =>
          item.option_id.toString() === option.type_option_id.toString() && item.status === 'active'
      );
      if (!productStoringOption) {
        throw new BaseError({
          statusCode: 404,
          error: errorCode.client,
          errors: {
            option: errorCode['client.sellingOptionNotFound']
          }
        });
      }
      const newOption = sellingOptionService.generate(productStoringOption.option.toObject());
      const pStoringOption = pStoring.options.find(
        (item) =>
          item.option_id.toString() === option.type_option_id.toString() && item.status === 'active'
      );
      if (!pStoringOption) {
        throw new BaseError({
          statusCode: 400,
          error: errorCode.client,
          errors: {
            selection: errorCode['client.sellingSelectionNotFound']
          }
        });
      }
      const optionItem = pStoringOption.option.options.find(
        (item) => item._id.toString() === option.option_id.toString() && item.status === 'active'
      );
      if (!optionItem) {
        throw new BaseError({
          statusCode: 400,
          error: errorCode.client,
          errors: {
            selectionOption: errorCode['client.sellingSelectionOptionNotFound']
          }
        });
      }
      optionDocs.push(newOption.getChosenItem(optionItem._id));
    });
  }
  return { standardizeOptions: optionDocs || [], validModel };
}

/**
 * Create temp `lucky cart` `without saving`
 *
 * @param {{user_id, product:SProduct, address, quantity: number }} param
 * @returns
 */
async function generateTempLuckyCart({
  user_id,
  product,
  address,
  quantity,
  model_id,
  accompanied_products = [],
  options = []
}) {
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
            quantity: quantity,
            model_id,
            accompanied_products,
            options
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
