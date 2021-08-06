import Promise from 'bluebird';
import _ from 'lodash';
import mongoose from 'mongoose';
import configService from '../../commons/config/config.service';
import { userService } from '../../commons/user';
import userModel from '../../commons/user/user.model';
import {
  BaseError,
  BaseResponse,
  currencyFormat,
  errorCode,
  getDate,
  mergeObject,
  logger,
  splitString,
  transactionHelper,
  withSafety,
  selectToPopulate
} from '../../commons/utils';
import companyHistoryService from '../company-history/company-history.service';
import companyService from '../company/company.service';
import baseLogistics from '../logistics/provider/base-logistics';
import menuService from '../menu/menu.service';
import notificationService from '../notification/notification.service';
import paymentCodeService from '../payment_code/payment-code.service';
import productStoringService from '../product-storing/product-storing.service';
import promotionCodeService from '../promotion-code/promotion-code.service';
import promotionService from '../promotion/promotion.service';
import settingService from '../setting/setting.service';
import storeService from '../store/store.service';
import orderHandler from './order.handler';
import orderService from './order.service';
import orderCachingService from '../order-caching/order-caching.service';
import orderFirestoreService from './order-firestore.service';
import orderCachingFirestoreService from '../order-caching/order-caching-firestore.service';
import orderModel from './order.model';
import productStoringHandler from '../product-storing/product-storing.handler';
import { OrderFinalStatuses, OrderStatus, DefaultLimit, PopulatedFields } from './order.config';
import adminActivityService from '../../commons/admin-activity/admin-activity.service';
import { promotionCodeServiceV2 } from '../promotion-code/v2/promotion-code.service';
import companyActivityService from '../company-activity/company-activity.service';
import { CompanyActions } from '../company-activity/company-activity.config';
import buyerModel from '../buyer/buyer.model';

