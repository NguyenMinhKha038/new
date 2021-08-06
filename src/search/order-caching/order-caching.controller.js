import Promise from 'bluebird';
import {
  BaseError,
  BaseResponse,
  currencyFormat,
  errorCode,
  getDate,
  mergeObject,
  selectToPopulate
} from '../../commons/utils';
import orderCachingService from './order-caching.service';
import { PopulatedFields, SaleForms, Statuses, Types } from '../order/v2/order.config';
import { getDateRangeQuery } from '../../commons/utils/utils';
import storeService from '../store/store.service';
import settingService from '../setting/setting.service';
import productStoringService from '../product-storing/product-storing.service';
import productStoringServiceV2 from '../product-storing/v2/product-storing.service';
import orderCachingFirestoreService from './order-caching-firestore.service';
import { promotionCodeServiceV2 } from '../promotion-code/v2/promotion-code.service';
import { ModelStatuses } from '../product-storing/v2/product-storing.config';
import orderHelper from '../order/order.helper';
import { detachJob } from '../../commons/utils/detach-job';
import sellingOptionService from '../selling-option/selling-option.service';

export default {
  user: {
    async getById(req, res, next) {
      try {
        const {
          user: { id: userId },
          params: { id: orderId },
          query: { select, populate: populatedStr }
        } = req;
        const { populate } = selectToPopulate(populatedStr, PopulatedFields);

        const query = { _id: orderId, user_id: userId };
        let order = await orderCachingService.findOneActive(query, select, { populate });

        if (order) {
          order = order.removeFields(['company_notes', 'company_note']);
        }

        return new BaseResponse({ statusCode: 200, data: order }).return(res);
      } catch (err) {
        return next(err);
      }
    },
    async getByCode(req, res, next) {
      try {
        const {
          user: { id: userId },
          params: { code },
          query: { select, populate: populatedStr }
        } = req;
        const { populate } = selectToPopulate(populatedStr, PopulatedFields);

        const query = { code, user_id: userId };
        let order = await orderCachingService.findOneActive(query, select, {
          populate
        });
        if (order) {
          order = order.removeFields(['company_notes', 'company_note']);
        }

        return new BaseResponse({ statusCode: 200, data: order }).return(res);
      } catch (err) {
        return next(err);
      }
    },
    async getRefresh(req, res, next) {
      try {
        const {
          user: { id: userId },
          params: { id: orderId },
          query: { select, populate: populatedStr }
        } = req;
        let { populate } = selectToPopulate(populatedStr, PopulatedFields);

        const query = {
          _id: orderId,
          user_id: userId,
          status: 'pending'
        };
        let order = await orderCachingService.getNewest(query, select, { populate });
        if (order) {
          order = order.removeFields(['company_notes', 'company_note']);
        }

        return new BaseResponse({ statusCode: 200, data: order }).return(res);
      } catch (err) {
        return next(err);
      }
    },
    async createOffline(req, res, next) {
      try {
        const { id: user_id, ...user } = req.user;
        const { populate } = req.query;
        const {
          store_id,
          products: productsFromOrder,
          note,
          position,
          is_created_from_menu
        } = req.body;

        // Check if store exists or not
        const store = await storeService.findOneEnsure({ _id: store_id, status: 'active' });

        // Check ordered products
        const pStoringIdsFromOrder = productsFromOrder.map((product) => product.product_storing_id);
        const productsFromStore = await productStoringServiceV2.findManyActive(
          {
            _id: { $in: pStoringIdsFromOrder },
            store_id,
            in_menu: !!is_created_from_menu
          },
          null,
          { populate: 'product options.option' }
        );

        const detachedProducts = detachJob(productsFromOrder);
        let productsToCreate = [];

        await Promise.mapSeries(detachedProducts, async (detachedProduct) => {
          await Promise.map(detachedProduct, async (product) => {
            const { quantity, model_id, accompanied_products = [], options = [], type } = product;
            const exists = productsFromStore.find(
              (prod) =>
                prod._id.toString() === product.product_storing_id &&
                ((type === SaleForms.Retail && prod.on_sales_stock > product.quantity) ||
                  (type === SaleForms.Wholesale && prod.os_box_stock > product.quantity) ||
                  !prod.is_limited_stock)
            );

            if (!exists) {
              throw new BaseError({
                statusCode: 404,
                error: errorCode.client,
                errors: { product: errorCode['client.productNotExistInStore'] },
                message: 'product not exist in store or not enough quantity'
              });
            }

            const productStoring = exists;

            if (type === SaleForms.Wholesale && !productStoring.has_wholesale) {
              throw new BaseError({
                statusCode: 400,
                error: errorCode.client,
                errors: {
                  sale_form: errorCode['client.cannotOrderWholesale']
                }
              });
            }

            const validModel = productStoring.model_list.find(
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

            if (type === SaleForms.Wholesale && !validModel.box_price) {
              throw new BaseError({
                statusCode: 400,
                error: errorCode.client,
                errors: {
                  price: errorCode['client.hasNoBoxPrice']
                }
              });
            }

            let price =
              type === SaleForms.Retail
                ? validModel.price
                : Math.ceil(validModel.box_price / validModel.stock_per_box);
            let optionDocs = [];
            let accompaniedProductPrice;

            if (accompanied_products.length) {
              accompaniedProductPrice = await orderHelper.v3.helperAccompaniedProduct({
                accompanied_products,
                productStoring
              });
            }

            if (options && options.length) {
              const pStoring = { ...productStoring.toObject() };
              options.forEach((option) => {
                const productStoringOption = productStoring.options.find(
                  (item) =>
                    item.option_id.toString() === option.type_option_id.toString() &&
                    item.status === 'active'
                );
                if (!productStoringOption) {
                  throw new BaseError({
                    statusCode: 400,
                    error: errorCode.client,
                    errors: {
                      selection: errorCode['client.sellingSelectionNotFound']
                    }
                  });
                }
                const newOption = sellingOptionService.generate(
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
                const optionItem = pStoringOption.option.options.find(
                  (item) =>
                    item._id.toString() === option.option_id.toString() && item.status === 'active'
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
              ...exists.product.toObject(),
              ...exists.toObject(),
              id: exists.product._id,
              _id: exists._id,
              ...product,
              options: optionDocs,
              model_id: validModel._id,
              price,
              accompanied_product_price: accompaniedProductPrice,
              quantity: type === SaleForms.Retail ? quantity : quantity * validModel.stock_per_box,
              accompanied_products,
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
            delete productToCreate.product;

            productsToCreate.push(productToCreate);
          });
        });

        // Create order
        const orderData = {
          company_id: store.company_id,
          store_id,
          user_id,
          is_created_from_menu,
          type: Types.Offline,
          note,
          position,
          products: productsToCreate
        };

        // Create new offline order
        const newOrder = await orderCachingService.createOffline(orderData, {
          needGetPrice: true,
          populate
        });

        orderCachingFirestoreService.create(newOrder.code, {
          id: newOrder.id,
          status: newOrder.status,
          total: newOrder.total
        });

        return new BaseResponse({
          statusCode: 201,
          data: newOrder
        }).return(res);
      } catch (err) {
        return next(err);
      }
    },
    async updateOffline(req, res, next) {
      try {
        const { id: orderId } = req.params;
        const { populate: populatedStr } = req.query;
        const { id: user_id, ...user } = req.user;
        const { ...updates } = req.body;

        const { populate } = selectToPopulate(populatedStr, PopulatedFields);

        // Check if order exists or not
        let order = await orderCachingService.findOneExists({
          _id: orderId,
          user_id,
          status: 'pending'
        });
        const is_created_from_menu = order.is_created_from_menu;
        const store_id = order.store_id;
        const productsFromOrder = updates.products || order.products;

        if (updates.status === Statuses.UserCanceled) {
          order.status = updates.status;
          order.note = updates.note;
          order.products.forEach((product) => {
            // Restore promotion_code
            if (product.promotion_code_id) {
              promotionCodeServiceV2.autoGetV2(
                {
                  company_id: product.company_id,
                  store_id: product.store_id,
                  product_id: product.id,
                  apply_count: 0,
                  promotion_code_id: product.promotion_code_id,
                  model_id: product.model_id
                },
                {}
              );
            }
          });
        } else {
          // Check ordered products
          const pStoringIdsFromOrder = productsFromOrder.map((product) =>
            product.product_storing_id.toString()
          );
          const productsFromStore = await productStoringServiceV2.findManyActive(
            {
              _id: { $in: pStoringIdsFromOrder },
              store_id,
              in_menu: !!is_created_from_menu
            },
            null,
            { populate: 'product options.option' }
          );

          const detachedProducts = detachJob(productsFromOrder);
          let productsToCreate = [];
          await Promise.mapSeries(detachedProducts, async (detachedProduct) => {
            await Promise.map(detachedProduct, async (product) => {
              const { quantity, model_id, accompanied_products = [], options = [], type } = product;
              const exists = productsFromStore.find(
                (prod) =>
                  prod._id.toString() === product.product_storing_id &&
                  ((type === SaleForms.Retail && prod.on_sales_stock > product.quantity) ||
                    (type === SaleForms.Wholesale && prod.os_box_stock > product.quantity) ||
                    !prod.is_limited_stock)
              );

              if (!exists) {
                throw new BaseError({
                  statusCode: 404,
                  error: errorCode.client,
                  errors: { product: errorCode['client.productNotExistInStore'] },
                  message: 'product not exist in store or not enough quantity'
                });
              }

              const productStoring = exists;

              if (type === SaleForms.Wholesale && !productStoring.has_wholesale) {
                throw new BaseError({
                  statusCode: 400,
                  error: errorCode.client,
                  errors: {
                    sale_form: errorCode['client.cannotOrderWholesale']
                  }
                });
              }

              const validModel = productStoring.model_list.find(
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

              if (type === SaleForms.Wholesale && !validModel.box_price) {
                throw new BaseError({
                  statusCode: 400,
                  error: errorCode.client,
                  errors: {
                    price: errorCode['client.hasNoBoxPrice']
                  }
                });
              }

              let price =
                type === SaleForms.Retail
                  ? validModel.price
                  : Math.ceil(validModel.box_price / validModel.stock_per_box);
              let optionDocs = [];
              let accompaniedProductPrice;

              if (accompanied_products.length) {
                accompaniedProductPrice = await orderHelper.v3.helperAccompaniedProduct({
                  accompanied_products,
                  productStoring
                });
              }

              if (options && options.length) {
                const pStoring = { ...productStoring.toObject() };
                options.forEach((option) => {
                  const productStoringOption = productStoring.options.find(
                    (item) =>
                      item.option_id.toString() === option.type_option_id.toString() &&
                      item.status === 'active'
                  );
                  if (!productStoringOption) {
                    throw new BaseError({
                      statusCode: 400,
                      error: errorCode.client,
                      errors: {
                        selection: errorCode['client.sellingSelectionNotFound']
                      }
                    });
                  }
                  const newOption = sellingOptionService.generate(
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
                  const optionItem = pStoringOption.option.options.find(
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
                ...exists.product.toObject(),
                ...exists.toObject(),
                id: exists.product._id,
                _id: exists._id,
                ...product,
                options: optionDocs,
                model_id: validModel._id,
                price,
                accompanied_product_price: accompaniedProductPrice,
                accompanied_products,
                quantity:
                  type === SaleForms.Retail ? quantity : quantity * validModel.stock_per_box,
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
              delete productToCreate.product;

              productsToCreate.push(productToCreate);
            });
          });

          updates.products = productsToCreate;
          // Update order
          mergeObject(order, updates);
          // Add field `detail` for calculate promotion, do not put [1] below [2]
          order.products.forEach((product) => {
            product.storing_detail = product;
          }); // [2]
          await order.getPriceV3();
        }

        await order.save();
        if (populate) {
          order = await order.populate(populate).execPopulate();
        }

        orderCachingFirestoreService.update(order.code, {
          without_product: false,
          status: order.status,
          total: order.total
        });

        return new BaseResponse({
          statusCode: 200,
          data: order
        }).return(res);
      } catch (err) {
        return next(err);
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
        const order = await orderCachingService.findOne(query, select, { populate });

        return new BaseResponse({ statusCode: 200, data: order }).return(res);
      } catch (err) {
        return next(err);
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
        const order = await orderCachingService.findOne(query, select, { populate });
        return new BaseResponse({ statusCode: 200, data: order }).return(res);
      } catch (err) {
        return next(err);
      }
    },
    async get(req, res, next) {
      try {
        const {
          company: { id: companyId, store_id, is_owner },
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
        if (!is_owner) {
          query.store_id = store_id;
        }

        const { populate } = selectToPopulate(populatedStr, PopulatedFields);
        const [orders, metadata] = await orderCachingService.findWithPagination({
          page,
          limit,
          select,
          sort,
          populate,
          query: {
            ...query,
            ...getDateRangeQuery('date', { fromDate: date_from, toDate: date_to }),
            ...getDateRangeQuery('expiresAt', {
              fromDate: expires_from,
              toDate: expires_to
            })
          }
        });
        return new BaseResponse({ statusCode: 200, data: orders }).addMeta(metadata).return(res);
      } catch (err) {
        return next(err);
      }
    },
    async getRefresh(req, res, next) {
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
          status: 'pending',
          ...(store_id ? { store_id } : {})
        };
        const order = await orderCachingService.getNewest(query, select, { populate });

        return new BaseResponse({ statusCode: 200, data: order }).return(res);
      } catch (err) {
        return next(err);
      }
    },
    async createOffline(req, res, next) {
      try {
        const { id: seller_id, ...seller } = req.user;
        const { populate } = req.query;
        const { id: company_id, store_id: userStoreId, is_owner } = req.company;
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
          const detachedProducts = detachJob(productsFromOrder);
          let checkedProducts = [];
          await Promise.mapSeries(detachedProducts, async (product) => {
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
                  ((type === SaleForms.Retail && productStoring.on_sales_stock - quantity < 0) ||
                    (type === SaleForms.Wholesale && productStoring.os_box_stock - quantity < 0))
                ) {
                  throw new BaseError({
                    statusCode: 400,
                    error: errorCode.client,
                    errors: {
                      stock: errorCode['client.outOfStock']
                    }
                  });
                }

                if (type === SaleForms.Wholesale && !productStoring.has_wholesale) {
                  throw new BaseError({
                    statusCode: 400,
                    error: errorCode.client,
                    errors: {
                      sale_form: errorCode['client.cannotOrderWholesale']
                    }
                  });
                }

                const validModel = productStoring.model_list.find(
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

                if (type === SaleForms.Wholesale && !validModel.box_price) {
                  throw new BaseError({
                    statusCode: 400,
                    error: errorCode.client,
                    errors: {
                      price: errorCode['client.hasNoBoxPrice']
                    }
                  });
                }

                let price =
                  type === SaleForms.Retail
                    ? validModel.price
                    : Math.ceil(validModel.box_price / validModel.stock_per_box);
                let optionDocs = [];
                let accompaniedProductPrice;

                if (accompanied_products.length) {
                  accompaniedProductPrice = await orderHelper.v3.helperAccompaniedProduct({
                    accompanied_products,
                    productStoring
                  });
                }

                if (options && options.length) {
                  const pStoring = { ...productStoring.toObject() };
                  options.forEach((option) => {
                    const productStoringOption = productStoring.options.find(
                      (item) =>
                        item.option_id.toString() === option.type_option_id.toString() &&
                        item.status === 'active'
                    );
                    if (!productStoringOption) {
                      throw new BaseError({
                        statusCode: 400,
                        error: errorCode.client,
                        errors: {
                          selection: errorCode['client.sellingSelectionNotFound']
                        }
                      });
                    }
                    const newOption = sellingOptionService.generate(
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
                    const optionItem = pStoringOption.option.options.find(
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
                  id: productStoring.product_id,
                  _id: productStoring._id,
                  product_storing_id,
                  quantity:
                    type === SaleForms.Retail ? quantity : quantity * validModel.stock_per_box,
                  options: optionDocs,
                  accompanied_products,
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
                delete productToCreate.product;

                checkedProducts.push(productToCreate);
              }
            );
          });

          orderData.products = checkedProducts;
        }

        // Create new offline order
        const newOrder = await orderCachingService.createOffline(orderData, {
          needGetPrice: !without_product,
          populate
        });

        orderCachingFirestoreService.create(newOrder.code, {
          id: newOrder.id,
          status: newOrder.status,
          total: newOrder.total
        });

        return new BaseResponse({
          statusCode: 201,
          data: newOrder
        }).return(res);
      } catch (err) {
        return next(err);
      }
    },
    async updateOffline(req, res, next) {
      try {
        const { id: orderId } = req.params;
        const { populate: populatedStr } = req.query;
        const { id: seller_id, ...seller } = req.user;
        const { id: company_id, store_id, is_owner } = req.company;
        const { populate } = selectToPopulate(populatedStr, PopulatedFields);

        // Check if order exists or not
        const query = {
          _id: orderId,
          type: Types.Offline,
          status: 'pending',
          company_id,
          ...(!is_owner ? { store_id } : {})
        };
        const order = await orderCachingService.findOneExists(query);
        // Get new info from store & setting
        const [store, setting] = await Promise.all([
          storeService.findActive({
            _id: store_id || order.store_id,
            company_id
          }),
          settingService.get(company_id)
        ]);
        const {
          without_product = order.without_product,
          total: preCalTotal = order.total,
          products: productsFromOrder = order.products,
          position = order.position,
          note: company_note,
          status
        } = req.body;

        // Handle updates
        if (
          [Statuses.UserCanceled, Statuses.UserRejected, Statuses.CompanyCanceled].includes(status)
        ) {
          order.status = status;
          order.company_note = company_note;

          order.products.forEach((product) => {
            // Restore promotion_code
            if (product.promotion_code_id) {
              promotionCodeServiceV2.autoGetV2(
                {
                  company_id: product.company_id,
                  store_id: product.store_id,
                  product_id: product.id,
                  apply_count: 0,
                  promotion_code_id: product.promotion_code_id,
                  model_id: product.model_id
                },
                {}
              );
            }
          });
        } else if (without_product) {
          const withoutProductRates =
            setting.order_without_product_rate
              .sort((r1, r2) => -r1.from + r2.from)
              .find((r) => r.from <= preCalTotal) || {};
          const { refund_rate = 0, discount_rate = 0 } = withoutProductRates;
          order.refund_rate = refund_rate;
          order.discount_rate = discount_rate;
          order.total_refund = preCalTotal * order.refund_rate;
          order.total_discount = preCalTotal * order.discount_rate;
          order.total = preCalTotal - order.total_discount;
          order.original_total = preCalTotal;
          order.products = [];
        } else {
          // Check if products from order all exist & enough quantity
          const detachedProducts = detachJob(productsFromOrder);
          let checkedProducts = [];
          await Promise.mapSeries(detachedProducts, async (product) => {
            await Promise.map(
              product,
              async ({
                product_storing_id,
                quantity,
                accompanied_products = [],
                options = [],
                model_id,
                type
              }) => {
                const productStoring = await productStoringService.findActive({
                  _id: product_storing_id,
                  store_id: order.store_id,
                  populate: 'product options.option'
                });
                if (
                  productStoring.is_limited_stock &&
                  ((type === SaleForms.Retail && productStoring.on_sales_stock - quantity < 0) ||
                    (type === SaleForms.Wholesale && productStoring.os_box_stock - quantity < 0))
                ) {
                  throw new BaseError({
                    statusCode: 400,
                    error: errorCode.client,
                    errors: {
                      stock: errorCode['client.outOfStock']
                    }
                  });
                }

                if (type === SaleForms.Wholesale && !productStoring.has_wholesale) {
                  throw new BaseError({
                    statusCode: 400,
                    error: errorCode.client,
                    errors: {
                      sale_form: errorCode['client.cannotOrderWholesale']
                    }
                  });
                }

                const validModel = productStoring.model_list.find(
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

                if (type === SaleForms.Wholesale && !validModel.box_price) {
                  throw new BaseError({
                    statusCode: 400,
                    error: errorCode.client,
                    errors: {
                      price: errorCode['client.hasNoBoxPrice']
                    }
                  });
                }

                let price =
                  type === SaleForms.Retail
                    ? validModel.price
                    : Math.ceil(validModel.box_price / validModel.stock_per_box);
                let optionDocs = [];
                let accompaniedProductPrice;

                if (accompanied_products.length) {
                  accompaniedProductPrice = await orderHelper.v3.helperAccompaniedProduct({
                    accompanied_products,
                    productStoring
                  });
                }

                if (options && options.length) {
                  const pStoring = { ...productStoring.toObject() };
                  options.forEach((option) => {
                    const productStoringOption = productStoring.options.find(
                      (item) =>
                        item.option_id.toString() === option.type_option_id.toString() &&
                        item.status === 'active'
                    );
                    if (!productStoringOption) {
                      throw new BaseError({
                        statusCode: 400,
                        error: errorCode.client,
                        errors: {
                          selection: errorCode['client.sellingSelectionNotFound']
                        }
                      });
                    }
                    const newOption = sellingOptionService.generate(
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
                    const optionItem = pStoringOption.option.options.find(
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

                const productToUpdate = {
                  ...productStoring.product.toObject(),
                  ...productStoring.toObject(),
                  id: productStoring.product_id,
                  _id: productStoring._id,
                  product_storing_id,
                  quantity:
                    type === SaleForms.Retail ? quantity : quantity * validModel.stock_per_box,
                  options: optionDocs,
                  model_id: validModel._id,
                  price,
                  accompanied_product_price: accompaniedProductPrice,
                  accompanied_products,
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
                delete productToUpdate.product;

                checkedProducts.push(productToUpdate);
              }
            );
          });

          // Add field `detail` for calculate promotion, do not put [1] below [2]
          order.products = checkedProducts; // [1]
          order.products.forEach((product) => {
            product.storing_detail = product;
          }); // [2]
          await order.getPriceV3();
        }

        // Update order
        order.position = position;
        order.company_note = company_note;
        order.without_product = without_product;
        order.position = position;
        let updatedOrder = await order.save();
        if (populate) {
          updatedOrder = await updatedOrder.populate(populate).execPopulate();
        }

        orderCachingFirestoreService.update(updatedOrder.code, {
          without_product: updatedOrder.without_product,
          status: updatedOrder.status,
          total: updatedOrder.total
        });

        return new BaseResponse({
          statusCode: 200,
          data: updatedOrder
        }).return(res);
      } catch (err) {
        return next(err);
      }
    }
  },
  admin: {
    async getById(req, res, next) {
      try {
        const {
          params: { id: orderId },
          query: { select, populate: populatedStr }
        } = req;
        const { populate } = selectToPopulate(populatedStr, PopulatedFields);
        const order = await orderCachingService.findOne(
          {
            _id: orderId
          },
          select,
          { populate }
        );
        return new BaseResponse({ statusCode: 200, data: order }).return(res);
      } catch (err) {
        return next(err);
      }
    },
    async getByCode(req, res, next) {
      try {
        const {
          params: { code },
          query: { select, populate: populatedStr }
        } = req;
        const { populate } = selectToPopulate(populatedStr, PopulatedFields);

        const order = await orderCachingService.findOne({ code }, select, { populate });
        return new BaseResponse({ statusCode: 200, data: order }).return(res);
      } catch (err) {
        return next(err);
      }
    },
    async get(req, res, next) {
      try {
        const {
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

        const { populate } = selectToPopulate(populatedStr, PopulatedFields);
        const [orders, metadata] = await orderCachingService.findWithPagination({
          page,
          limit,
          select,
          sort,
          populate,
          query: {
            ...query,
            ...getDateRangeQuery('date', { fromDate: date_from, toDate: date_to }),
            ...getDateRangeQuery('expiresAt', {
              fromDate: expires_from,
              toDate: expires_to
            })
          }
        });
        return new BaseResponse({ statusCode: 200, data: orders }).addMeta(metadata).return(res);
      } catch (err) {
        return next(err);
      }
    }
  }
};
