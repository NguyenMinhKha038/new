import Promise from 'bluebird';
import {
  BaseError,
  BaseResponse,
  currencyFormat,
  errorCode,
  logger,
  getDate
} from '../../commons/utils';
import addressService from '../address/address.service';
import baseLogistics from '../logistics/provider/base-logistics';
import { vnPay } from '../payment-gateway';
import productStoringService from '../product-storing/product-storing.service';
import settingService from '../setting/setting.service';
import cartHandler from './cart.handler';
import cartService, { populateOptions } from './cart.service';
import storeService from '../store/store.service';
import { configService } from '../../commons/config';
import behaviorService from '../behavior/behavior.service';

export default {
  user: {
    async get(req, res, next) {
      try {
        const { limit, page, select, sort, ...query } = req.query;
        const [carts, count] = await Promise.all([
          cartService.find({
            user_id: req.user.id,
            limit,
            page,
            select,
            sort,
            ...query
          }),
          limit && cartService.count({ user_id: req.user.id, ...query })
        ]);
        const total_page = limit && Math.ceil(count / limit);
        return new BaseResponse({ statusCode: 200, data: carts })
          .addMeta({ total_page, total: count })
          .return(res);
      } catch (error) {
        next(error);
      }
    },
    async getActive(req, res, next) {
      try {
        const cart = await cartService.findActiveCart({
          user_id: req.user.id,
          populate: Object.values(populateOptions)
        });
        if (cart.orders && cart.orders.length)
          await Promise.map(cart.orders, async (order) => {
            order.transport_fee = 0;
            await order.getPromotionCode();
            order.getPrice();
          });
        cart.getTotal();
        return new BaseResponse({ statusCode: 200, data: cart }).return(res);
      } catch (error) {
        next(error);
      }
    },
    async addProduct(req, res, next) {
      try {
        const { product_id, company_id, quantity, has_promotion } = req.body;
        const cart = await cartHandler.addProduct({
          company_id,
          user_id: req.user.id,
          product_id,
          quantity,
          has_promotion
        });
        return new BaseResponse({ statusCode: 200, data: cart }).return(res);
      } catch (error) {
        next(error);
      }
    },
    async removeProduct(req, res, next) {
      try {
        const cart = await cartHandler.removeProduct({
          user_id: req.user.id,
          product_id: req.body.product_id,
          company_id: req.body.company_id
        });
        return new BaseResponse({ statusCode: 200, data: cart }).return(res);
      } catch (error) {
        next(error);
      }
    },
    async checkout(req, res, next) {
      try {
        const { payment_method, address_id, order: updateOrder = {} } = req.body;
        //* Validate date
        if (updateOrder.expected_received_date) {
          const nextThreeDate = new Date(+getDate() + 3 * 24 * 60 * 60 * 1000);
          if (updateOrder.expected_received_date > nextThreeDate)
            throw new BaseError({
              statusCode: 400,
              error: errorCode.validate,
              message: `expected_received_date must be less than ${nextThreeDate}`,
              errors: {
                expected_received_date: errorCode['date.less']
              }
            });
        }
        const [cart, userAddress, logistics_providers] = await Promise.all([
          cartService.findOne(
            { user_id: req.user.id, is_confirmed: false },
            { populate: Object.values(populateOptions) }
          ),
          addressService.findOne(
            { user_id: req.user.id, ...(address_id ? { _id: address_id } : {}) },
            null,
            { sort: '-is_default' }
          ),
          configService.get('logistics_providers')
        ]);
        if (!cart)
          throw new BaseError({
            statusCode: 400,
            error: errorCode.client,
            errors: { cart: errorCode['client.cartNotExist'] }
          });
        if (!cart.orders || !cart.orders.length)
          throw new BaseError({
            statusCode: 400,
            error: errorCode.client,
            errors: {
              cart: errorCode['client.cartIsEmpty']
            }
          });
        if (!userAddress)
          throw new BaseError({
            statusCode: 403,
            error: errorCode.client,
            errors: { address: errorCode['client.addressNotFound'] }
          });
        // * required to checkout after an hour.
        if (new Date() - cart.checkouted_date > 60 * 60 * 1000) cart.is_checkouted = false;
        const location = userAddress.location.coordinates;
        cart.delivery_address = userAddress
          ? { ...userAddress.toObject(), address_id: userAddress._id }
          : cart.delivery_address;
        // * Get Logistics
        await Promise.map(cart.orders, async (order) => {
          const hasProductNoTransport = order.products.some(
            (product) => !product.detail.transportable
          );
          const isChangedCompany = order.company_id.toString() === updateOrder.company_id;
          const isOffReceivedAtStore =
            isChangedCompany &&
            order.is_received_at_store === true &&
            updateOrder.is_received_at_store === false;
          if (hasProductNoTransport && isChangedCompany && !updateOrder.is_received_at_store)
            throw new BaseError({
              statusCode: 403,
              error: errorCode.client,
              errors: { transportable: errorCode['client.orderCanOnlyReceivedAtStore'] }
            });

          //* Choose Store
          await chooseStore({
            order,
            updateOrder: isChangedCompany ? updateOrder : {},
            location,
            hasProductNoTransport
          });

          if (updateOrder.note) order.note = updateOrder.note;
          // * update products
          await updateProductStoring(order);

          if (
            !hasProductNoTransport &&
            (!order.logistics_available.length ||
              (isChangedCompany && isChangedCompany.provider) ||
              address_id ||
              !cart.is_checkouted ||
              isOffReceivedAtStore)
          ) {
            order.logistics_available = logistics_providers;
            await Promise.map(order.logistics_available, async (logistics) => {
              logistics.calculated_transport_fee = await baseLogistics[logistics.provider].getFee({
                order,
                fromAddress: order.store_address,
                toAddress: cart.delivery_address
              });
            });
          }

          if ((isChangedCompany && updateOrder.is_received_at_store) || hasProductNoTransport) {
            order.logistics_provider = undefined;
            order.calculated_transport_fee = 0;
          } else {
            if (isChangedCompany && updateOrder.logistics_provider) {
              const logistics =
                order.logistics_available.find(
                  (p) => p.provider === updateOrder.logistics_provider
                ) || order.logistics_available[0];
              order.logistics_provider = logistics.provider;
              order.logistics_display_name = logistics.display_name;
              order.calculated_transport_fee = logistics.calculated_transport_fee;
            } else {
              const logistics =
                order.logistics_available.find((p) => p.provider === order.logistics_provider) ||
                order.logistics_available[0];
              order.logistics_provider = logistics.provider;
              order.logistics_display_name = logistics.display_name;
              order.calculated_transport_fee = logistics.calculated_transport_fee;
            }
          }
          // * Calc Fee
          await calcFee(order);
        });

        // * call fee
        Object.assign(cart, {
          payment_method,
          is_checkouted: userAddress ? true : false,
          checkouted_date: new Date()
        });
        cart.markModified('orders');
        await cart.save();
        await Promise.map(cart.orders, async (order) => {
          await order.getPromotionCode();
          order.getPrice();
        });
        cart.getTotal();
        cart;
        let payment_url;
        if (payment_method === 'VNPAY') {
          cart.receipt_code = `pay_cart.${cart.code}.${Math.round(Math.random() * 1000)}`;
          payment_url = vnPay.createPaymentUrl({
            amount: cart.total,
            orderDescription: `thanh toan ${currencyFormat(
              cart.total,
              undefined,
              ' VND'
            )} cho don hang ${cart.code}`,
            userIp: req.headers['x-forwarded-for'] || '1.1.1.2',
            code: cart.receipt_code
          });
        }

        return new BaseResponse({ statusCode: 200, data: cart })
          .addMeta({ payment_url, logistics_providers })
          .return(res);
      } catch (error) {
        next(error);
      }
    },
    async confirm(req, res, next) {
      try {
        const cart = await cartService.findOne(
          {
            user_id: req.user.id,
            is_checkouted: true,
            is_confirmed: false
          },
          { populate: Object.values(populateOptions) }
        );
        if (!cart)
          throw new BaseError({
            statusCode: 400,
            error: errorCode.client,
            errors: { cart: errorCode['client.cartNotExist'] }
          });

        await Promise.map(cart.orders, async (order) => {
          await order.getPromotionCode();
          order.getPrice();
          order.products.forEach((product) => {
            cartHandler.checkStock(product);
          });
        });
        cart.getTotal();
        if (cart.payment_method === 'VNPAY')
          return new BaseResponse({
            statusCode: 200,
            data: cart
          }).return(res);
        if (cart.payment_method === 'WALLET' && cart.total > req.user.wallet.total)
          throw new BaseError({
            statusCode: 403,
            error: errorCode.client,
            errors: { money: errorCode['client.MoneyNotEnough'] }
          });
        if (!cart.is_checkouted)
          throw new BaseError({
            statusCode: 400,
            error: errorCode.client,
            errors: { cart: errorCode['client.cartNotCheckouted'] }
          });
        const orders = await cartHandler.handleConfirm({ cart, user: req.user });

        return new BaseResponse({ statusCode: 200, data: cart }).addMeta({ orders }).return(res);
      } catch (error) {
        next(error);
      }
    },
    async confirmLuckyCart(req, res, next) {
      try {
        const { product_id, company_id, address_id, quantity } = req.body;
        let cart;
        // * Is Lucky
        if (product_id) {
          cart = await cartHandler.checkingLucky({
            product_id,
            address_id,
            company_id,
            quantity: 1,
            user_id: req.user.id
          });
        }
        if (cart.payment_method === 'WALLET' && cart.total > req.user.wallet.total)
          throw new BaseError({
            statusCode: 403,
            error: errorCode.client,
            errors: { money: errorCode['client.MoneyNotEnough'] }
          });
        if (!cart.is_checkouted)
          throw new BaseError({
            statusCode: 400,
            error: errorCode.client,
            errors: { cart: errorCode['client.cartNotCheckouted'] }
          });
        const orders = await cartHandler.handleConfirm({ cart, user: req.user });
        return new BaseResponse({ statusCode: 200, data: cart }).addMeta({ orders }).return(res);
      } catch (error) {
        next(error);
      }
    }
  }
};

