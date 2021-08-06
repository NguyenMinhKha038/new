/* eslint-disable prettier/prettier */
import { Promise } from 'bluebird';
import orderServiceV2 from './order.service';
import orderHandlerV2 from './order.handler';
import {
  BaseResponse,
  selectToPopulate,
  BaseError,
  errorCode,
  transactionHelper,
  withSafety,
  currencyFormat,
  mergeObject
} from '../../../commons/utils';
import { PopulatedFields, SaleForms, StatisticTypes } from './order.config';
import settingService from '../../setting/setting.service';
import storeService from '../../store/store.service';
import productStoringService from '../../product-storing/product-storing.service';
import orderFirestoreService from '../order-firestore.service';
import { Types, Statuses, FinalStatuses, StatusesFrom } from './order.config';
import productStoringHandlerV2 from '../../product-storing/v2/product-storing.handler';
import orderCachingService from '../../order-caching/order-caching.service';
import companyService from '../../company/company.service';
import companyHistoryService from '../../company-history/company-history.service';
import paymentCodeService from '../../payment_code/payment-code.service';
import { userService } from '../../../commons/user';
import orderService from '../order.service';
import notificationService from '../../notification/notification.service';
import companyActivityService from '../../company-activity/company-activity.service';
import { CompanyActions } from '../../company-activity/company-activity.config';
import buyerService from '../../buyer/buyer.service';
import { getDateRangeQuery } from '../../../commons/utils/utils';
import { ModelStatuses } from '../../product-storing/v2/product-storing.config';
import orderHelper from '../order.helper';
import { detachJob } from '../../../commons/utils/detach-job';
import sellingOptionService from '../../selling-option/selling-option.service';
import orderModel from '../order.model';

