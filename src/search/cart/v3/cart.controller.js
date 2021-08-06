/* eslint-disable prettier/prettier */
import Promise from 'bluebird';
import { configService } from '../../../commons/config';
import {
  BaseError,
  BaseResponse,
  currencyFormat,
  errorCode,
  getDate,
  splitString,
  withSession
} from '../../../commons/utils';
import addressService from '../../address/address.service';
import baseLogistics from '../../logistics/provider/base-logistics';
import { alePay, vnPay } from '../../payment-gateway';
import productStoringService from '../../product-storing/product-storing.service';
import settingService from '../../setting/setting.service';
import storeService from '../../store/store.service';
import cartService, { populateOptions } from '../cart.service';
import cartHandler from './cart.handler';
import { getDistance } from 'geolib';
import { promotionCodeServiceV2 } from '../../promotion-code/v2/promotion-code.service';
import paymentGatewayService from '../../payment-gateway/payment-gateway.service';
import { searchService } from '../../search/search.service';
import productService from '../../product/product.service';
import promotionService from '../../promotion/promotion.service';
import logisticsService from '../../logistics/logistics.service';
import globalPromotionCodeService from '../../promotion-code/v2/global-promotion-code.service';
import { omit, pick } from 'lodash';

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
          populate: [
            populateOptions.detail,
            populateOptions.storing,
            populateOptions.company,
            populateOptions.storing_detail
          ]
        });
        if (cart.orders && cart.orders.length)
          await Promise.map(cart.orders, async (order) => {
            order.transport_fee = 0;
            await order.getPriceV3({ cart: { isInCart: true } });
          });
        cart.getTotal();
        return new BaseResponse({ statusCode: 200, data: cart }).return(res);
      } catch (error) {
        next(error);
      }
    },
    async addProduct(req, res, next) {
      try {
        const {
          product_storing_id,
          company_id,
          quantity,
          model_id,
          options,
          accompanied_products,
          old_model_id
        } = req.body;
        console.log(product_storing_id,company_id)
        const cart = await cartHandler.addProduct({
          company_id,
          product_storing_id,
          user_id: req.user.id,
          quantity,
          model_id,
          options,
          accompanied_products,
          old_model_id
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
          product_storing_id: req.body.product_storing_id,
          store_id: req.body.store_id,
          model_id: req.body.model_id
        });
        return new BaseResponse({ statusCode: 200, data: cart }).return(res);
      } catch (error) {
        next(error);
      }
    },
    async getStore(req, res, next) {
      try {
        const { product_id, company_id, location, address_id, is_received_at_store } = req.query;
        let [lat, lon] = (location && splitString(location)) || [];

        let [
          address,
          product,
          productStorings,
          promotions,
          logistics,
          { discount_transport }
        ] = await Promise.all([
          addressService.findOne({ _id: address_id }),
          productService.findActive({ _id: product_id }),
          productStoringService.find({
            query: {
              product_id,
              is_active_product: true,
              is_active_company: true,
              is_active_store: true,
              active: true
            },
            populate: 'store'
          }),
          promotionService.mFind({
            product_ids: product_id,
            expire_at: { $gte: new Date() },
            start_at: { $lte: new Date() },
            status: 'active'
          }),
          logisticsService.find({ company_id, status: 'active' }),
          settingService.get(company_id)
        ]);
        if (promotions.length)
          productStorings.map((productStoring) => {
            let existPromotion = promotions.find((promo) => {
              return promo.store_id.toString() === productStoring.store_id.toString();
            });
            if (existPromotion) {
              existPromotion = omit(existPromotion.toObject(), [
                'max_product_refund',
                'max_product_price',
                'max_product_discount',
                'store_ids',
                'total_payment',
                'total_discount',
                'total_refund',
                'total_uses'
              ]);
              existPromotion.products = existPromotion.products.filter(
                (product) => product.product_id.toString() === productStoring.product_id.toString()
              );
              if (
                existPromotion.products[0].unlimited === false &&
                existPromotion.products[0].remain <= 0
              )
                existPromotion = null;
            }
            productStoring.promotion = existPromotion;
          });
        const validDiscounts = discount_transport
          .filter((discount) => discount.status === 'active')
          .sort((a, b) => b.order_value - a.order_value);
        if (!location && address) {
          lat = address && address.location.coordinates[1];
          lon = address && address.location.coordinates[0];
        }
        productStorings = productStorings
          .sort((a, b) => a.refund - b.refund)
          .filter((productStoring) => !productStoring.is_limited_stock || productStoring.stock > 0);

        let result = await Promise.map(productStorings, async (productStoring) => {
          productStoring = productStoring.toObject();
          const { store } = productStoring;
          let distance =
            lat &&
            getDistance(
              { lat: store.location.coordinates[1], lon: store.location.coordinates[0] },
              { lat, lon }
            );
          store.distance = distance;
          store.logistics_available = logistics.map((lg) =>
            pick(lg, [
              'is_default',
              'provider',
              'status',
              'display_name',
              'logo',
              'calculated_transport_fee'
            ])
          );
          if (!is_received_at_store && address && product.transportable)
            await Promise.map(store.logistics_available, async (logistics) => {
              const isFreeTransport = product.is_free_transport;
              logistics.calculated_transport_fee = await baseLogistics[
                logistics.provider
              ].getTempFee({
                product,
                store: store,
                toAddress: address
              });
              const discount = validDiscounts.find(
                (discount) => product.price >= discount.order_value
              );
              const discountValue =
                discount && discount.discount_rate * logistics.calculated_transport_fee;
              logistics.fee = isFreeTransport
                ? 0
                : discountValue
                ? logistics.calculated_transport_fee - discountValue
                : logistics.calculated_transport_fee;
            });
          return productStoring;
        });

        return new BaseResponse({ statusCode: 200, data: result })
          .addMeta({ valid_discounts: validDiscounts, address })
          .return(res);
      } catch (error) {
        next(error);
      }
    },
    async checkout(req, res, next) {
      try {
        const {
          payment_method,
          address_id,
          order: updateOrder = {},
          change_store: updateStore = {}
        } = req.body;
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
        const isValidPaymentMethod = await paymentGatewayService.isValidPaymentMethod(
          payment_method,
          'pay_cart'
        );
        if (!isValidPaymentMethod)
          throw new BaseError({
            statusCode: 400,
            error: errorCode.client,
            errors: { payment_method: errorCode['client.paymentMethodNotValid'] }
          });
        const [cart, userAddress, logistics_providers] = await Promise.all([
          cartService.findOne(
            { user_id: req.user.id, is_confirmed: false },
            {
              populate: [
                populateOptions.detail,
                populateOptions.storing,
                populateOptions.company,
                populateOptions.storing_detail
              ]
            }
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
        await changeStore({ cart, updateStore });
        await Promise.map(cart.orders, async (order) => {
          const hasProductNoTransport = order.products.some(
            (product) => !product.detail.transportable
          );
          const isChangedStore =
            !order.store_id || order.store_id.toString() === updateOrder.store_id;
          const isOffReceivedAtStore =
            isChangedStore &&
            order.is_received_at_store === true &&
            updateOrder.is_received_at_store === false;
          if (hasProductNoTransport && isChangedStore && updateOrder.is_received_at_store === false)
            throw new BaseError({
              statusCode: 403,
              error: errorCode.client,
              errors: { transportable: errorCode['client.orderCanOnlyReceivedAtStore'] }
            });

          //* Choose Store
          await chooseStore({
            order,
            updateOrder: isChangedStore ? updateOrder : {},
            location,
            hasProductNoTransport,
            cart
          });

          await updateProductStoring(order);
          if (updateOrder.note) order.note = updateOrder.note;
          // * update products

          if (
            !hasProductNoTransport &&
            (!order.logistics_available.length ||
              (isChangedStore && isChangedStore.provider) ||
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

          if ((isChangedStore && updateOrder.is_received_at_store) || hasProductNoTransport) {
            order.logistics_provider = undefined;
            order.calculated_transport_fee = 0;
          } else {
            if (isChangedStore && updateOrder.logistics_provider) {
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
          cart.is_checkouted = true;
          if (!checkCanConfirm({ order, hasProductNoTransport })) cart.is_checkouted = false;
        });

        // * call fee
        Object.assign(cart, {
          payment_method,
          checkouted_date: new Date()
        });
        cart.markModified('orders');
        await cart
          .populate([
            populateOptions.detail,
            populateOptions.company,
            populateOptions.storing_detail
          ])
          .execPopulate();
        await Promise.map(cart.orders, async (order) => {
          await order.getPriceV3({ mustGotPromotionCode: true, cart: { isInCart: true } });
        });
        cart.getTotal();
        let payment_url;
        if (cart.is_checkouted) {
          if (!['COD', 'WALLET'].includes(payment_method)) {
            const paymentGatewayConfig = await configService.get('payment_gateway');
            const paymentCase = paymentGatewayConfig.find((p) => p.name === payment_method);
            if (paymentCase.is_active && paymentCase.pay_order_online) {
            }
            if (payment_method === 'VNPAY') {
              cart.receipt_code = `pay_cart.${cart.code}.${Math.round(Math.random() * 1000)}`;
              payment_url = vnPay.createPaymentUrl({
                amount: cart.total,
                orderDescription: `Thanh toán ${currencyFormat(
                  cart.total,
                  undefined,
                  ' VND'
                )} cho đơn hàng ${cart.code}`,
                userIp: req.headers['x-forwarded-for'] || '1.1.1.2',
                code: cart.receipt_code
              });
            }
            if (payment_method === 'ALEPAY') {
              const paymentResponse = await alePay.createRequestPayment({
                orderCode: cart.code,
                amount: cart.total,
                orderDescription: `Thanh toán ${currencyFormat(
                  cart.total,
                  undefined,
                  ' VND'
                )} cho đơn hàng ${cart.code}`,
                buyerName: req.user.name,
                buyerPhone: req.user.phone,
                buyerAddress: userAddress.normalizedAddress,
                buyerCity: userAddress.province
              });
              payment_url = paymentResponse.checkoutUrl;
              cart.receipt_code = paymentResponse.token;
            }
          }
        }
        await cart.save();

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
          {
            populate: [
              populateOptions.detail,
              populateOptions.storing,
              populateOptions.company,
              populateOptions.storing_detail
            ]
          }
        );
        if (!cart)
          throw new BaseError({
            statusCode: 400,
            error: errorCode.client,
            errors: { cart: errorCode['client.cartNotExist'] }
          });

        await Promise.map(cart.orders, async (order) => {
          if (order.is_received_at_store)
            order.expected_received_date =
              order.expected_received_date < new Date()
                ? new Date(new Date().setDate(new Date().getDate() + 1))
                : order.expected_received_date;
          await order.getPriceV3({
            mustGotPromotionCode: true,
            cart: { isInCart: true }
          });
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
  let store = await storeService.findActive({
    ...(updateOrder.store_id || order.store_id
      ? { _id: updateOrder.store_id || order.store_id }
      : {}),
    company_id: order.company_id
  });
  //* must received at store
  if (hasProductNoTransport || updateOrder.is_received_at_store || order.is_received_at_store) {
    order.is_received_at_store = true;
    const now = new Date();
    order.expected_received_date =
      updateOrder.expected_received_date ||
      ((order.expected_received_date || now) <= now
        ? new Date(now.setDate(now.getDate() + 1))
        : order.expected_received_date);
  }
  order.store_id = store._id;
  order.store_address = {
    ...store.address,
    normalizedAddress: store.normalizedAddress
  };
  if (!order.is_received_at_store || updateOrder.is_received_at_store === false) {
    order.is_received_at_store = false;
    if (!store.ghn_shop_id) {
      await baseLogistics.ghn.createStore(store);
    }
    !order.logistics_info && (order.logistics_info = {});
    Object.assign(order.logistics_info, { shop_id: store.ghn_shop_id });
  }
};

const updateProductStoring = async (order) => {
  await Promise.map(order.products, async (product) => {
    const productStoring = await productStoringService.findOne({
      product_id: product.id,
      store_id: order.store_id
    });
    if (!productStoring) return;
    product._id = productStoring._id;
    product.product_storing_id = productStoring._id;
    product.storing = productStoring;
    product.store_id = productStoring.store_id;
  });
};

const changeStore = async ({ cart, updateStore }) => {
  if (!updateStore.product_storing_id) return;
  const oldOrder = cart.orders.find(
    (order) => order.store_id.toString() === updateStore.from_store_id
  );
  if (!oldOrder)
    throw new BaseError({
      statusCode: 400,
      error: errorCode.client,
      errors: {
        product: errorCode['client.productNotExistInCart']
      }
    });
  const productStoring = await productStoringService.findActiveV2({
    _id: updateStore.product_storing_id,
    populate: 'store'
  });
  const product = oldOrder.products.find(
    (product) => product._id.toString() === updateStore.product_storing_id
  );
  const isExistOrder = cart.orders.find(
    (order) => order.store_id.toString() === updateStore.to_store_id
  );
  const newProduct = JSON.parse(JSON.stringify(product));
  const promotionCode = await promotionCodeServiceV2.autoGetV2({
    company_id: product.company_id,
    store_id: updateStore.to_store_id,
    product_id: product.id,
    apply_count: product.applied_promotion_quantity,
    model_id: product.model_id
  });
  const globalPromotionCode = await globalPromotionCodeService.autoGet({
    product_storing_id: productStoring._id,
    apply_count: product.applied_promotion_quantity
  });
  newProduct.global_promotion_code = globalPromotionCode.code;
  newProduct.global_promotion_code_id = globalPromotionCode._id;
  newProduct.global_promotion_id =
    globalPromotionCode.global_promotion && globalPromotionCode.global_promotion_id;
  newProduct.promotion_code = promotionCode.code;
  newProduct.promotion_id = promotionCode.promotion && promotionCode.promotion._id;
  newProduct.promotion_code_id = promotionCode._id;
  newProduct.applied_promotion_quantity = promotionCode.apply_count || 0;
  if (isExistOrder) {
    isExistOrder.products.push(newProduct);
  } else {
    cart.orders.push({
      ...oldOrder.toObject(),
      _id: undefined,
      store_id: updateStore.to_store_id,
      store_address: {
        ...productStoring.store.address,
        normalizedAddress: productStoring.store.normalizedAddress
      },
      products: [
        {
          ...newProduct,
          product_id: product.id,
          product_storing_id: productStoring._id,
          store_id: updateStore.to_store_id
        }
      ]
    });
  }
  if (product.promotion_code_id)
    promotionCodeServiceV2.autoGetV2({
      company_id: product.company_id,
      store_id: product.store_id,
      product_id: product.id,
      apply_count: 0,
      promotion_code_id: product.promotion_code_id,
      model_id: product.model_id
    });
  product.remove();
  if (oldOrder.products.length === 0) oldOrder.remove();
};

const checkCanConfirm = ({ order, hasProductNoTransport }) => {
  const mustStock = order.products.every((product) => {
    return (
      !product.detail.is_limited_stock ||
      (product.storing && product.storing.stock >= product.quantity)
    );
  });
  const mustReceivedAtStore = hasProductNoTransport ? order.is_received_at_store : true;
  return mustStock && mustReceivedAtStore;
};

const calcFee = async (order) => {
  order.transport_fee = 0;
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

/**
 *
 *
 * @param {{
 *   address,
 *   validDiscounts,
 *   company_id,
 *   store,
 *   product,
 *   logistics
 * }} param
 */
async function getTransportFee({
  address,
  validDiscounts,
  store,
  productStoring,
  product,
  logistics
}) {
  productStoring = productStoring.toObject();
  const isFreeTransport = product.is_free_transport;
  const discount = validDiscounts.find((discount) => product.price >= discount.order_value);
  let lat = address.location.coordinates[1];
  let lon = address.location.coordinates[0];
  let distance = getDistance(
    { lat: store.location.coordinates[1], lon: store.location.coordinates[0] },
    { lat, lon }
  );
  console.log(`===>: logistics`, logistics.length);
  const transport_fees = await Promise.map(logistics, async (logistic) => {
    try {
      const original_fee = await baseLogistics[logistic.provider].getTempFee({
        toAddress: address,
        product: product,
        store: store
      });
      const discountValue = discount && discount.discount_rate * original_fee;
      const fee = isFreeTransport ? 0 : discountValue ? original_fee - discountValue : original_fee;
      return {
        provider: logistic.provider,
        calculated_transport_fee: original_fee,
        fee,
        display_name: logistic.display_name,
        logo: logistic.logo
      };
    } catch (error) {
      return {};
    }
  });
  productStoring.logistics_available = transport_fees;
  productStoring.store.distance = distance;
  return productStoring;
}