const chooseStore = async ({ order, updateOrder, location, hasProductNoTransport }) => {
  let store;
  if ((hasProductNoTransport && !order.is_received_at_store) || updateOrder.is_received_at_store) {
    store = await storeService.findActive({
      ...(updateOrder.store_id ? { _id: updateOrder.store_id } : {}),
      company_id: order.company_id
    });
    order.is_received_at_store = true;
    order.expected_received_date =
      updateOrder.expected_received_date || new Date(new Date().setDate(new Date().getDate() + 1));
    order.logistics_provider = undefined;
    if (!store.ghn_shop_id) {
      await baseLogistics.ghn.createStore(store);
    }
    !order.logistics_info && (order.logistics_info = {});
    Object.assign(order.logistics_info, { shop_id: store.ghn_shop_id });
    order.store_id = store._id;
    order.store_address = {
      name: store.name,
      ...store.address,
      normalizedAddress: store.normalizedAddress
    };
  }
  // * get nearest store when not received at store
  if (
    order.is_received_at_store === undefined ||
    (updateOrder.company_id && !updateOrder.is_received_at_store)
  ) {
    store = await storeService.getNearestStore({
      company_id: order.company_id,
      location
    });
    if (!store.ghn_shop_id) {
      await baseLogistics.ghn.createStore(store);
    }
    !order.logistics_info && (order.logistics_info = {});
    Object.assign(order.logistics_info, { shop_id: store.ghn_shop_id });
    order.is_received_at_store = false;
    order.store_id = store._id;
    order.store_address = {
      name: store.name,
      ...store.address,
      normalizedAddress: store.normalizedAddress
    };
  }
};