export default {
  user: {
    async getUnconfirmed(req, res, next) {
      try {
        const { id: user_id } = req.user;
        const {
          limit = DefaultLimit,
          select,
          sort,
          page,
          populate: rawPopulate,
          store_id
        } = req.query;
        // Handle populate if any
        let populate = undefined;
        if (rawPopulate) {
          const arr = rawPopulate
            .split(' ')
            .filter((field) => Object.keys(PopulatedFields).includes(field));
          arr.length && (populate = arr.map((field) => PopulatedFields[field]));
        }

        // Build query
        const query = {
          store_id,
          user_id,
          expiresAt: { $gte: new Date() }
        };
        const [orders, count] = await Promise.all([
          orderCachingService.find({ limit, page, select, sort, populate, ...query }),
          orderCachingService.count(query)
        ]);

        const total_page = Math.ceil(count / limit);

        return new BaseResponse({ statusCode: 200, data: orders })
          .addMeta({ total_page })
          .return(res);
      } catch (err) {
        next(err);
      }
    },
    async pay(req, res, next) {
      try {
        const { code } = req.params;
        const { ref_id, _id: user_id } = req.user;
        const { payment_method = 'WALLET' } = req.body;
        const order = await orderService.findByCode({
          code,
          type: 'offline',
          status: { $nin: OrderFinalStatuses },
          is_paid: { $ne: true }
        });
        if (payment_method === 'WALLET') {
          ///? check wallet
          if (req.user.wallet.total < order.total)
            throw new BaseError({
              statusCode: 400,
              error: errorCode.client,
              errors: {
                money: errorCode['client.MoneyNotEnough']
              }
            });
          //* update order
          const updates = {
            is_paid: true,
            user_id: req.user.id,
            payment_method: 'WALLET',
            status: 'completed'
          };

          await transactionHelper.withSession(async (session) => {
            await orderHandler.handleComplete(
              {
                order,
                user: req.user,
                pay_required: true,
                pay_by_s_prepaid: true,
                updates
              },
              { session }
            );
          });

          Object.assign(order, updates);
          // * send notification when pay order successfully
          const appCurrency = process.env.APP_CURRENCY;
          storeService.findOne({ _id: order.store_id }, 'name').then((store) =>
            notificationService.createAndSend({
              user_id: order.user_id,
              type: 'user_pay_order_success',
              title: 'Thanh toán thành công',
              object_id: order._id,
              message: `Bạn đã thanh toán ${currencyFormat(
                order.total,
                'vi-VN',
                appCurrency
              )} thành công cho đơn hàng ${order.code} tại cửa hàng ${store.name}`,
              onModel: 's_order'
            })
          );

          // Notify new order to staff of store
          notificationService.getStaffAndSend({
            company_id: order.company_id,
            object_id: order._id,
            onModel: 's_order',
            staff_type: 'seller',
            store_id: order.store_id,
            type: 'company_user_pay_order',
            title: 'Đã được thanh toán thành công',
            message: `Đơn hàng ${order.code} đã được thanh toán với ${currencyFormat(
              order.total,
              'vi-VN',
              appCurrency
            )}`
          });
        }
        if (payment_method === 'CASH') {
          order.user_id = req.user.id;
          order.payment_method = 'CASH';
        }
        if (payment_method === 'VNPAY') {
          // handle for payment by VNPAY...
          // order.user_id = req.user.id;
          // order.payment_method = 'VNPAY';
          // order.is_paid = true;
        }

        orderFirestoreService.update(order.code, {
          user_id: req.user.id,
          user_avatar: req.user.avatar,
          user_name: req.user.name,
          user_phone_number: req.user.phone,
          status: order.status
        });
        await order.save();
        return new BaseResponse({ statusCode: 200, data: order }).return(res);
      } catch (error) {
        next(error);
      }
    },
    async confirm(req, res, next) {
      try {
        const { code } = req.params;
        let { note = '' } = req.body;
        const { id: user_id, name: user_name } = req.user;
        const [cachedOrder, order] = await Promise.all([
          orderCachingService.findByCode({
            code,
            user_id,
            expiresAt: { $gt: new Date() },
            is_confirmed: false
          }),
          orderService.findOne({ code, user_id })
        ]);

        /**
         * PHASE 1: Check exceptions
         */
        // Check if order is confirmed
        if (order) {
          throw new BaseError({
            statusCode: 403,
            error: errorCode.client,
            errors: { order: errorCode['client.orderIsConfirmed'] }
          });
        }
        // Check if order's type is not offline
        if (cachedOrder.type !== 'offline') {
          throw new BaseError({
            statusCode: 403,
            error: errorCode.client,
            errors: { order: errorCode['client.orderMustBeOffline'] }
          });
        }
        // Check if payment type is not postpaid
        if (cachedOrder.payment_type !== 'postpaid') {
          throw new BaseError({
            statusCode: 403,
            error: errorCode.client,
            errors: { order: errorCode['any.invalid'] }
          });
        }

        /**
         * PHASE 2: Save order from cached order
         */
        const orderData = {
          ..._.omit(cachedOrder.toObject(), ['_id', 'id', 'expiresAt', 'is_confirmed']),
          user_id
        };
        if (note) {
          orderData.note = orderData.note ? orderData.note + '\n' + note : note;
        }

        let savedOrder = null;
        await transactionHelper.withSession(async (session) => {
          [savedOrder] = await Promise.all([
            orderService.createOffline(orderData, { session }),
            orderCachingService.update(
              { _id: cachedOrder._id },
              { is_confirmed: true },
              { session }
            )
          ]);
        });

        /**
         * PHASE 3: Handle notification
         */
        // Notify new order to staff of store
        notificationService.getStaffAndSend({
          company_id: savedOrder.company_id,
          object_id: savedOrder._id,
          onModel: 's_order',
          staff_type: 'seller',
          store_id: savedOrder.store_id,
          type: 'company_new_order',
          title: 'Đơn hàng mới',
          message: `${user_name} đã đặt đơn hàng ${savedOrder.code} trên cửa hàng của bạn`
        });

        return new BaseResponse({ statusCode: 200, data: savedOrder }).return(res);
      } catch (err) {
        next(err);
      }
    },
    async confirmAndPay(req, res, next) {
      try {
        const appCurrency = process.env.APP_CURRENCY;
        const { code } = req.params;
        const { id: user_id, wallet: user_wallet } = req.user;
        const { payment_method = 'CASH', note = '' } = req.body;
        const [cachedOrder, order] = await Promise.all([
          orderCachingService.findByCode({
            code,
            user_id,
            expiresAt: { $gt: new Date() },
            is_confirmed: false,
            populate: { path: 'store', select: 'name' }
          }),
          orderService.findOne({ code, user_id })
        ]);
        /**
         * PHASE 1: Check exceptions
         */
        // Check if order is confirmed
        if (order) {
          throw new BaseError({
            statusCode: 403,
            error: errorCode.client,
            errors: { order: errorCode['client.orderIsConfirmed'] }
          });
        }
        // Check if order's type is not offline
        if (cachedOrder.type !== 'offline') {
          throw new BaseError({
            statusCode: 403,
            error: errorCode.client,
            errors: { order: errorCode['client.client.orderMustBeOffline'] }
          });
        }
        // Check if payment type is not prepaid
        if (cachedOrder.payment_type !== 'prepaid') {
          throw new BaseError({
            statusCode: 403,
            error: errorCode.client,
            errors: { order: errorCode['any.invalid'] }
          });
        }
        // If payment_method is WALLET, check user's wallet
        if (payment_method === 'WALLET' && user_wallet.total < cachedOrder.total) {
          throw new BaseError({
            statusCode: 400,
            error: errorCode.client,
            errors: {
              money: errorCode['client.MoneyNotEnough']
            }
          });
        }

        /**
         * PHASE 2: Handle prepaid process
         */
        let handledOrder = null;
        await transactionHelper.withSession(async (session) => {
          [{ order: handledOrder }] = await Promise.all([
            orderHandler.handlePrePay(
              {
                cached_order: cachedOrder,
                user: req.user,
                updates: {
                  payment_method,
                  user_id,
                  note,
                  ...(payment_method === 'WALLET' ? { is_paid: true } : {})
                }
              },
              { session }
            ),
            orderCachingService.update(
              { _id: cachedOrder._id },
              { is_confirmed: true },
              { session }
            )
          ]);
        });

        /**
         * PHASE 3: Handle notifications
         */
        if (payment_method === 'WALLET') {
          // Notify successfull payment to user
          notificationService.createAndSend({
            user_id,
            type: 'user_pay_order_success',
            title: 'Thanh toán thành công',
            object_id: handledOrder._id,
            message: `Bạn đã thanh toán ${currencyFormat(
              handledOrder.total,
              'vi-VN',
              appCurrency
            )} thành công cho đơn hàng ${handledOrder.code} tại cửa hàng ${cachedOrder.store.name}`,
            onModel: 's_order'
          });

          // Notify order is paid to staff of store
          notificationService.getStaffAndSend({
            company_id: handledOrder.company_id,
            object_id: handledOrder._id,
            onModel: 's_order',
            staff_type: 'seller',
            store_id: handledOrder.store_id,
            type: 'company_user_pay_order',
            title: 'Đã được thanh toán thành công',
            message: `Đơn hàng ${
              handledOrder.code
            } đã được thanh toán thành công với ${currencyFormat(
              handledOrder.total,
              'vi-VN',
              appCurrency
            )}`
          });
        }
        if (payment_method === 'CASH') {
          // Notify new order to staff of store
          notificationService.getStaffAndSend({
            company_id: handledOrder.company_id,
            object_id: handledOrder._id,
            onModel: 's_order',
            staff_type: 'seller',
            store_id: handledOrder.store_id,
            type: 'company_new_order',
            title: 'Đơn hàng mới',
            message: `${req.user.name} đã đặt đơn hàng ${handledOrder.code} trên cửa hàng của bạn`
          });
        }
        if (payment_method === 'VNPAY') {
          // comming soon... =))
        }

        return new BaseResponse({ statusCode: 200, data: handledOrder }).return(res);
      } catch (err) {
        next(err);
      }
    },
    async get(req, res, next) {
      try {
        const { limit, page, select, sort, status, populate: populatedStr, ...query } = req.query;
        const { populate } = selectToPopulate(populatedStr, PopulatedFields);
        const [orders, count] = await Promise.all([
          orderService.find({
            ...query,
            user_id: req.user.id,
            status,
            limit,
            page,
            select,
            sort,
            populate
          }),
          limit && orderService.count({ ...query, user_id: req.user.id, status })
        ]);
        const total_page = limit && Math.ceil(count / limit);
        return new BaseResponse({ statusCode: 200, data: orders })
          .addMeta({ total_page, total: count })
          .return(res);
      } catch (error) {
        next(error);
      }
    },
    async getByCode(req, res, next) {
      try {
        const { code } = req.params;
        const { populate: populatedStr } = req.query;
        const { populate } = selectToPopulate(populatedStr, PopulatedFields);
        const order = await orderService.findByCode({ code, populate });
        return new BaseResponse({ statusCode: 200, data: order }).return(res);
      } catch (error) {
        next(error);
      }
    },
    async post(req, res, next) {
      try {
        const { products, store_id, company_id, position, note } = req.body;
        const user = req.user;

        const [productList, menu, store, companySetting] = await Promise.all([
          Promise.map(products, async (product) => {
            const productStoring = await productStoringService.findActive({
              _id: product.product_storing_id,
              store_id,
              populate: 'product'
            });
            if (productStoring.is_limited_stock && productStoring.stock - product.quantity < 0) {
              throw new BaseError({
                statusCode: 400,
                error: errorCode.client,
                errors: {
                  stock: errorCode['client.outOfStock']
                }
              });
            }
            return {
              ...product,
              ...productStoring.toObject(),
              id: productStoring.product_id,
              _id: productStoring._id
            };
          }),
          menuService.findOne({ store_id, company_id }),
          storeService.findOne({ _id: store_id }, 'user_id'),
          settingService.get(company_id)
        ]);
        if (!menu || !menu.products.length) {
          throw new BaseError({
            statusCode: 400,
            error: errorCode.client,
            errors: { menu: errorCode['client.menuIsEmpty'] }
          });
        }
        products.forEach((product) => {
          const isExist = menu.products.find(
            (menuProduct) =>
              menuProduct.product_storing_id.toString() === product.product_storing_id
          );
          if (!isExist)
            throw new BaseError({
              statusCode: 400,
              error: errorCode.client,
              errors: { product: errorCode['client.productNotExist'] }
            });
        });

        // Set paymentType is postpaid as default if companySetting is undefined
        const paymentType = (companySetting && companySetting.payment_type) || 'postpaid';
        const cachedOrder = await orderCachingService.createOffline({
          products: productList,
          user_id: user._id,
          seller_id: store.user_id,
          store_id,
          company_id,
          type: 'offline',
          payment_type: paymentType,
          is_created_from_menu: true,
          position,
          note,
          progress_status: 'pending'
        });

        orderCachingFirestoreService.create(cachedOrder.code, {
          id: cachedOrder.id,
          status: cachedOrder.status,
          total: cachedOrder.total,
          user_avatar: user.avatar,
          user_id: user.id,
          user_name: user.name,
          user_phone_number: user.phone
        });

        return new BaseResponse({ statusCode: 201, data: cachedOrder }).return(res);
      } catch (error) {
        next(error);
      }
    },
    async put(req, res, next) {
      try {
        const { status, reason_canceled, reason_rejected } = req.body;
        const order = await orderService.findByCode({
          code: req.params.code,
          user_id: req.user.id
        });
        const [countOrderPerDay, config] = await Promise.all([
          orderService.count({
            user_id: req.user.id,
            updatedAt: {
              $gte: getDate(new Date()),
              $lt: getDate(new Date(new Date().setDate(new Date().getDate() + 1)))
            },
            status: 'user_canceled',
            is_paid: order.is_paid
          }),
          configService.get('maximum_canceled_order')
        ]);
        if (countOrderPerDay >= config[order.is_paid ? 'paid_oder' : 'unpaid_oder'])
          throw new BaseError({
            statusCode: 400,
            error: errorCode.client,
            errors: {
              limit_cancel: errorCode['client.orderCanNotCancelByLimit']
            }
          });
        if (order.status !== 'handling')
          throw new BaseError({
            statusCode: 400,
            errors: {
              order_status: errorCode['client.orderCanNotCancelByStatus']
            }
          });
        mergeObject(order, { status, reason_canceled, reason_rejected });
        // * user canceling
        //* must return refund and commission
        await transactionHelper.withSession(async (session) => {
          await orderHandler.handleCancel(
            {
              order: order,
              user: req.user,
              updates: { status, reason_canceled, reason_rejected }
            },
            { session }
          );
        });
        // * send notification when cancel order successfully
        notificationService.createAndSend({
          user_id: order.user_id,
          type: 'user_cancel_order_success',
          title: 'Hủy đơn hàng thành công',
          object_id: order._id,
          message: `Bạn đã hủy đơn hàng ${order.code} thành công`,
          onModel: 's_order'
        });
        // TODO: notify company user create order

        // await order.save();
        return new BaseResponse({ statusCode: 200, data: order }).return(res);
      } catch (error) {
        next(error);
      }
    },
    async confirmReceived(req, res, next) {
      try {
        const { code } = req.params;
        const order = await orderService.findByCode({ code, user_id: req.user.id });
        if (order.is_received_by_user)
          throw new BaseError({
            statusCode: 403,
            error: errorCode.client,
            errors: { status: errorCode['client.orderIsReceived'] }
          });
        if (!['delivering', 'delivered'].includes(order.status))
          throw new BaseError({
            statusCode: 403,
            error: errorCode.client,
            errors: { status: errorCode['client.orderStatused'] }
          });
        order.is_received_by_user = true;
        await order.save();
        return new BaseResponse({ statusCode: 200, data: order }).return(res);
      } catch (error) {
        next(error);
      }
    },
    async countStatus(req, res, next) {
      try {
        const { statuses } = req.query;
        const { user } = req;
        const statusList = splitString(statuses);
        const isValidStatus = statusList.every((status) => OrderStatus[status]);
        if (!isValidStatus)
          throw new BaseError({
            statusCode: 400,
            error: errorCode.client,
            errors: { status: errorCode['any.invalid'] }
          });
        const data = {};
        await Promise.map(statusList, async (status, i) => {
          if (statusList.indexOf(status) !== i) return;
          const total = await orderService.count({ user_id: user._id, status });
          data[status] = total;
        });
        return new BaseResponse({ statusCode: 200, data: data }).return(res);
      } catch (error) {
        next(error);
      }
    }
  },
  company: {
    async confirm(req, res, next) {
      try {
        const { code, note } = req.body;
        const { id: company_id } = req.company;
        /** @type {SOrder}*/
        let order;
        await transactionHelper.withSession(async (session) => {
          order = await orderService.findOne({ code, company_id }, null, { session });
          if (!order)
            throw new BaseError({
              statusCode: 404,
              error: errorCode.client,
              errors: { order: errorCode['client.orderNotExist'] }
            });
          if (order.is_confirmed)
            throw new BaseError({
              statusCode: 403,
              error: errorCode.client,
              errors: {
                order: errorCode['client.orderIsConfirmed']
              }
            });
          // * Receive at Store
          if (order.is_received_at_store) {
            order.is_confirmed = true;
            order.progress_status = 'handling';
            const _company = await companyService.updateWallet(
              { _id: order.company_id },
              {
                refund_fund: order.total_refund,
                wallet: -order.total_refund
              }
            )(session);

            await Promise.all([
              companyHistoryService.create(
                {
                  user_id: req.user.id,
                  company_id: order.company_id,
                  transaction_id: order._id,
                  type: companyHistoryService.type.refund_order,
                  new_balance: _company.wallet,
                  value: -order.total_refund
                },
                { session }
              ),
              order.save()
            ]);
            orderFirestoreService.create(order.code, {
              id: order.id,
              status: order.status,
              total: order.total,
              user_id: order.user_id.toString()
            });
            notificationService.createAndSend({
              user_id: order.user_id,
              message: `Đơn hàng ${order.code} đã được cửa hàng xác nhận, cửa hàng sẽ chuẩn bị đơn hàng cho bạn.`,
              object_id: order.id,
              onModel: 's_order',
              title: 'Đơn hàng được xác nhận',
              type: 'user_confirmed_order'
            });
            withSafety(() => {
              companyActivityService.implicitCreate(CompanyActions.confirmOrder)(req, {
                object_id: order.id
              });
            });
            return new BaseResponse({ statusCode: 200, data: order }).return(res);
          }
          // * Shipping order
          // * create orders
          if (!req.company.online_sales)
            throw new BaseError({
              statusCode: 400,
              error: errorCode.client,
              errors: { transportable: errorCode['client.logisticsIsUnavailable'] }
            });
          await baseLogistics[order.logistics_provider].confirmOrder({
            user_address: order.delivery_address,
            order,
            note
          });
          order.is_confirmed = true;
          order.status = 'picking';
          const _company = await companyService.updateWallet(
            { _id: order.company_id },
            {
              refund_fund: order.total_refund,
              wallet: -order.total_refund
            }
          )(session);

          await Promise.all([
            companyHistoryService.create(
              {
                user_id: req.user.id,
                company_id: order.company_id,
                transaction_id: order._id,
                type: companyHistoryService.type.refund_order,
                new_balance: _company.wallet,
                value: -order.total_refund
              },
              { session }
            ),
            order.save()
          ]);

          notificationService.createAndSend({
            user_id: order.user_id,
            message: `Đơn hàng ${order.code} đã sẳn sàng giao đến bạn`,
            object_id: order.id,
            onModel: 's_order',
            title: 'Đơn hàng được xác nhận',
            type: 'user_confirmed_order'
          });
          withSafety(() => {
            companyActivityService.implicitCreate(CompanyActions.confirmOrder)(req, {
              object_id: order.id
            });
          });
          return new BaseResponse({ statusCode: 200, data: order }).return(res);
        });
      } catch (error) {
        next(error);
      }
    },
    async confirmOffline(req, res, next) {
      try {
        const { code } = req.body;
        const { id: company_id, store_id } = req.company;

        let order = await orderService.findOne(
          {
            code,
            company_id,
            ...(store_id ? { store_id } : {})
          },
          null,
          {
            populate: [{ path: 'store', select: 'name' }, { path: 'user' }]
          }
        );

        /**
         * PHASE 1: Check exceptions
         */
        // Check if order not exist
        if (!order) {
          throw new BaseError({
            statusCode: 404,
            error: errorCode.client,
            errors: { order: errorCode['client.orderNotExist'] }
          });
        }
        const user = order.user;
        const { name: store_name } = order.store;
        const {
          id: user_id,
          name: user_name,
          phone: user_phone_number,
          avatar: user_avatar
        } = user;
        // Set paymentType is postpaid as default if order.payment_type is undefined
        const paymentType = order.payment_type || 'postpaid';

        // Check if type is not offline
        if (order.type !== 'offline') {
          throw new BaseError({
            statusCode: 403,
            error: errorCode.client,
            errors: { order: errorCode['client.client.orderMustBeOffline'] }
          });
        }
        // Check if order is confirmed
        if (order.is_confirmed) {
          throw new BaseError({
            statusCode: 403,
            error: errorCode.client,
            errors: {
              order: errorCode['client.orderIsConfirmed']
            }
          });
        }
        // Check if order's status is not handling
        if (order.status !== 'handling') {
          throw new BaseError({
            statusCode: 400,
            error: errorCode.client,
            errors: { oder: errorCode['client.orderStatused'] }
          });
        }

        /**
         * PHASE 2: Handle company confirm
         */
        const paymentMethod = order.payment_method || 'CASH';
        await transactionHelper.withSession(async (session) => {
          const { order: _order } = await orderHandler.handleCompanyConfirm(
            {
              order,
              user,
              performed_by: req.user,
              updates: {
                progress_status: 'handling',
                is_confirmed: true,
                payment_method: paymentMethod,
                is_paid: paymentType === 'prepaid'
              }
            },
            { session }
          );
          order = _order;
        });

        /**
         * PHASE 3: Handle notifications
         */
        // Case: payment type is prepaid
        if (paymentType === 'prepaid') {
          const appCurrency = process.env.APP_CURRENCY;
          // For payment_method !== 'WALLET'
          if (!order.payment_method || order.payment_method !== 'WALLET') {
            notificationService.createAndSend({
              user_id,
              type: 'user_pay_order_success',
              title: 'Thanh toán thành công',
              object_id: order._id,
              message: `Bạn đã thanh toán ${currencyFormat(
                order.total,
                'vi-VN',
                appCurrency
              )} thành công cho đơn hàng ${
                order.code
              } tại cửa hàng ${store_name}, cửa hàng đang xử lý đơn hàng của bạn.`,
              onModel: 's_order'
            });
          } else {
            // For payment_method === WALLET
            notificationService.createAndSend({
              user_id,
              message: `Đơn hàng ${order.code} đã được cửa hàng xác nhận, cửa hàng đang xử lý đơn hàng của bạn.`,
              object_id: order.id,
              onModel: 's_order',
              title: 'Đơn hàng được xác nhận',
              type: 'user_confirmed_order'
            });
          }
        } else {
          // Case: payment type is postpaid
          // Notify to client
          notificationService.createAndSend({
            user_id,
            message: `Đơn hàng ${order.code} đã được cửa hàng xác nhận, cửa hàng đang xử lý đơn hàng của bạn.`,
            object_id: order.id,
            onModel: 's_order',
            title: 'Đơn hàng được xác nhận',
            type: 'company_confirmed_order'
          });
        }

        /**
         * EXTRA
         */
        await orderFirestoreService.create(order.code, {
          id: order.id,
          status: order.status,
          total: order.total,
          user_avatar,
          user_id,
          user_name,
          user_phone_number
        });
        withSafety(() => {
          companyActivityService.implicitCreate(CompanyActions.confirmOrder)(req, {
            object_id: order.id
          });
        });
        return new BaseResponse({ statusCode: 200, data: order }).return(res);
      } catch (err) {
        next(err);
      }
    },
    async updateOfflineOrderStatus(req, res, next) {
      try {
        const { code: order_code } = req.params;
        const { value: status, reason_canceled, reason_rejected } = req.body;
        const { id: company_id } = req.company;

        /**
         * PHASE 1: Check exceptions
         */
        // Check if order not exist
        let order = await orderService.findByCode({
          code: order_code,
          company_id,
          populate: [{ path: 'store', select: 'name' }, { path: 'user' }]
        });
        if (!order) {
          throw new BaseError({
            statusCode: 404,
            error: errorCode.client,
            errors: { order: errorCode['client.orderNotExist'] }
          });
        }
        const user = order.user;
        const { name: store_name } = order.store;
        const { _id: user_id } = user;
        const currentStatus = order.status;
        const currentPStatus = order.progress_status;
        const paymentType = order.payment_type;
        const paymentMethod = order.payment_method;
        // Check if order's status is in final statuses
        if (OrderFinalStatuses.includes(order.status)) {
          throw new BaseError({
            statusCode: 400,
            error: errorCode.client,
            errors: {
              status: errorCode['client.orderStatused']
            }
          });
        }
        // Check if order's type is not offline
        if (order.type !== 'offline') {
          throw new BaseError({
            statusCode: 400,
            error: errorCode.client,
            errors: {
              type: errorCode['client.orderMustBeOffline']
            }
          });
        }
        // Check if company can cancel order
        if (
          ['company_canceled', 'user_rejected'].includes(status) &&
          (!order.can_canceled_by_company || !order.is_confirmed)
        ) {
          throw new BaseError({
            statusCode: 403,
            error: errorCode.client,
            errors: {
              can_canceled_by_company: errorCode['client.orderCanNotCanceled']
            },
            message: 'You can not canceled other at this time'
          });
        }

        /**
         * PHASE 2: Handle for each case (status)
         */
        // For case: ready
        if (status === 'ready') {
          if (currentPStatus !== 'handling') {
            throw new BaseError({
              statusCode: 400,
              error: errorCode.client,
              errors: {
                status: errorCode['client.orderStatusIsInvalid']
              }
            });
          }
          notificationService.createAndSend({
            user_id,
            message: `Đơn hàng ${order.code} của bạn đã sẵn sàng.`,
            type: 'user_delivering_order',
            object_id: order._id,
            onModel: 's_order',
            title: 'Đơn hàng đã sẵn sàng'
          });
          orderFirestoreService.update(order.code, { progress_status: status });
          order.progress_status = status;
          await order.save();
        }
        // For case: delivered
        if (status === 'delivered') {
          if (currentStatus !== 'handling' || paymentType !== 'postpaid') {
            throw new BaseError({
              statusCode: 400,
              error: errorCode.client,
              errors: {
                status: errorCode['client.orderStatusIsInvalid']
              }
            });
          }
          orderFirestoreService.update(order.code, { status });
          order.status = status;
          await order.save();
        }
        // For case: completed
        if (status === 'completed') {
          if (!order.is_paid && paymentType === 'postpaid') {
            logger.info('handleComplete: ...start');
            await transactionHelper.withSession(async (session) => {
              await orderHandler.handleComplete(
                {
                  user,
                  pay_required: paymentMethod === 'WALLET',
                  order,
                  pay_by_s_prepaid: paymentMethod === 'WALLET',
                  updates: {
                    is_paid: true,
                    payment_method: paymentMethod || 'CASH',
                    cashier_id: req.user.id || order.cashier_id,
                    status
                  }
                },
                { session }
              );
            });
            // Notify order is paid successfully to client
            const appCurrency = process.env.APP_CURRENCY;
            notificationService.createAndSend({
              user_id,
              type: 'user_pay_order_success',
              title: 'Thanh toán thành công',
              object_id: order._id,
              message: `Bạn đã thanh toán ${currencyFormat(
                order.total,
                'vi-VN',
                order.payment_method === 'WALLET' ? appCurrency : 'đ'
              )} thành công cho đơn hàng ${order.code} tại cửa hàng ${store_name}`,
              onModel: 's_order'
            });
          } else if (order.is_paid && paymentType === 'prepaid') {
            logger.info('handleCompletePrepay: ...start');
            await transactionHelper.withSession(async (session) => {
              const { order: _order } = await orderHandler.handleCompletePrepay(
                {
                  order,
                  user,
                  updates: {
                    cashier_id: req.user.id || order.cashier_id,
                    status
                  }
                },
                { session }
              );
              order = _order;
            });
          }
        }
        // For case: company_canceled || user_rejected
        if (['company_canceled', 'user_rejected'].includes(status)) {
          if (paymentType === 'prepaid') {
            await transactionHelper.withSession(async (session) => {
              await orderHandler.handleCancelPrepay(
                {
                  order,
                  performed_by: req.user,
                  user,
                  updates: { status, reason_canceled, reason_rejected }
                },
                { session }
              );
            });
          } else {
            await transactionHelper.withSession(async (session) => {
              await orderHandler.handleCancel(
                {
                  order,
                  user,
                  updates: { status, reason_canceled, reason_rejected }
                },
                { session }
              );
            });
          }

          // Notify order is canceled to client
          notificationService.createAndSend({
            user_id,
            type: 'user_company_canceled_order',
            title: 'Đơn hàng bị hủy',
            object_id: order._id,
            message: `Đơn hàng ${order.code} đã bị hủy`,
            onModel: 's_order'
          });
        }
        withSafety(() => {
          companyActivityService.implicitCreate(CompanyActions.confirmOrder)(req, {
            object_id: order._id
          });
        });
        return new BaseResponse({
          statusCode: 200,
          data: order
        }).return(res);
      } catch (err) {
        next(err);
      }
    },
    async postV2(req, res, next) {
      try {
        const { id: seller_id, ...seller } = req.user;
        const { id: company_id, wallet: companyWallet, is_owner } = req.company;
        const store_id = req.body.store_id || req.company.store_id;
        const {
          total: preCalTotal,
          products: productsFromOrder,
          without_product = false,
          note: company_note
        } = req.body;
        // Check if store not exist or disabled
        if (!store_id)
          throw new BaseError({
            statusCode: 400,
            error: errorCode.validate,
            errors: { store_id: errorCode['any.required'] }
          });
        if (is_owner) {
          await storeService.findActive({ _id: store_id, company_id });
        }

        // Check if creating order without products is allowed (in case: without_product === true)
        const [settings, promotion] = await Promise.all([
          settingService.get(company_id),
          promotionService.findActiveV2({ company_id, store_id, product_scope: 'all' })
        ]);
        if (without_product && !settings.can_order_without_product) {
          throw new BaseError({
            statusCode: 400,
            error: errorCode.client,
            errors: { without_product: errorCode['client.orderIsInvalid'] },
            message: 'can not make order without products!'
          });
        }

        // Data for creating order
        const orderData = {
          company_id,
          store_id,
          seller_id,
          original_total: preCalTotal,
          without_product,
          type: 'offline',
          company_note
        };
        // Handle order without products
        if (without_product) {
          const withoutProductRates =
            settings.order_without_product_rate.reverse().find((d) => d.from <= preCalTotal) || {};
          const { refund_rate = 0, discount_rate = 0 } = promotion || {};
          orderData.refund_rate = refund_rate || withoutProductRates.refund_rate || 0;
          orderData.discount_rate = discount_rate || withoutProductRates.discount_rate || 0;
          orderData.total_refund = preCalTotal * orderData.refund_rate;
          orderData.total_discount = preCalTotal * orderData.discount_rate;
          orderData.total = preCalTotal - orderData.total_discount;
        } else {
          // Check if products from order all exist & enough quantity
          const checkedProducts = await Promise.map(productsFromOrder, async (product) => {
            const productStoring = await productStoringService.findActive({
              _id: product.product_storing_id,
              store_id,
              populate: 'product'
            });
            if (productStoring.is_limited_stock && productStoring.stock - product.quantity < 0) {
              throw new BaseError({
                statusCode: 400,
                error: errorCode.client,
                errors: {
                  stock: errorCode['client.outOfStock']
                }
              });
            }
            return {
              ...product,
              ...productStoring.toObject(),
              ...productStoring.product.toObject(),
              id: productStoring.product_id,
              _id: productStoring._id
            };
          });

          orderData.products = checkedProducts;
        }

        // Create new offline order
        let savedOrder = null;
        await transactionHelper.withSession(async (session) => {
          savedOrder = await orderService.createOffline(orderData, {
            session,
            needGetPrice: !without_product,
            mustGotPromotionCode: !without_product
          });

          await Promise.all([
            productStoringHandler.updateStocksFromOrder(
              savedOrder,
              { _id: seller_id, ...seller },
              { session }
            ),
            companyService.updateWallet(
              { _id: company_id },
              { wallet: -savedOrder.total_refund, refund_fund: savedOrder.total_refund }
            )(session),
            companyHistoryService.create(
              {
                company_id,
                new_balance: companyWallet,
                type: companyHistoryService.type.refund_order,
                transaction_id: savedOrder._id,
                value: -savedOrder.total_refund
              },
              { session }
            )
          ]);
        });

        orderFirestoreService.create(savedOrder.code, {
          id: savedOrder.id,
          status: savedOrder.status,
          total: savedOrder.total
        });

        return new BaseResponse({
          statusCode: 201,
          data: savedOrder
        }).return(res);
      } catch (err) {
        return next(err);
      }
    },
    async post(req, res, next) {
      try {
        const { id: seller_id } = req.user;
        const { id: company_id, is_owner } = req.company;
        const store_id = req.body.store_id || req.company.store_id;
        if (!store_id)
          throw new BaseError({
            statusCode: 400,
            error: errorCode.validate,
            errors: { store_id: errorCode['any.required'] }
          });
        if (is_owner) await storeService.findActive({ _id: store_id, company_id });
        const type = 'offline';
        const { total, products, without_product, note: company_note } = req.body;

        let [settings, promotion] = await Promise.all([
          settingService.get(company_id),
          promotionService.findActive({ company_id, product_scope: 'all' })
        ]);
        if (without_product) {
          if (!settings.can_order_without_product)
            throw new BaseError({
              statusCode: 400,
              error: 'can not make order without products!'
            });
          const rates = settings.order_without_product_rate.reverse().find((d) => d.from <= total);
          // if (!rates) company_preset = await configService.get('company_preset');
          let { refund_rate, discount_rate } = rates;
          let isAppliedPromotion = false;
          if (promotion.store_id) {
            // V2
            isAppliedPromotion = promotion.store_id.toString() === store_id.toString();
          } else {
            isAppliedPromotion = true;
          }
          if (promotion) {
            refund_rate = promotion.refund;
            discount_rate = promotion.value;
          }
          const total_discount = discount_rate * total;
          const total_refund = refund_rate * total;
          const [_company] = await companyService.transact(
            companyService.updateWallet(
              { _id: company_id },
              { wallet: -total_refund, refund_fund: total_refund }
            )
          );

          const order = await orderService.createOffline({
            total: total - total_discount,
            total_discount,
            total_refund,
            discount_rate,
            refund_rate,
            company_id,
            store_id,
            seller_id,
            original_total: total,
            without_product: true,
            type,
            company_note
          });
          orderFirestoreService.create(order.code, {
            id: order.id,
            status: order.status,
            total: order.total
          });
          companyHistoryService.create({
            company_id,
            new_balance: _company.wallet,
            type: companyHistoryService.type.refund_order,
            transaction_id: order._id,
            value: -order.total_refund
          });
          return new BaseResponse({ statusCode: 200, data: order }).return(res);
        } else {
          let promotion_code, promotion_id;
          const [promotion, productList] = await Promise.all([
            promotionService.findActiveV2({
              company_id
            }),
            Promise.map(products, async (product) => {
              const productStoring = await productStoringService.findActive({
                _id: product.product_storing_id,
                store_id,
                populate: 'product'
              });
              if (productStoring.is_limited_stock && productStoring.stock - product.quantity < 0) {
                throw new BaseError({
                  statusCode: 400,
                  error: errorCode.client,
                  errors: {
                    stock: errorCode['client.outOfStock']
                  }
                });
              }
              return { ...product, ...productStoring.product.toObject(), productStoring };
            })
          ]);
          // if V2
          if (promotion && promotion.store_id) {
            await Promise.map(productList, async (_product) => {
              const productPromotion = promotion && promotion.products.id(_product.id);
              const promotionCode = await promotionCodeServiceV2.autoGetV2({
                product_id: _product._id,
                apply_count: _product.quantity,
                company_id: _product.company_id,
                store_id: _product.productStoring.store_id
              });
              _product.promotion_id = promotionCode.promotion && promotionCode.promotion._id;
              _product.promotion_code = promotionCode.code;
              _product.promotion_code_id = promotionCode._id;
              _product.applied_promotion_quantity = promotionCode.apply_count || 0;
              const hasPromotion =
                productPromotion && _product.applied_promotion_quantity
                  ? !productPromotion.unlimited
                    ? Math.abs(productPromotion.total - _product.quantity)
                    : true
                  : 0;
              let refund_rate = hasPromotion ? promotion.refund : _product.refund_rate;
              let refund = refund_rate * _product.price;
              let total_refund = refund * _product.applied_promotion_quantity;
              //* discount
              let discount_rate = hasPromotion ? promotion.value : 0;
              let discount = _product.price * discount_rate;
              let total_discount = discount * _product.applied_promotion_quantity;
              let final_price = _product.price - (discount || 0);
              let original_price = _product.price;
              let original_total = original_price * _product.quantity;
              let total = original_total - total_discount;
              Object.assign(_product, {
                _id: _product.product_storing_id,
                id: _product.id,
                product_storing_id: _product.product_storing_id,
                product_id: _product.id,
                quantity: _product.quantity,
                refund,
                refund_rate,
                total_refund,
                discount,
                discount_rate,
                total_discount,
                total,
                original_price,
                original_total,
                final_price
              });
            });
          }
          // V1
          else {
            const listProductInPromotion =
              (promotion && promotion.product_ids.map((id) => id.toString())) || [];
            //* get Promotion_code
            const code = await promotionCodeService.autoGet({
              product_id: productList.map((product) => product._id),
              promotion
            });
            promotion_code = code.code;
            promotion_id = code.promotion_id;
            productList.map((_product) => {
              const hasPromotion = listProductInPromotion.includes(_product.id);
              //* refund
              // let refund_rate = _product.refund_rate || 0;
              let refund_rate = hasPromotion ? promotion.refund : _product.refund_rate;
              let refund = refund_rate * _product.price;
              let total_refund = refund * _product.quantity;
              //* discount
              let discount_rate = hasPromotion ? promotion.value : 0;
              let discount = _product.price * discount_rate;
              let total_discount = discount * _product.quantity;
              let final_price = _product.price - (discount || 0);
              let original_price = _product.price;
              let original_total = original_price * _product.quantity;
              let total = original_total - total_discount;
              Object.assign(_product, {
                _id: _product.product_storing_id,
                id: _product.id,
                quantity: _product.quantity,
                refund,
                refund_rate,
                total_refund,
                discount,
                discount_rate,
                total_discount,
                total,
                original_price,
                original_total,
                final_price
              });
            });
          }
          const total = productList.reduce(
            (prev, curt) => {
              return {
                total_discount: prev.total_discount + curt.total_discount,
                total_refund: prev.total_refund + curt.total_refund,
                total: prev.total + curt.total,
                original_total: prev.original_total + curt.original_total
              };
            },
            {
              total: 0,
              total_refund: 0,
              total_discount: 0,
              original_total: 0
            }
          );
          //* update total_refund
          const [_company] = await companyService.transact(
            companyService.updateWallet(
              { _id: company_id },
              { wallet: -total.total_refund, refund_fund: total.total_refund }
            )
          );
          const order = await orderService.createOfflineCompanyPost({
            products: productList,
            promotion_code,
            promotion_id,
            store_id,
            seller_id,
            company_id,
            total: total.total,
            total_discount: total.total_discount,
            total_refund: total.total_refund,
            original_total: total.original_total,
            type,
            company_note
          });
          orderFirestoreService.create(order.code, {
            id: order.id,
            status: order.status,
            total: order.total
          });
          companyHistoryService.create({
            company_id,
            new_balance: _company.wallet,
            type: companyHistoryService.type.refund_order,
            transaction_id: order._id,
            value: -order.total_refund
          });
          // * update stock
          if (!order.without_product)
            order.products.forEach((product) => {
              // product.is_limited_stock &&
              productStoringHandler.updateStock({
                fromId: product._id,
                fromDeltaQuantity: -product.quantity,
                type: 'sell',
                performedUser: { _id: req.user.id },
                transactionId: order._id,
                onModel: 's_order'
              });
            });
          withSafety(() => {
            companyActivityService.implicitCreate(CompanyActions.createOrder)(req, {
              object_id: order.id
            });
          });
          return new BaseResponse({ statusCode: 200, data: order }).return(res);
        }
      } catch (error) {
        next(error);
      }
    },
    async pay(req, res, next) {
      try {
        const { code } = req.params;
        const { id: cashier_id } = req.user;
        const { payment_method, payment_code, phone_number } = req.body;
        const { id: company_id } = req.company;
        // const store_id = req.company.store_id || req.body.store_id;
        let user, payCode;
        //* check paycode
        if (payment_code) {
          payCode = await paymentCodeService.get(payment_code);
          if (!payCode || !payCode.is_valid)
            throw new BaseError({
              statusCode: 400,
              error: errorCode.client,
              errors: { payment_code: errorCode['client.paymentCodeNotValid'] }
            });
          user = await userService.findActive(payCode.user_id);
        }
        if (payment_method === 'CASH' && !user && phone_number) {
          user = await userService.findByPhone(phone_number);
        }

        // //* check owner
        // if (is_owner) await storeService.findActive({ _id: store_id, company_id });
        const order = await orderService.findByCode({ code, company_id });
        // Set paymentType is postpaid as default if order.payment_type is undefined
        const paymentType = order.payment_type || 'postpaid';

        if (!user && order.user_id) {
          user = await userService.findActive(order.user_id);
        }
        if (!user)
          throw new BaseError({
            statusCode: 404,
            error: 'client',
            errors: {
              user: errorCode['client.userNotFound']
            }
          });
        if (order.type !== 'offline')
          throw new BaseError({
            statusCode: 403,
            error: errorCode.client,
            errors: { order: errorCode['client.client.orderMustBeOffline'] }
          });
        //? check is Paid
        if (order.is_paid)
          throw new BaseError({
            statusCode: 400,
            error: errorCode.client,
            errors: {
              order: errorCode['client.orderIsPaid']
            }
          });
        //? check status
        if (
          (paymentType === 'postpaid' && !['delivered', 'handling'].includes(order.status)) ||
          (paymentType === 'prepaid' && order.status !== 'handling')
        )
          throw new BaseError({
            statusCode: 400,
            error: errorCode.client,
            errors: { oder: errorCode['client.orderStatused'] }
          });
        //* pay by user's wallet
        if (payment_method === 'WALLET' && user.wallet.total < order.total)
          ///* check wallet
          throw new BaseError({
            statusCode: 400,
            error: errorCode.client,
            errors: {
              money: errorCode['client.MoneyNotEnough']
            }
          });
        const updates = {
          is_paid: true,
          user_id: user.id,
          payment_method: payment_method,
          cashier_id: cashier_id,
          status: 'completed'
        };
        await transactionHelper.withSession(async (session) => {
          await orderHandler.handleComplete(
            {
              user,
              pay_required: payment_method === 'WALLET',
              order,
              pay_by_s_prepaid: payment_method === 'WALLET',
              updates
            },
            { session }
          );
        });
        Object.assign(order, updates);
        // * send notification when pay order successfully
        const appCurrency = process.env.APP_CURRENCY;
        storeService.findOne({ _id: order.store_id }, 'name').then((store) =>
          notificationService.createAndSend({
            user_id: user.id,
            type: 'user_pay_order_success',
            title: 'Thanh toán thành công',
            object_id: order._id,
            message: `Bạn đã thanh toán ${currencyFormat(
              order.total,
              'vi-VN',
              payment_method === 'WALLET' ? appCurrency : 'đ'
            )} thành công cho đơn hàng ${order.code} tại cửa hàng ${store.name}`,
            onModel: 's_order'
          })
        );
        payment_method === 'WALLET' &&
          notificationService.createAndSend({
            company_id: order.company_id,
            title: 'Đã được thanh toán thành công',
            message: `Đơn hàng ${order.code} đã được thanh toán thành công với ${currencyFormat(
              order.total,
              'vi-VN',
              appCurrency
            )}`,
            user_id: order.seller_id,
            object_id: order._id,
            onModel: 's_order',
            type: 'company_user_pay_order'
          });

        orderFirestoreService.update(order.code, {
          user_id: user.id,
          user_avatar: user.avatar,
          user_name: user.name,
          user_phone_number: user.phone,
          status: order.status
        });
        withSafety(() => {
          companyActivityService.implicitCreate(CompanyActions.payOrder)(req, {
            object_id: order._id
          });
        });
        return new BaseResponse({ statusCode: 200, data: order }).return(res);
      } catch (error) {
        next(error);
      }
    },
    async get(req, res, next) {
      try {
        const {
          limit,
          page,
          select,
          sort = '-createdAt',
          status,
          type,
          start_time,
          end_time,
          staff_id,
          store_id,
          promotion_id,
          ...query
        } = req.query;
        const { id: company_id } = req.company;
        const subQuery = mergeObject(
          {},
          start_time && {
            createdAt: {
              $gt: start_time,
              $lt: end_time
            }
          },
          staff_id && {
            $or: [{ seller_id: staff_id }, { cashier_id: staff_id }]
          }
        );
        const [orders, count] = await Promise.all([
          orderService.find({
            ...subQuery,
            ...query,
            company_id,
            store_id,
            promotion_id,
            status,
            limit,
            page,
            select,
            sort,
            type,
            populate: [
              { path: 'user', select: 'name phone' },
              { path: 'store', select: 'name' },
              { path: 'cashier', select: 'name phone' },
              { path: 'seller', select: 'name phone' },
              { path: 'buyer' }
            ]
          }),
          limit &&
            orderService.count({
              ...subQuery,
              ...query,
              company_id,
              store_id,
              promotion_id,
              status,
              type
            })
        ]);
        const total_page = limit && Math.ceil(count / limit);
        return new BaseResponse({ statusCode: 200, data: orders })
          .addMeta({ total_page, total: count })
          .return(res);
      } catch (error) {
        next(error);
      }
    },
    async get_v2(req, res, next) {
      try {
        const {
          limit = 10,
          sort = '-_id -createdAt',
          page = 1,
          user_name,
          user_phone,
          from_date,
          to_date,
          ...query
        } = req.query;
        // Convert createdAt to mongoose query date object (if any)
        if (from_date || to_date) {
          query.createdAt = {};
          from_date && (query.createdAt['$gte'] = new Date(from_date));
          to_date && (query.createdAt['$lte'] = new Date(to_date));
        }
        user_name && (query['lower_username'] = new RegExp((user_name + '').toLowerCase(), 'g'));
        user_phone && (query['user.phone'] = user_phone[0] !== '+' ? '+' + user_phone : user_phone);

        // Find by regex if user_name not empty
        const additionalStages = [
          { $addFields: { user: { $arrayElemAt: ['$user', 0] } } },
          { $addFields: { lower_username: { $toLower: '$user.name' } } }
        ];

        // Base pineline operations
        const pipeline = [
          { $lookup: { from: 'users', localField: 'user_id', foreignField: '_id', as: 'user' } },
          ...(user_name ? additionalStages : []),
          { $match: query }
        ];
        // For finding order documents
        const pipelineFind = [...pipeline, { $project: { user: 0, lower_name: 0 } }];
        // For counting total documents
        const pipelineCount = [...pipeline, { $count: 'total' }];

        const [orders, count] = await Promise.all([
          // Two below lines not ensure the sequence of operations
          // orderService.aggregate({ pipeline: pipelineFind, sort, skip, limit }),
          // orderService.aggregate({ pipeline: pipelineCount })

          // Use the follow instead
          orderModel
            .aggregate(pipelineFind)
            .sort(sort)
            .skip((page - 1) * limit)
            .limit(limit),
          orderModel.aggregate(pipelineCount)
        ]);

        const totalDocs = count[0] && count[0].total ? count[0].total : 0;
        const total_page = Math.ceil(totalDocs / limit);
        return new BaseResponse({ statusCode: 200, data: orders })
          .addMeta({
            current_page: page,
            prev_page: (page > 1 && page - 1) || null,
            next_page: (page < total_page && page + 1) || null,
            total_page
          })
          .return(res);
      } catch (err) {
        next(err);
      }
    },
    async getByCode(req, res, next) {
      try {
        const { code } = req.params;
        const { store_id, id: company_id } = req.company;
        const order = await orderService.findByCode({
          ...(code.length === 24 ? { _id: code } : { code }),
          company_id,
          store_id,
          populate: [
            { path: 'user', select: 'name phone' },
            { path: 'store', select: 'name' },
            { path: 'cashier', select: 'name phone' },
            { path: 'seller', select: 'name phone' },
            { path: 'buyer' }
          ]
        });
        return new BaseResponse({ statusCode: 200, data: order }).return(res);
      } catch (error) {
        next(error);
      }
    },
    async put(req, res, next) {
      try {
        const { status, reason_canceled, reason_rejected, progress_status } = req.body;
        const { id: company_id, category_id } = req.company;
        const order = await orderService.findByCode({
          code: req.params.code,
          company_id: req.company.id
        });
        if (OrderFinalStatuses.includes(order.status))
          throw new BaseError({
            statusCode: 400,
            error: errorCode.client,
            errors: {
              status: errorCode['client.orderStatused']
            }
          });
        if (order.type === 'online' && !order.is_received_at_store)
          throw new BaseError({
            statusCode: 400,
            error: errorCode.client,
            errors: {
              type: errorCode['client.orderMustBeOffline']
            }
          });
        if (order.type === 'offline' && !order.is_created_from_menu) {
          if (progress_status || status === 'delivered')
            throw new BaseError({
              statusCode: 400,
              error: errorCode.client,
              errors: {
                type: errorCode['client.orderCanNotChange']
              }
            });
        }
        if (status === 'company_canceled' || status === 'user_rejected') {
          if (!order.can_canceled_by_company) {
            throw new BaseError({
              statusCode: 403,
              error: errorCode.client,
              errors: {
                can_canceled_by_company: errorCode['client.orderCanNotCanceled']
              },
              message: 'You can not canceled other at this time'
            });
          }

          const user = await userService.findOne({ _id: order.user_id });
          Object.assign(order, { status });
          await transactionHelper.withSession(async (session) => {
            await orderHandler.handleCancel(
              { order, user, staff: req.user, updates: { status } },
              { session }
            );
          });
        }
        if (status === 'delivered') {
          if ((progress_status && progress_status !== 'ready') || order.progress_status !== 'ready')
            throw new BaseError({
              statusCode: 403,
              error: errorCode.client,
              message: 'must be ready before delivered',
              errors: {
                progress_status: errorCode['client.orderMustBeReady']
              }
            });
          order.delivered_date = new Date();
        }
        mergeObject(order, { status, progress_status, reason_canceled, reason_rejected });
        if (order.isModified('progress_status')) {
          if (order.progress_status === 'ready') {
            order.ready_date = new Date();
            notificationService.createAndSend({
              user_id: order.user_id,
              message: `Đơn hàng ${order.code} của bạn đã sẳn sàng, bạn có thể tới cửa hàng và lấy hàng ngay.`,
              type: 'user_completed_order',
              object_id: order._id,
              onModel: 's_order',
              title: 'Đơn hàng đã sẳn sàng'
            });
          }
        }
        orderFirestoreService.update(order.code, { progress_status, status });
        await order.save();
        withSafety(() => {
          companyActivityService.implicitCreate(CompanyActions.updateOrder)(req, {
            object_id: order._id
          });
        });
        return new BaseResponse({
          statusCode: 200,
          data: order
        }).return(res);
      } catch (error) {
        next(error);
      }
    },
    async getStatisticByCustomerOrStore(req, res, next) {
      try {
        const {
          sort,
          limit,
          page,
          store_id,
          user_id,
          created_from,
          created_to,
          type
        } = req.validate;
        const skip = limit && page ? limit * (page - 1) : 0;
        let company = req.company;

        let condition = { company_id: company._id, status: 'completed' };
        if (user_id) {
          const userId = mongoose.Types.ObjectId(user_id);
          condition.user_id = userId;
        }

        if (store_id) {
          condition.store_id = mongoose.Types.ObjectId(store_id);
        }
        if (created_from && created_to) {
          condition = {
            ...condition,
            createdAt: {
              $lte: new Date(created_to),
              $gte: new Date(created_from)
            }
          };
        }

        if (type === 'anonymous') {
          condition = {
            ...condition,
            $and: [{ buyer_id: { $exists: true } }, { buyer_id: { $ne: null } }]
          };
        }
        if (type === 'normal') {
          condition = {
            ...condition,
            $or: [{ buyer_id: { $exists: false } }, { buyer_id: null }]
          };
        }
        let pipeline = [
          {
            $match: condition
          },
          {
            $group: {
              _id: type === 'anonymous' ? '$buyer_id' : '$user_id',
              totalOrders: { $sum: 1 },
              totalPayment: { $sum: '$total' },
              totalDiscount: { $sum: '$total_discount' },
              totalRefund: { $sum: '$total_refund' }
            }
          },
          {
            $lookup: {
              from: type === 'anonymous' ? buyerModel.collection.name : userModel.collection.name,
              localField: '_id',
              foreignField: '_id',
              as: 'user'
            }
          },
          {
            $project: {
              totalOrders: 1,
              totalPayment: 1,
              totalDiscount: 1,
              totalRefund: 1,
              'user.name': 1,
              'user.phone': 1,
              'user._id': 1,
              'user.chat_username': 1
            }
          }
        ];

        let pipelineCount = [
          {
            $match: condition
          },
          {
            $group: {
              _id: '$user_id'
            }
          },
          {
            $count: 'totalItem'
          }
        ];

        let response = await Promise.all([
          orderService.aggregate({ pipeline: pipelineCount }),
          orderService.aggregate({ pipeline, sort, limit, skip })
        ]);
        const customerList = response[1].map((item) => {
          if (item._id === null) {
            item._id = 'anonymous';
            item.user = [
              {
                name: 'Khách vãng lai'
              }
            ];
          }
          return item;
        });
        return res.send(
          new BaseResponse({ statusCode: 200, data: customerList }).addMeta({
            total: response[0][0] ? response[0][0].totalItem : 0
          })
        );
      } catch (err) {
        return next(err);
      }
    },
    async updateProgress(req, res, next) {
      try {
        const { code, status } = req.body;
        const { id: company_id } = req.company;
        const { id: seller_id } = req.user;
        const order = await orderService.findOne({ code, company_id });
        // order.handling_progress.push({
        //   date: new Date(),
        //   status
        // });

        // Check if order type is not offline
        if (order.type !== 'offline') {
          throw new BaseError({
            statusCode: 403,
            error: errorCode.client,
            errors: { order: errorCode['client.client.orderMustBeOffline'] }
          });
        }
        // Check previous & next status
        const statuses = { pending: 1, handling: 2, ready: 3 };
        const prev = order.progress_status;
        const next = status;
        const isValid = statuses[next] - statuses[prev] === 1;
        if (!isValid) {
          throw new BaseError({
            statusCode: 400,
            error: errorCode.client,
            errors: {
              type: errorCode['client.orderStatusIsInvalid']
            }
          });
        }

        order.seller_id = order.seller_id || seller_id;
        order.progress_status = status;
        await order.save();

        withSafety(() => {
          // Notify order's progress status is ready to client
          notificationService.createAndSend({
            user_id: order.user_id,
            message: `Đơn hàng ${order.code} của bạn đã sẳn sàng.`,
            type: 'user_delivering_order',
            object_id: order._id,
            onModel: 's_order',
            title: 'Đơn hàng đã sẳn sàng'
          });
          companyActivityService.implicitCreate(CompanyActions.updateOrder)(req, {
            object_id: order._id
          });
        });
        return new BaseResponse({ statusCode: 200, data: order }).return(res);
      } catch (error) {
        next(error);
      }
    },
    async getStatisticByProduct(req, res, next) {
      try {
        const { created_from, created_to, type, limit, store_id, ...other } = req.query;
        const query = {
          createdAt: { $gte: new Date(created_from), $lte: new Date(created_to) },
          company_id: req.company._id,
          ...other
        };
        if (store_id) {
          query.store_id = mongoose.Types.ObjectId(store_id);
        }
        // if (status) {
        //   query.status = status;
        // }
        const data = await orderService.statisticByProduct(query);
        return new BaseResponse({ statusCode: 200, data })
          .addMeta({ total: data.length })
          .return(res);
      } catch (error) {
        return next(error);
      }
    }
  },
  admin: {
    async get(req, res, next) {
      try {
        const {
          limit,
          page,
          select,
          sort,
          status,
          start_time,
          end_time,
          product_id,
          ...query
        } = req.query;
        if (start_time && end_time) {
          query.createdAt = {
            $gte: start_time,
            $lte: end_time
          };
        }
        if (product_id) {
          query['products.id'] = product_id;
        }
        const [orders, count] = await Promise.all([
          orderService.find({
            status,
            limit,
            page,
            select,
            sort,
            populate: [
              { path: 'user', select: 'name' },
              { path: 'store', select: 'name' },
              { path: 'cashier', select: 'name' },
              { path: 'company', select: 'name' },
              { path: 'seller', select: 'name' }
            ],
            ...query
          }),
          limit && orderService.count({ ...query, status })
        ]);
        const total_page = limit && Math.ceil(count / limit);
        return new BaseResponse({ statusCode: 200, data: orders })
          .addMeta({ total_page, total: count })
          .return(res);
      } catch (error) {
        next(error);
      }
    },
    async getByCode(req, res, next) {
      try {
        const { code } = req.params;
        const order = await orderService.findByCode({
          code,
          populate: [
            { path: 'user', select: 'name phone' },
            { path: 'cashier', select: 'name phone' },
            { path: 'seller', select: 'name phone' }
          ]
        });
        return new BaseResponse({ statusCode: 200, data: order }).return(res);
      } catch (error) {
        next(error);
      }
    },
    async statistic(req, res, next) {
      try {
        let { start_time, end_time, company_id, status, type } = req.query;
        start_time = new Date(req.query.start_time);
        end_time = req.query.end_time ? new Date(req.query.end_time) : new Date();
        const query = {
          createdAt: { $gte: start_time, $lte: end_time }
        };
        if (company_id) {
          query.company_id = company_id.toObjectId();
        }
        if (status) {
          query.status = status;
        }
        if (type) {
          query.type = type;
        }
        const statics = await orderService.statistic(query);
        return new BaseResponse({ statusCode: 200, data: statics }).return(res);
      } catch (error) {
        next(error);
      }
    },
    async approve(req, res, next) {
      try {
        const { code } = req.body;
        const order = await orderService.findByCode({
          code: code
        });
        if (!order)
          throw new BaseError({
            statusCode: 404,
            error: errorCode.client,
            errors: { order: errorCode['client.orderNotExist'] }
          });
        if (OrderFinalStatuses.includes(order.status))
          throw new BaseError({
            statusCode: 400,
            error: errorCode.client,
            errors: {
              status: errorCode['client.orderStatused']
            }
          });
        if (order.type === 'offline') {
          throw new BaseError({
            statusCode: 400,
            error: errorCode.client,
            errors: {
              type: errorCode['client.orderIsOffline']
            }
          });
        }
        if (!order.is_confirmed) {
          throw new BaseError({
            statusCode: 400,
            error: errorCode.client,
            errors: { confirm: errorCode['client.orderIsNotConfirmed'] }
          });
        }
        const user = await userService.findOne({ _id: order.user_id });
        const updates = { status: 'completed' };

        await transactionHelper.withSession(async (session) => {
          await orderHandler.handleComplete(
            {
              user,
              order,
              pay_required: false,
              pay_by_s_prepaid: order.payment_method === 'WALLET',
              updates
            },
            { session }
          );
        });
        Object.assign(order, updates);
        const notification = { message: '', title: '', type: '' };
        Object.assign(notification, {
          message: `Đơn hàng ${order.code} của bạn đã được xác nhận là hoàn thành`,
          title: 'Đơn hàng hoàn tất'
        });
        // * send notification when completed order successfully
        notificationService.createAndSend({
          user_id: order.user_id,
          ...notification,
          object_id: order._id,
          onModel: 's_model',
          type: 'user_completed_order'
        });

        // Create admin activities
        adminActivityService.create({
          admin_id: req.admin.id,
          on_model: 's_order',
          object_id: order._id,
          updated_fields: ['status'],
          type: 'update',
          snapshot: order,
          resource: req.originalUrl
        });

        await orderHandler.handleTransportFee({ order });
        return new BaseResponse({ statusCode: 200, data: order }).return(res);
      } catch (error) {
        next(error);
      }
    },
    async payFee(req, res, next) {
      try {
        const { code } = req.body;
        const order = await orderService.findByCode({ code: code });
        if (!order)
          throw new BaseError({
            statusCode: 404,
            error: errorCode.client,
            errors: { order: errorCode['client.orderNotExist'] }
          });
        if (!order.is_confirmed) {
          throw new BaseError({
            statusCode: 400,
            error: errorCode.client,
            errors: { confirm: errorCode['client.orderIsNotConfirmed'] }
          });
        }
        await orderHandler.handleServiceFee({ order });
        await orderHandler.handleTransportFee({ order });
        const newOrder = await orderService.findByCode({ code: code });
        return new BaseResponse({ statusCode: 200, data: newOrder }).return(res);
      } catch (error) {
        next(error);
      }
    },
    async getLogisticsOrder(req, res, next) {
      try {
        const { code } = req.params;
        const order = await orderService.findByCode({ code: code });
        if (!order)
          throw new BaseError({
            statusCode: 404,
            error: errorCode.client,
            errors: { order: errorCode['client.orderNotExist'] }
          });
        if (order.type === 'offline') {
          throw new BaseError({
            statusCode: 400,
            error: errorCode.client,
            errors: {
              type: errorCode['client.orderIsOffline']
            }
          });
        }
        if (order.is_received_at_store) {
          throw new BaseError({
            status: 400,
            error: errorCode.client,
            errors: {
              type: errorCode['client.orderIsReceivedAtStore']
            }
          });
        }

        const [orderInfo, orderFee] = await Promise.all([
          baseLogistics[order.logistics_provider].getOrderInfo(order),
          baseLogistics[order.logistics_provider].getOrderFee(order)
        ]);

        return new BaseResponse({
          statusCode: 200,
          data: orderInfo
        })
          .addMeta({ fee: orderFee })
          .return(res);
      } catch (error) {
        next(error);
      }
    }
  }
};