export default {
  user: {
    //TODO: REFACTOR THIS LATER!
    async payOffline(req, res, next) {
      try {
        const {
          params: { code },
          user: { wallet: userWallet, ...user },
          body: { payment_method }
        } = req;

        // Get order if existed
        const query = {
          code,
          is_paid: { $ne: true },
          status: { $nin: Object.values(FinalStatuses) },
          type: Types.Offline,
          populate: 'products.product'
        };
        const order = await orderServiceV2.findByCode(query);
        if (payment_method === 'WALLET') {
          // Check user wallet
          if (userWallet.total < order.total)
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
            await orderHandlerV2.handleComplete(
              {
                order,
                user,
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
      } catch (err) {
        next(err);
      }
    }
  },
  company: {
    async getById(req, res, next) {
      try {
        const {
          company: { id: companyId, store_id },
          params: { id: orderId },
          query: { select, populate: populatedStr }
        } = req;
        const { populate } = selectToPopulate(populatedStr, PopulatedFields);

        const query = {
          _id: orderId,
          company_id: companyId,
          ...(store_id ? { store_id } : {})
        };
        const order = await orderServiceV2.findOne(query, select, { populate });

        return new BaseResponse({ statusCode: 200, data: order }).return(res);
      } catch (err) {
        next(err);
      }
    },
    async getByCode(req, res, next) {
      try {
        const {
          company: { id: companyId, store_id },
          params: { code },
          query: { select, populate: populatedStr }
        } = req;
        const { populate } = selectToPopulate(populatedStr, PopulatedFields);

        const query = {
          code,
          company_id: companyId,
          ...(store_id ? { store_id } : {})
        };
        const order = await orderServiceV2.findOne(query, select, { populate });
        return new BaseResponse({ statusCode: 200, data: order }).return(res);
      } catch (err) {
        next(err);
      }
    },
    async get(req, res, next) {
      try {
        const {
          company: { id: companyId, store_id },
          query: {
            limit,
            page,
            select,
            sort,
            populate: populatedStr,
            date_from,
            date_to,
            expires_from,
            expires_to,
            ...query
          }
        } = req;
        query.company_id = companyId;
        if (store_id) {
          query.store_id = store_id;
        }

        const { populate } = selectToPopulate(populatedStr, PopulatedFields);
        const [orders, metadata] = await orderServiceV2.findWithPagination({
          page,
          limit,
          select,
          sort,
          populate,
          query: {
            ...query,
            ...getDateRangeQuery('createdAt', { fromDate: date_from, toDate: date_to })
          }
        });
        return new BaseResponse({ statusCode: 200, data: orders }).addMeta(metadata).return(res);
      } catch (err) {
        next(err);
      }
    },
    async pay(req, res, next) {
      try {
        const { code } = req.params;
        const { id: cashier_id } = req.user;
        const { payment_method, payment_code, phone_number, user_type } = req.body;
        const { id: company_id } = req.company;
        // const store_id = req.company.store_id || req.body.store_id;
        let user, payCode;
        //* check paycode
        if (payment_code) {
          payCode = await paymentCodeService.get(payment_code);
          if (!payCode || !payCode.is_valid)
            throw new BaseError({
              statusCode: 404,
              error: errorCode.client,
              errors: { payment_code: errorCode['client.paymentCodeNotValid'] }
            });
          user = await userService.findActive(payCode.user_id);
        }
        if (payment_method === 'CASH' && !user && phone_number && user_type === 'user') {
          user = await userService.findByPhone(phone_number);
        }
        if (user_type === 'buyer') {
          user = phone_number
            ? await buyerService.findOneAndUpdate(
                { phone: phone_number, company_id },
                {},
                {
                  upsert: true,
                  new: true,
                  setDefaultsOnInsert: true
                }
              )
            : await userService.findOne({ user_type: 'buyer' });
        }

        // //* check owner
        // if (is_owner) await storeService.findActive({ _id: store_id, company_id });
        const order = await orderService.findByCode({
          code,
          company_id,
          populate: {
            path: 'products.product',
            select:
              'name pure_name stock price pid stock description refund_rate discount_rate unit stock_per_box box_unit'
          }
        });
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
          user_id: user_type !== 'buyer' || !phone_number ? user.id : null,
          payment_method: payment_method,
          cashier_id: cashier_id,
          status: 'completed',
          buyer_id: user_type === 'buyer' && phone_number ? user.id : null
        };
        await transactionHelper.withSession(async (session) => {
          await orderHandlerV2.handleComplete(
            {
              user,
              pay_required: payment_method === 'WALLET',
              order,
              pay_by_s_prepaid: payment_method === 'WALLET',
              updates,
              user_type
            },
            { session }
          );
        });
        Object.assign(order, updates);
        // * send notification when pay order successfully

        // update order_counts for buyer has phone_number
        let buyer;
        if (user_type === 'buyer' && phone_number) {
          buyer = await buyerService.findOneAndUpdate(
            { phone: phone_number, company_id },
            { $inc: { order_counts: 1 } },
            { new: true }
          );
        }
        order.buyer = buyer;

        withSafety(() => {
          const appCurrency = process.env.APP_CURRENCY;

          user_type !== 'buyer' &&
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

          companyActivityService.implicitCreate(CompanyActions.payOrder)(req, {
            object_id: order._id
          });
        });

        return new BaseResponse({ statusCode: 200, data: order }).return(res);
      } catch (error) {
        next(error);
      }
    },
    async createOffline(req, res, next) {
      try {
        const { id: seller_id, ...seller } = req.user;
        const { populate } = req.query;
        const {
          id: company_id,
          wallet: companyWallet,
          store_id: userStoreId,
          is_owner
        } = req.company;
        const {
          store_id: reqStoreId,
          without_product = false,
          total: preCalTotal,
          products: productsFromOrder,
          note: company_note,
          position
        } = req.body;

        if (is_owner && !reqStoreId) {
          throw new BaseError({
            statusCode: 400,
            error: errorCode.client,
            errors: { store_id: errorCode['any.required'] }
          });
        }
        // Check if store exists or not
        const store_id = is_owner ? reqStoreId : userStoreId;
        const [store, setting] = await Promise.all([
          storeService.findActive({
            _id: store_id,
            company_id
          }),
          settingService.get(company_id)
        ]);
        // Check if without_product is allowed (in case: without_product === true)
        if (without_product && !setting.can_order_without_product) {
          throw new BaseError({
            statusCode: 400,
            error: errorCode.client,
            errors: { without_product: errorCode['client.orderIsInvalid'] },
            message: 'can not make order without products!'
          });
        }

        // Create order
        const orderData = {
          company_id,
          store_id,
          seller_id,
          without_product,
          type: Types.Offline,
          company_note,
          position
        };

        // Without products
        if (without_product) {
          const withoutProductRates =
            setting.order_without_product_rate
              .sort((r1, r2) => -r1.from + r2.from)
              .find((r) => r.from <= preCalTotal) || {};
          const { refund_rate = 0, discount_rate = 0 } = withoutProductRates;
          orderData.refund_rate = refund_rate;
          orderData.discount_rate = discount_rate;
          orderData.total_refund = preCalTotal * orderData.refund_rate;
          orderData.total_discount = preCalTotal * orderData.discount_rate;
          orderData.total = preCalTotal - orderData.total_discount;
          orderData.original_total = preCalTotal;
        } else {
          // Check if products from order all exist & enough quantity
          const detachedProducts = detachJob(productsFromOrder); // phân loại theo sản phẫm (các model có chung product_storing_id sẽ nằm cùng 1 vị trí)
          let checkedProducts = [];
          await Promise.mapSeries(detachedProducts, async (product) => { // duyệt qua mỗi sản phẩm, lại duyệt qua từng model của sản phẩm đó
            await Promise.map(
              product,
              async ({
                product_storing_id,
                quantity,
                model_id,
                options = [],
                accompanied_products = [],
                type
              }) => {
                const productStoring = await productStoringService.findActive({
                  _id: product_storing_id,
                  store_id,
                  populate: 'product options.option'
                });
                if (
                  productStoring.is_limited_stock &&
                  ((type === SaleForms.Retail && productStoring.on_sales_stock - quantity < 0) || //kiểm tra số lượng model đang check còn đủ không
                    (type === SaleForms.Wholesale && productStoring.os_box_stock - quantity < 0))//quantity là số lượng khách order của model đó
                ) {
                  throw new BaseError({
                    statusCode: 400,
                    error: errorCode.client,
                    errors: {
                      stock: errorCode['client.outOfStock']
                    }
                  });
                }

                if (type === SaleForms.Wholesale && !productStoring.has_wholesale) { // nếu khách mua sỉ nhưng loại hàng này k bán sỉ 
                  throw new BaseError({
                    statusCode: 400,
                    error: errorCode.client,
                    errors: {
                      sale_form: errorCode['client.cannotOrderWholesale']
                    }
                  });
                }

                const validModel = productStoring.model_list.find( //kiểm tra model_id của model đang check có thuộc model của sản phẩm đó hay k
                  (model) =>
                    model._id.toString() === model_id.toString() &&
                    model.status === ModelStatuses.Active
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

                if (
                  (type === SaleForms.Wholesale && validModel.os_box_stock - quantity < 0) ||
                  (type === SaleForms.Retail && validModel.on_sales_stock - quantity < 0)
                ) {
                  throw new BaseError({
                    statusCode: 400,
                    error: errorCode.client,
                    errors: {
                      stock: errorCode['client.outOfStock']
                    }
                  });
                }

                if (type === SaleForms.Wholesale && !validModel.box_price) { //kiểm tra nếu khách mua sỉ nhưng model này không có giá sỉ
                  throw new BaseError({
                    statusCode: 400,
                    error: errorCode.client,
                    errors: {
                      price: errorCode['client.hasNoBoxPrice']
                    }
                  });
                }

                let price = //nếu khách mua lẻ thì giá của model bằng giá model mà mình đã check
                  type === SaleForms.Retail
                    ? validModel.price
                    : Math.ceil(validModel.box_price / validModel.stock_per_box); //giá sỉ chia cho số lượng sp 1 hộp = giá/1sp
                let optionDocs = [];
                let accompaniedProductPrice;

                // Handle when has accompanied products
                if (accompanied_products.length) {
                  accompaniedProductPrice = await orderHelper.v3.helperAccompaniedProduct({
                    accompanied_products,
                    productStoring
                  });
                }

                // Handle when has options
                if (options && options.length) {
                  const pStoring = { ...productStoring.toObject() };
                  options.forEach((option) => { //kiểm tra option của model
                    const productStoringOption = productStoring.options.find( //option có khớp với các option hiện có của sản phẩm k
                      (item) =>
                        item.option_id.toString() === option.type_option_id.toString() &&
                        item.status === 'active'
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
                    const newOption = sellingOptionService.generate( //???
                      productStoringOption.option.toObject()
                    );
                    const pStoringOption = pStoring.options.find(
                      (item) =>
                        item.option_id.toString() === option.type_option_id.toString() &&
                        item.status === 'active'
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
                    const optionItem = pStoringOption.option.options.find( //kiểm tra optionItem(màu:đò,xanh,...)
                      (item) =>
                        item._id.toString() === option.option_id.toString() &&
                        item.status === 'active'
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
                    price += optionItem.price;
                    optionDocs.push(newOption.getChosenItem(optionItem._id));
                  });
                }
                const productToCreate = {
                  ...productStoring.product.toObject(),
                  ...productStoring.toObject(),
                  model_id: validModel._id,
                  price,
                  accompanied_product_price: accompaniedProductPrice,
                  accompanied_products,
                  id: productStoring.product_id,
                  _id: productStoring._id,
                  product_storing_id,
                  quantity:
                    type === SaleForms.Retail ? quantity : quantity * validModel.stock_per_box,
                  options: optionDocs,
                  model_name: validModel.name,
                  model_images: validModel.images || [],
                  model_list: productStoring.model_list,
                  refund_rate: validModel.refund_rate,
                  refund: validModel.refund,
                  total_refund_rate: validModel.total_refund_rate,
                  discount_rate: validModel.discount_rate,
                  discount: validModel.discount,
                  type,
                  box_price: type === SaleForms.Wholesale ? validModel.box_price : null,
                  box_quantity: type === SaleForms.Wholesale ? quantity : null
                };
                delete productToCreate.product; //???

                checkedProducts.push(productToCreate);
              }
            );
          });

          orderData.products = checkedProducts;
        }
        // Create new offline order
        const newOrder = await transactionHelper.withSession(async (session) => {
          const order = await orderServiceV2.createOffline(orderData, { //quan trong5
            session,
            needGetPrice: !without_product, //có sản phẩm thì lấy giá
            mustGotPromotionCode: !without_product,
            populate
          });

          await Promise.all([
            productStoringHandlerV2.updateStockFromOrder( //cứ mỗi 1 sp thì update số lượng sản phẩm, nếu là without stock thì k cần
              {         // nếu có accompanied_product thỉ sẽ duyệt qua mỗi sản phẩm và trừ đi số lượng sản phẩm tương ứng vào database
                order, // nếu sản phẩm hiện tại giới hạn số lượng và số lượng đang có cộng với số lượng order sản phẩm đó <0 trả về lỗi
                performedUser: { _id: seller_id, ...seller } // nếu số lượng của model bé hơn số lượng order hiện tại trả về lỗi
              },                                               //update lại số lượng của sản phảm(on_sale_stock,bax_stock,số lượng box)
              { session }                                       //tạo lịch sử cập nhập và lịch sử theo dõi sản phẩm
            ),
            companyService.updateWallet(
              { _id: company_id },
              { wallet: -order.total_refund, refund_fund: order.total_refund }
            )(session),
            companyHistoryService.create(
              {
                company_id,
                new_balance: companyWallet,
                type: companyHistoryService.type.refund_order,
                transaction_id: order._id,
                value: -order.total_refund
              },
              { session }
            )
          ]);

          return order;
        });

        withSafety(() => {
          orderFirestoreService.create(newOrder.code, {
            id: newOrder.id,
            status: newOrder.status,
            total: newOrder.total
          });
          companyActivityService.implicitCreate(CompanyActions.createOrder)(req, {
            object_id: newOrder.id
          });
          companyService.changeCount(company_id, { total_order: 1 });
          storeService.changeCount(store_id, { total_order: 1 });
        });

        return new BaseResponse({
          statusCode: 201,
          data: newOrder
        }).return(res);
      } catch (err) {
        next(err);
      }
    },
    async createOfflineFromCache(req, res, next) {
      try {
        const { id: seller_id, ...seller } = req.user;
        const { populate } = req.query;
        const { id: company_id, wallet: companyWallet, store_id, is_owner } = req.company;
        const { order_caching_id: cachingId, note: company_note } = req.body;

        // Create new offline order
        const newOrder = await transactionHelper.withSession(async (session) => {
          // Check if order caching exists or not
          const query = {
            _id: cachingId,
            company_id,
            status: 'pending',
            ...(!is_owner ? { store_id } : {})
          };
          let orderCaching = null;
          orderCaching = await orderCachingService.getNewest(query, null, { session });
          if (!orderCaching) {
            throw new BaseError({
              statusCode: 404,
              error: errorCode.client,
              errors: { order_caching_id: errorCode['client.orderNotExist'] }
            });
          }

          const {
            _id,
            id,
            createdAt,
            updatedAt,
            status,
            __v,
            ...orderData
          } = orderCaching.toObject();
          // Save latest user's id who created this order as seller
          orderData.seller_id = seller_id;
          orderData.company_note = company_note;

          const order = await orderServiceV2.createOffline(orderData, {
            session,
            needGetPrice: !orderData.without_product,
            mustGotPromotionCode: !orderData.without_product,
            populate
          });

          // Update orderCaching, stock from storing, company wallet and create history
          orderCaching.is_confirmed = true;
          orderCaching.status = 'handling';
          await Promise.all([
            orderCaching.save({ session }),
            productStoringHandlerV2.updateStockFromOrder(
              {
                order,
                performedUser: { _id: seller_id, ...seller }
              },
              { session }
            ),
            companyService.updateWallet(
              { _id: company_id },
              { wallet: -order.total_refund, refund_fund: order.total_refund }
            )(session),
            companyHistoryService.create(
              {
                company_id,
                new_balance: companyWallet,
                type: companyHistoryService.type.refund_order,
                transaction_id: order._id,
                value: -order.total_refund
              },
              { session }
            )
          ]);

          return order;
        });

        // CREATE COMPANY ACTIVITY
        withSafety(() => {
          orderFirestoreService.create(newOrder.code, {
            id: newOrder.id,
            status: newOrder.status,
            total: newOrder.total
          });
          companyActivityService.implicitCreate(CompanyActions.createOrder)(req, {
            object_id: newOrder.id
          });
          companyService.changeCount(newOrder.company_id, { total_order: 1 });
          storeService.changeCount(newOrder.store_id, { total_order: 1 });
        });

        return new BaseResponse({
          statusCode: 201,
          data: newOrder
        }).return(res);
      } catch (err) {
        next(err);
      }
    },
    async update(req, res, next) {
      try {
        const {
          params: { id: orderId },
          company: { id: company_id, store_id, is_owner },
          body: { status: newStatus, note: company_note, position = '' }
        } = req;
        const query = { _id: orderId, company_id };
        if (!is_owner) {
          query.store_id = store_id;
        }

        // Validate if newStatus in ['company_canceled', 'user_canceled', 'user_rejected']
        if (
          [Statuses.CompanyCanceled, Statuses.UserCanceled, Statuses.UserRejected].includes(
            newStatus
          ) &&
          !company_note
        ) {
          throw new BaseError({
            statusCode: 400,
            error: errorCode.client,
            errors: {
              note: errorCode['any.invalid']
            },
            message: `note is required when status is ${newStatus}`
          });
        }

        const updatedOrder = await transactionHelper.withSession(async (session) => {
          // Check if order exists or not
          let order = await orderServiceV2.findOneExists(query, null, {
            populate: 'user',
            session
          });
          // Check if updating reverse status
          const currentStatus = order.status;
          if (!StatusesFrom[newStatus].includes(currentStatus)) {
            throw new BaseError({
              statusCode: 400,
              error: errorCode.client,
              errors: {
                status: errorCode['any.invalid']
              },
              message: `can not update status from ${currentStatus} to ${newStatus}`
            });
          }

          if (
            [Statuses.CompanyCanceled, Statuses.UserCanceled, Statuses.UserRejected].includes(
              newStatus
            )
          ) {
            order = await orderHandlerV2.handleCancel(
              {
                order,
                user: order.user,
                staff: req.company,
                updates: { status: newStatus, company_note, position }
              },
              { session }
            );
          } else {
            // Update order
            mergeObject(order, { status: newStatus, company_note, position });
            await order.save({ session });
          }
          return order;
        });

        // CREATE COMPANY ACTIVITY
        withSafety(() => {
          orderFirestoreService.update(updatedOrder.code, {
            id: updatedOrder.id,
            status: updatedOrder.status,
            total: updatedOrder.total
          });
          companyActivityService.implicitCreate(CompanyActions.updateOrder)(req, {
            object_id: updatedOrder.id
          });
        });

        return new BaseResponse({ statusCode: 200, data: updatedOrder }).return(res);
      } catch (err) {
        return next(err);
      }
    },
    async getStatistics(req, res, next) {
      try {
        const { id: company_id, store_id, is_owner } = req.company;
        const {
          limit,
          type = StatisticTypes.CompletedDay,
          date_from,
          date_to,
          ...query
        } = req.query;
        query.company_id = company_id;
        query.status = Statuses.Completed;
        if (!is_owner) {
          query.store_id = store_id;
        }
        Object.assign(
          query,
          getDateRangeQuery('createdAt', { fromDate: date_from, toDate: date_to })
        );

        const statistics = await orderModel
          .aggregate()
          .match(query)
          .group({
            _id: `$${type}`,
            orders: { $push: '$$ROOT' },
            total_order: { $sum: 1 },
            total_service_fee: { $sum: '$total_service_fee' },
            total_transport_fee: { $sum: '$transport_fee' }
          })
          .addFields({
            offline_orders: {
              $filter: {
                input: '$orders',
                as: 'order',
                cond: { $eq: ['$$order.type', Types.Offline] }
              }
            },
            online_orders: {
              $filter: {
                input: '$orders',
                as: 'order',
                cond: { $eq: ['$$order.type', Types.Online] }
              }
            }
          })
          .project({
            key: '$_id',
            total_order: 1,
            total_online_order: { $size: '$online_orders' },
            total_offline_order: { $size: '$offline_orders' },
            total_service_fee: 1,
            total_transport_fee: 1
          });

        return new BaseResponse({ statusCode: 200, data: statistics }).return(res);
      } catch (err) {
        return next(err);
      }
    }
  },
  mall: {},
  admin: {}
};