const updateProductStoring = async (order) => {
  await Promise.map(order.products, async (product) => {
    const productStoring = await productStoringService.findActive({
      product_id: product.id,
      store_id: order.store_id
    });
    product._id = productStoring._id;
    product.storing = productStoring;
    product.store_id = productStoring.store_id;
    cartHandler.checkStock(product);
  });
};

const calcFee = async (order) => {
  order.transport_fee = 0;
  order.getPrice();
  /** Check Free Transport **/
  const hasProductFreeTransport = order.products.some(
    (product) => product.detail.is_free_transport
  );
  if (order.is_received_at_store) {
    order.transport_fee = 0;
    return;
  }
  if (hasProductFreeTransport) {
    order.is_discount_transport = true;
    order.transport_fee = 0;
    return;
  }
  const { discount_transport } = await settingService.get(order.company_id);
  const validDiscounts = discount_transport
    .filter((discount) => discount.status === 'active')
    .sort((a, b) => b.order_value - a.order_value);
  const discount = validDiscounts.find((discount) => order.total >= discount.order_value);
  if (!discount) {
    order.transport_fee = order.calculated_transport_fee;
    order.is_discount_transport = false;
    return;
  }
  const discountValue = discount.discount_rate * order.calculated_transport_fee;
  order.transport_fee = order.calculated_transport_fee - discountValue;
  order.is_discount_transport = true;
};
