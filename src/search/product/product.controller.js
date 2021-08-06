import Promise from 'bluebird';
import {
  BaseError,
  BaseResponse,
  errorCode,
  logger,
  mergeObject,
  splitString,
  withSafety,
  withSession
} from '../../commons/utils';
import addressService from '../address/address.service';
import { Types as BehaviorTypes } from '../behavior/behavior.config';
import behaviorService from '../behavior/behavior.service';
import categoryService from '../category/category.service';
import companyService from '../company/company.service';
import logisticsService from '../logistics/logistics.service';
import baseLogistics from '../logistics/provider/base-logistics';
import notificationService from '../notification/notification.service';
import productStockHistoryService from '../product-stock-history/product-stock-history.service';
import productStoringHandler from '../product-storing/product-storing.handler';
import productStoringService from '../product-storing/product-storing.service';
import settingService from '../setting/setting.service';
import statisticService from '../statistic/statistic.service';
import storeService from '../store/store.service';
import productService from './product.service';
import adminActivityService from '../../commons/admin-activity/admin-activity.service';
import companyActivityService from '../company-activity/company-activity.service';
import { CompanyActions } from '../company-activity/company-activity.config';
import { getDistance } from 'geolib';
import promotionService from '../promotion/promotion.service';
import { CompanySensitiveExcludes } from '../company/company.config';
import { omit } from 'lodash';
const ReactionTypes = BehaviorTypes.Reaction;
import { Types } from 'mongoose';
import { Statuses } from './v2/product.config';
import warehouseStoringService from '../warehouse-storing/warehouse-storing.service';
import mallStoringService from '../sum-mall/mall-storing/mall-storing.service';
import productHandler from './v2/product.handler';

export default {
  async get(req, res, next) {
    try {
      const {
        limit,
        page,
        select,
        sort,
        updated_from,
        updated_to,
        created_from,
        created_to,
        ...query
      } = req.query;
      if (query.category_id) {
        query.$or = [
          { type_category_id: query.category_id },
          { company_category_id: query.category_id },
          { sub_category_id: query.category_id }
        ];
        delete query.category_id;
      }
      if (updated_from || updated_to) {
        query.company_updated_at = {};
        updated_from && (query.company_updated_at['$gte'] = new Date(updated_from));
        updated_to && (query.company_updated_at['$lte'] = new Date(updated_to));
      }
      if (created_from || created_to) {
        query.createdAt = {};
        created_from && (query.createdAt['$gte'] = new Date(created_from));
        created_to && (query.createdAt['$lte'] = new Date(created_to));
      }
      const [products, count] = await Promise.all([
        productService.find({
          limit,
          page,
          select,
          sort,
          is_active_company: true,
          status: 'approved',
          ...query,
          populate: [
            {
              path: 'productStorings',
              match: { is_active_store: true },
              populate: [{ path: 'store' }]
            },
            // ...(req.user ? [{ path: 'reaction', select: ' favorite like share shares_count view views_count', match: { user_id: req.user.id } }] : []),
            { path: 'company', select: CompanySensitiveExcludes },
            {
              path: 'promotion',
              match: {
                start_at: { $lt: new Date() },
                expire_at: { $gt: new Date() },
                status: 'active'
              }
            }
          ]
        }),
        limit && productService.count({ ...query, is_active_company: true, status: 'approved' })
      ]);
      const total_page = limit && Math.ceil(count / limit);
      return new BaseResponse({ statusCode: 200, data: products })
        .addMeta({ total_page, total: count })
        .return(res);
    } catch (error) {
      next(error);
    }
  },
  async getTop(req, res, next) {
    try {
      const { limit = 20, category_ids, type } = req.query;
      const categoryList = splitString(category_ids);
      const categories = await categoryService.find({ _id: categoryList, type });
      const data = {};
      await Promise.map(categories, async (category) => {
        const query = mergeObject(
          type === 1
            ? { type_category_id: category._id }
            : type === 2
            ? { company_category_id: category._id }
            : { sub_category_id: category._id }
        );
        const products = await productService.find({
          ...query,
          sort: '-views_count',
          limit,
          status: 'approved',
          is_active_company: true
        });
        data[category.id] = products;
      });
      return new BaseResponse({ statusCode: 200, data }).return(res);
    } catch (error) {
      next(error);
    }
  },
  async getById(req, res, next) {
    try {
      const { id } = req.params;
      let [product, productStorings, promotions, address] = await Promise.all([
        productService.findActive({ _id: id }, null, {
          populate: [
            { path: 'company', select: CompanySensitiveExcludes },
            ...(req.user
              ? [
                  {
                    path: 'reaction',
                    select: ' favorite like share shares_count view views_count',
                    match: { user_id: req.user.id }
                  }
                ]
              : []),
            {
              path: 'promotion',
              match: {
                start_at: { $lt: new Date() },
                expire_at: { $gt: new Date() },
                active: true
              }
            }
          ]
        }),
        productStoringService.find({
          query: { product_id: id, active: true, is_active_store: true, is_active_company: true },
          populate: 'store'
        }),
        promotionService.mFind({
          product_ids: id,
          expire_at: { $gte: new Date() },
          start_at: { $lte: new Date() },
          status: 'active'
        }),
        req.user &&
          addressService.findOne({ user_id: req.user.id }, null, {
            sort: '-is_default'
          })
      ]);
      // assign promotion
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

      if (!address) {
        address = addressService.getDefaultAddress();
      }
      productStorings = await Promise.map(
        productStorings,
        (productStoring) => {
          return getDistances({
            address,
            store: productStoring.store,
            productStoring
          });
        }
        // { concurrency: 5 }
      );

      product.productStorings = productStorings
        .sort((a, b) => -a.refund + b.refund)
        .filter((productStoring) => !productStoring.is_limited_stock || productStoring.stock > 0);
      productService.viewUp({
        product,
        ip: req.headers['x-forwarded-for'],
        user: req.user
      });
      return new BaseResponse({ statusCode: 200, data: product }).return(res);
    } catch (error) {
      next(error);
    }
  },
  async getTransportFee(req, res, next) {
    try {
      const { product_id, company_id } = req.query;
      let [
        product,
        productStorings,
        address,
        logistics,
        { discount_transport }
      ] = await Promise.all([
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
        req.user &&
          addressService.findOne({ user_id: req.user.id }, null, {
            sort: '-is_default'
          }),
        logisticsService.find({ company_id, status: 'active' }),
        settingService.get(company_id)
      ]);
      const validDiscounts = discount_transport
        .filter((discount) => discount.status === 'active')
        .sort((a, b) => b.order_value - a.order_value);
      if (!address) {
        address = addressService.getDefaultAddress();
      }
      const response = {};
      productStorings = productStorings
        .sort((a, b) => -a.refund + b.refund)
        .filter((productStoring) => !productStoring.is_limited_stock || productStoring.stock > 0);
      await Promise.map(productStorings, async (productStoring) => {
        response[productStoring.id] = await getTransportFee({
          address,
          discount_transport,
          store: productStoring.store,
          product: product,
          productStoring,
          logistics,
          validDiscounts
        });
      });
      return new BaseResponse({ statusCode: 200, data: response })
        .addMeta({ valid_discounts: validDiscounts, address, logistics })
        .return(res);
    } catch (error) {
      next(error);
    }
  },
  company: {
    async get(req, res, next) {
      try {
        const {
          limit,
          page,
          select,
          sort,
          product_ids,
          text,
          updated_from,
          updated_to,
          created_from,
          created_to,
          store_id,
          ...query
        } = req.query;

        const { id: company_id } = req.company;

        query.company_id = company_id;
        if (product_ids) {
          query._id = { $in: product_ids };
        }
        if (text) {
          query['$text'] = { $search: text };
        }
        if (updated_from || updated_to) {
          query.company_updated_at = {};
          updated_from && (query.company_updated_at['$gte'] = new Date(updated_from));
          updated_to && (query.company_updated_at['$lte'] = new Date(updated_to));
        }
        if (created_from || created_to) {
          query.createdAt = {};
          created_from && (query.createdAt['$gte'] = new Date(created_from));
          created_to && (query.createdAt['$lte'] = new Date(created_to));
        }
        const [products, count] = await Promise.all([
          productService.find({
            limit,
            page,
            select,
            sort,
            populate: [
              {
                path: 'productStorings',
                ...(store_id ? { match: { store_id: store_id } } : {}),
                populate: [
                  {
                    path: 'store'
                  }
                ]
              },
              { path: 'company' },
              {
                path: 'category',
                select: 'name'
              },
              {
                path: 'company_category',
                select: 'name'
              },
              {
                path: 'sub_category',
                select: 'name'
              }
            ],
            ...query
          }),
          limit && productService.count(query)
        ]);
        const total_page = limit && Math.ceil(count / limit);
        return new BaseResponse({ statusCode: 200, data: products })
          .addMeta({ total_page, total: count })
          .return(res);
      } catch (error) {
        next(error);
      }
    },
    async getById(req, res, next) {
      try {
        const { id } = req.params;
        const { id: company_id } = req.company;
        const product = await productService.findOne({ company_id, _id: id }, null, {
          populate: [
            {
              path: 'productStorings',
              populate: [{ path: 'store' }]
            },
            {
              path: 'promotion',
              match: {
                start_at: { $lt: new Date() },
                expire_at: { $gt: new Date() }
              }
            },
            { path: 'company' },
            {
              path: 'category',
              select: 'name'
            },
            {
              path: 'company_category',
              select: 'name'
            },
            {
              path: 'sub_category',
              select: 'name'
            }
          ]
        });
        return new BaseResponse({ statusCode: 200, data: product }).return(res);
      } catch (error) {
        next(error);
      }
    },
    async post(req, res, next) {
      try {
        const { stock, category_id, original_price, ...newProduct } = req.body;
        const { id: company_id } = req.company;
        const { id: user_id, is_lucky } = req.user;

        if (is_lucky) {
          if (!original_price)
            throw new BaseError({
              statusCode: 400,
              error: errorCode.client,
              errors: { original_price: errorCode['any.required'] }
            });
        }

        const [stores, category] = await Promise.all([
          storeService.find({ company_id }),
          categoryService.findActive(category_id)
        ]);
        if (!stores.length) {
          throw new BaseError({
            error: errorCode.client,
            errors: { store: errorCode['client.storeNotExist'] },
            statusCode: 403
          });
        }
        if (category.type < 2)
          throw new BaseError({
            statusCode: 200,
            error: errorCode.client,
            errors: { category_type: errorCode['client.categoryTypeMustGreaterThanOne'] }
          });
        if (!req.company.online_sales && newProduct.transportable)
          throw new BaseError({
            statusCode: 400,
            error: errorCode.client,
            errors: { transportable: errorCode['client.companyIsOfflineSales'] }
          });
        const product = productService.generate({
          ...newProduct,
          is_new: true,
          company_id,
          type_category_id: category.type_category_id,
          company_category_id: category.company_category_id,
          sub_category_id: category.sub_category_id,
          user_id,
          is_active_company: req.company.status === 'approved',
          refund: newProduct.refund_rate * newProduct.price,
          //* Is Lucky
          ...(is_lucky
            ? { is_lucky, status: 'approved', original_price, refund: 0, refund_rate: 0 }
            : {})
        });
        await product.save();
        companyService.changeCount(company_id, { total_product: 1 });
        statisticService.update({ total_product: 1 });
        withSafety(() => {
          companyActivityService.implicitCreate(CompanyActions.addProduct)(req, {
            object_id: product._id
          });
        });
        return new BaseResponse({ statusCode: 200, data: product })
          .addMeta({ product_storing: [] })
          .return(res);
      } catch (error) {
        next(error);
      }
    },
    async put(req, res, next) {
      try {
        const { category_id, ...updateProduct } = req.body;
        const { id } = req.params;
        const { id: company_id } = req.company;
        if (!req.company.online_sales && updateProduct.transportable)
          throw new BaseError({
            statusCode: 400,
            error: errorCode.client,
            errors: { transportable: errorCode['client.companyIsOfflineSales'] }
          });
        const category = category_id && (await categoryService.findActive(category_id));
        if (category_id && category.type < 2)
          throw new BaseError({
            statusCode: 200,
            error: errorCode.client,
            errors: { category_type: errorCode['client.categoryTypeMustGreaterThanOne'] }
          });
        let productStoring;
        const product = await productService.update(
          { _id: id },
          {
            ...updateProduct,
            ...(category
              ? {
                  type_category_id: category.type_category_id,
                  company_category_id: category.company_category_id,
                  sub_category_id: category.sub_category_id
                }
              : {})
          }
        );
        withSafety(() => {
          companyActivityService.implicitCreate(CompanyActions.updateProductInfo)(req, {
            object_id: product._id
          });
        });
        return new BaseResponse({ statusCode: 200, data: product })
          .addMeta({ product_storing: productStoring })
          .return(res);
      } catch (error) {
        next(error);
      }
    },
    async upload(req, res, next) {
      try {
        let images;
        if (req.files.thumbnail && req.files.images) {
          images = {
            thumbnail: req.files.thumbnail.map((file) => file.path),
            images: req.files.images.map((file) => file.path)
          };
        } else
          images =
            req.files && req.files.thumbnail
              ? req.files.thumbnail.map((file) => file.path)
              : req.files.images.map((file) => file.path);
        return new BaseResponse({ statusCode: 200, data: images }).return(res);
      } catch (error) {
        next(error);
      }
    },
    async updateStock(req, res, next) {
      try {
        const update = req.body;
        const company = req.company;
        const baseQuery = {
          company_id: company._id
        };
        if (company.store_id) {
          baseQuery.store_id = company.store_id;
        }
        const productStorings = await Promise.map(
          update.productStorings,
          async (productStoring) => {
            const ps = await productStoringService.findOne({
              _id: productStoring.id,
              ...baseQuery
            });
            if (!ps) {
              throw new BaseError({
                statusCode: 400,
                error: errorCode.client,
                errors: { product: errorCode['client.productNotExist'] }
              });
            }
            if (ps.stock + productStoring.stock < 0) {
              throw new BaseError({
                statusCode: 400,
                error: errorCode.client,
                errors: { negativeStock: errorCode['client.stockCannotBeNegative'] }
              });
            }
            const result = await productStoringHandler.updateStock({
              from: ps,
              fromDeltaQuantity: productStoring.stock,
              type: productStoring.stock > 0 ? 'import' : 'export',
              performedUser: { _id: req.user.id }
            });
            return result.fromProductStoring;
          },
          { concurrency: 10 }
        );
        withSafety(() => {
          companyActivityService.implicitCreate(CompanyActions.updateProductStoringStock)(req);
        });
        return new BaseResponse({ statusCode: 200, data: productStorings }).return(res);
      } catch (error) {
        next(error);
      }
    },
    async createMoveStockRequest(req, res, next) {
      try {
        const rawBody = req.body;
        const company = req.company;
        const user = req.user;
        const baseQuery = {
          company_id: company._id,
          product_id: rawBody.product_id
        };

        // Map latest status of product storing stock to history
        const [fromStoring, toStoring] = await Promise.all([
          productStoringService.findOne({ ...baseQuery, store_id: rawBody.from_store_id }, null, {
            populate: [
              { path: 'store', select: 'name' },
              { path: 'product', select: 'name' }
            ]
          }),
          productStoringService.findOne({ ...baseQuery, store_id: rawBody.to_store_id }, null, {
            populate: [
              { path: 'store', select: 'name' },
              { path: 'product', select: 'name' }
            ]
          })
        ]);
        // Check if any product storing not exist
        if (!fromStoring || !toStoring) {
          throw new BaseError({
            statusCode: 400,
            error: errorCode.client,
            errors: {
              ...(!fromStoring
                ? { from_store_id: errorCode['client.storeNotExist'] }
                : { to_store_id: errorCode['client.storeNotExist'] })
            }
          });
        }
        // Check if moved stock less than requested stock (in case is_limited_stock === true)
        if (fromStoring.is_limited_stock && fromStoring.stock < rawBody.stock) {
          throw new BaseError({
            statusCode: 400,
            error: errorCode.client,
            errors: { stock: errorCode['client.stockCannotBeNegative'] }
          });
        }

        const result = await productStoringHandler.updateStock({
          from: fromStoring,
          fromDeltaQuantity: -rawBody.stock,
          to: toStoring,
          type: 'move',
          performedUser: { _id: user.id }
        });

        withSafety(() => {
          const product = fromStoring.product;
          notificationService.getStaffAndSend({
            company_id: toStoring.company_id,
            store_id: toStoring.store_id,
            staff_type: 'typist',
            title: 'Yêu cầu chuyển kho',
            message: `Chuyển ${rawBody.stock.toLocaleString('vi-VN')} sản phẩm ${product.name} từ ${
              fromStoring.store.name
            } đến ${toStoring.store.name}`,
            type: 'company_move_stock_request',
            onModel: 's_product_stock_history',
            object_id: result.stockHistory._id,
            exclude_ids: [user.id]
          });
          companyActivityService.implicitCreate(CompanyActions.requestMoveProductStoringStock)(
            req,
            {
              object_id: result.stockHistory._id
            }
          );
        });
        return new BaseResponse({ statusCode: 200, data: result }).return(res);
      } catch (error) {
        next(error);
      }
    },
    async confirmMoveStockRequest(req, res, next) {
      try {
        const rawBody = req.body;
        const company = req.company;
        const user = req.user;
        const query = {
          company_id: company._id,
          _id: rawBody.product_stock_history_id,
          status: 'pending'
        };
        if (company.store_id) {
          baseQuery.to_store_id = company.store_id;
        }

        const histories = await productStockHistoryService.find({
          query,
          populate: [
            { path: 'from_store', select: 'name company_id ' },
            { path: 'to_store', select: 'name company_id' },
            { path: 'product', select: 'name thumbnail price discount discount_rate' }
          ]
        });
        if (histories.length === 0) {
          throw new BaseError({
            statusCode: 400,
            error: errorCode.client,
            errors: { product_storing_id: errorCode['client.invalidRequest'] }
          });
        }
        const history = histories[0];
        const product = history.product;
        const fromStore = history.from_store;
        const toStore = history.to_store;
        let notificationTitle;
        let notificationMessage;

        // Get from & to product storings.
        const [fromStoring, toStoring] = await Promise.all([
          productStoringService.findOne({ _id: history.from_product_storing_id }),
          productStoringService.findOne({ _id: history.to_product_storing_id })
        ]);
        history.from_storing_snapshot = fromStoring;
        history.to_storing_snapshot = toStoring;

        // This vars to check if product stock from/to store is limited.
        const isFromLimitedStock = history.from_storing_snapshot.is_limited_stock;
        const isToLimitedStock = history.to_storing_snapshot
          ? history.to_storing_snapshot.is_limited_stock
          : isFromLimitedStock;

        if (rawBody.status === 'cancelled') {
          isFromLimitedStock &&
            (await productStoringService.update(
              { _id: history.from_product_storing_id },
              {
                $inc: { stock: -history.from_delta_quantity }
              }
            ));
          history.status = 'cancelled';
          history.handled_by_id = user.id;
          if (rawBody.note) {
            history.note ? history.note + '\n' + rawBody.note : rawBody.note;
          }
          await history.save();
          notificationTitle = 'Yêu cầu chuyển kho bị từ chối';
          notificationMessage = `${
            req.user.name
          } đã từ chối yêu cầu chuyển ${history.request_move_quantity.toLocaleString(
            'vi-VN'
          )} sản phẩm ${product.name} từ ${fromStore.name} đến ${toStore.name} \n ${
            history.note || ''
          }`;
        } else {
          let realQuantity = history.request_move_quantity;
          if (rawBody.stock > 0 && rawBody.stock !== history.request_move_quantity) {
            let quantity = history.request_move_quantity - rawBody.stock;
            if (quantity > 0) {
              realQuantity = rawBody.stock;
              history.from_delta_quantity = -rawBody.stock;
              isFromLimitedStock &&
                (await productStoringService.update(
                  { _id: history.from_product_storing_id },
                  {
                    $inc: { stock: quantity }
                  }
                ));
            }
          }
          isToLimitedStock &&
            (await productStoringService.update(
              { _id: history.to_product_storing_id },
              {
                $inc: { stock: realQuantity }
              }
            ));
          history.status = 'completed';
          history.handled_by_id = user.id;
          if (rawBody.note) {
            history.note ? history.note + '\n' + rawBody.note : rawBody.note;
          }
          await history.save();
          notificationTitle = 'Chuyển kho thành công';
          notificationMessage = `Đã chuyển ${realQuantity.toLocaleString('vi-VN')} sản phẩm ${
            product.name
          } từ ${fromStore.name} đến ${toStore.name} (${(
            history.request_move_quantity - realQuantity
          ).toLocaleString('vi-VN')} sản phẩm bị từ chối) \n ${history.note || ''}`;
        }

        withSafety(() => {
          notificationService.getStaffAndSend({
            company_id: fromStore.company_id,
            store_id: fromStore._id,
            staff_type: 'typist',
            title: notificationTitle,
            message: notificationMessage,
            type: 'company_move_stock_finished',
            onModel: 's_product_stock_history',
            object_id: history._id,
            exclude_ids: [user.id]
          });
          companyActivityService.implicitCreate(CompanyActions.confirmMoveProductStoringStock)(
            req,
            {
              object_id: history._id
            }
          );
        });
        return new BaseResponse({ statusCode: 200, data: history }).return(res);
      } catch (error) {
        next(error);
      }
    }
  },
  user: {
    async like(req, res, next) {
      try {
        const { id: user_id, name: user_name } = req.user;
        const { id: product_id, state } = req.body;
        let product = await productService.findActive(
          { _id: product_id },
          'likes_count type_category_id company_category_id sub_category_id company_id'
        );
        const { company_id, type_category_id, company_category_id, sub_category_id } = product;
        const productReaction = await productService.findOneReaction(
          { user_id, product_id },
          { user_name }
        );
        const isExistLike = productReaction.like;
        if (state === 'like' && !isExistLike) {
          product = productService.changeCount(product_id, { likes_count: 1 });
          productReaction.like = true;
          statisticService.update({ total_like: 1 });
        } else if (state === 'unlike' && isExistLike) {
          product = productService.changeCount(product_id, { likes_count: -1 });
          productReaction.like = false;
          statisticService.update({ total_like: -1 });
        }
        productReaction.save();

        // Create user behavior --
        behaviorService.createReactionBehavior({
          user_id,
          type: state === 'like' ? ReactionTypes.Like_Product : ReactionTypes.Unlike_Product,
          reaction_id: productReaction._id,
          on_model: 's_product_reaction',
          company_id,
          product_id,
          type_category_id,
          company_category_id,
          sub_category_id
        });
        // --

        return new BaseResponse({
          statusCode: 200,
          data: await product
        }).return(res);
      } catch (error) {
        next(error);
      }
    },
    async share(req, res, next) {
      try {
        const { id: product_id } = req.body;
        const { id: user_id, name: user_name } = req.user;
        let product = await productService.findActive(
          { _id: product_id },
          'shares_count type_category_id company_category_id sub_category_id company_id'
        );
        const { company_id, type_category_id, company_category_id, sub_category_id } = product;
        const productReaction = await productService.findOneReaction(
          { user_id, product_id },
          { user_name }
        );
        if (!productReaction.share)
          product = productService.changeCount(product_id, { shares_count: 1 });
        productReaction.share = true;
        productReaction.shares_count++;
        productReaction.save();
        statisticService.update({ total_share: 1 });

        // Create user behavior --
        behaviorService.createReactionBehavior({
          user_id,
          type: ReactionTypes.Share_Product,
          reaction_id: productReaction._id,
          on_model: 's_product_reaction',
          company_id,
          product_id,
          type_category_id,
          company_category_id,
          sub_category_id
        });
        // --

        return new BaseResponse({
          statusCode: 200,
          data: await product
        }).return(res);
      } catch (error) {
        next(error);
      }
    },
    async getFavorite(req, res, next) {
      try {
        const { id: user_id } = req.user;
        const { limit, page, select, sort } = req.query;
        const [favorites, count] = await Promise.all([
          productService.findReaction({
            query: { user_id, favorite: true },
            limit,
            page,
            select: 'user_id user_name product_id favorite',
            sort,
            populate: 'product_id'
          }),
          limit && productService.countReaction({ user_id, favorite: true })
        ]);
        const total_page = limit && Math.ceil(count / limit);
        return new BaseResponse({ statusCode: 200, data: favorites })
          .addMeta({ total_page, total: count })
          .return(res);
      } catch (e) {
        next(e);
      }
    },
    async favorite(req, res, next) {
      try {
        const { id: user_id, name: user_name } = req.user;
        const { id: product_id, state } = req.body;
        let product = await productService.findActive(
          { _id: product_id },
          'type_category_id company_category_id sub_category_id company_id'
        );
        const { company_id, type_category_id, company_category_id, sub_category_id } = product;
        const productReaction = await productService.findOneReaction(
          { user_id, product_id },
          { user_name },
          'user_id favorite'
        );
        productReaction.favorite = state === 'favorite';
        productReaction.save();

        // Create user behavior --
        behaviorService.createReactionBehavior({
          user_id,
          type:
            state === 'favorite'
              ? ReactionTypes.Favorite_Product
              : ReactionTypes.Unfavorite_Product,
          reaction_id: productReaction._id,
          on_model: 's_product_reaction',
          company_id,
          product_id,
          type_category_id,
          company_category_id,
          sub_category_id
        });
        // --

        return new BaseResponse({
          statusCode: 200,
          data: productReaction
        }).return(res);
      } catch (error) {
        next(error);
      }
    },
    async getView(req, res, next) {
      try {
        const { id: user_id } = req.user;
        const { limit, page, select, sort } = req.query;
        const [views, count] = await Promise.all([
          productService.findReaction({
            query: { user_id, view: true },
            limit,
            page,
            select: 'user_id user_name product_id view',
            sort,
            populate: 'product_id'
          }),
          limit && productService.countReaction({ user_id, view: true })
        ]);
        const total_page = limit && Math.ceil(count / limit);
        return new BaseResponse({ statusCode: 200, data: views })
          .addMeta({ total_page, total: count })
          .return(res);
      } catch (e) {
        next(e);
      }
    },
    async view(req, res, next) {
      try {
        const { id: product_id } = req.body;
        const { id: user_id, name: user_name } = req.user || {};
        const ip = req.headers['x-forwarded-for'];
        if (!ip) return new BaseResponse({ statusCode: 200, data: {} }).return(res);
        let product = await productService.findActive(
          { _id: product_id },
          'user_id views_count company_id type_category_id company_category_id sub_category_id'
        );
        const { company_id, type_category_id, company_category_id, sub_category_id } = product;
        const [productReaction, productReactionIp] = await Promise.all([
          productService.findOneReaction(
            mergeObject(
              { product_id },
              { user_id },
              !req.user && {
                ip,
                user_id: { $exists: false }
              }
            ),
            { user_name }
          ),
          productService.findReactionByIp(product_id, ip)
        ]);
        if (req.user) {
          if (
            (productReaction.view === false && !productReactionIp) ||
            (productReactionIp &&
              new Date() - productReactionIp.last_view > 1000 * 60 * 60 * 24 &&
              new Date() - productReaction.last_view > 1000 * 60 * 60 * 24)
          ) {
            productReaction.view = true;
            productReaction.views_count++;
            productReaction.ip = ip;
            productReaction.last_view = new Date();
            productService.changeCount(product_id, { views_count: 1 });
            statisticService.update({ total_view: 1 });
          }

          // Create user behavior --
          behaviorService.createReactionBehavior({
            user_id,
            type: ReactionTypes.View_Product,
            reaction_id: productReaction._id,
            on_model: 's_product_reaction',
            company_id,
            product_id,
            type_category_id,
            company_category_id,
            sub_category_id
          });
          // --
        } else {
          if (!productReactionIp) {
            productReaction.ip = ip;
            productReaction.view = true;
            productReaction.views_count++;
            productReaction.last_view = new Date();
            productService.changeCount(product_id, { views_count: 1 });
            statisticService.update({ total_view: 1 });
          } else {
            if (new Date() - productReactionIp.last_view > 1000 * 60 * 60 * 24) {
              productReaction.ip = ip;
              productReaction.views_count++;
              productReaction.view = true;
              productService.changeCount(product_id, { views_count: 1 });
              productReaction.last_view = new Date();
              statisticService.update({ total_view: 1 });
            }
          }
        }
        //* static
        productReaction.save();
        return new BaseResponse({
          statusCode: 200,
          data: await product
        }).return(res);
      } catch (error) {
        next(error);
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
          start_time,
          end_time,
          product_ids,
          text,
          updated_from,
          updated_to,
          created_from,
          created_to,
          ...query
        } = req.query;
        if (start_time && end_time) {
          query.createdAt = {
            $gte: start_time,
            $lte: end_time
          };
        }
        if (product_ids) {
          query._id = { $in: product_ids };
        }
        if (text) {
          query['$text'] = { $search: text };
        }
        if (updated_from || updated_to) {
          query.company_updated_at = {};
          updated_from && (query.company_updated_at['$gte'] = new Date(updated_from));
          updated_to && (query.company_updated_at['$lte'] = new Date(updated_to));
        }
        if (created_from || created_to) {
          query.createdAt = {};
          created_from && (query.createdAt['$gte'] = new Date(created_from));
          created_to && (query.createdAt['$lte'] = new Date(created_to));
        }
        const [products, count] = await Promise.all([
          productService.find({
            limit,
            page,
            select,
            sort,
            populate: [
              {
                path: 'productStorings',
                populate: [{ path: 'store' }]
              },
              {
                path: 'promotion',
                match: {
                  start_at: { $lt: new Date() },
                  expire_at: { $gt: new Date() }
                }
              },
              { path: 'company', select: '+wallet' },
              { path: 'sub_category_id', select: 'name' },
              { path: 'company_category_id', select: 'name' },
              { path: 'type_category_id', select: 'name' }
            ],
            ...query
          }),
          limit && productService.count(query)
        ]);
        const total_page = limit && Math.ceil(count / limit);
        return new BaseResponse({ statusCode: 200, data: products })
          .addMeta({ total_page, total: count })
          .return(res);
      } catch (error) {
        next(error);
      }
    },
    async getById(req, res, next) {
      try {
        const { id } = req.params;
        const product = await productService.findById(id, null, {
          populate: [
            {
              path: 'productStorings',
              populate: [{ path: 'store' }]
            },
            {
              path: 'promotion',
              match: {
                start_at: { $lt: new Date() },
                expire_at: { $gt: new Date() }
              }
            },
            { path: 'company', select: '+wallet' }
          ]
        });
        return new BaseResponse({ statusCode: 200, data: product }).return(res);
      } catch (error) {
        next(error);
      }
    },
    async approve(req, res, next) {
      try {
        const { status, id } = req.body;

        const updatedProduct = await withSession(async (session) => {
          const product = await productService.findOneEnsure({
            _id: id,
            status: { $ne: 'approved' }
          });
          product.status = status;

          await product.save({ session });

          //update storing
          if (status === Statuses.Approved) {
            const storingQuery = {
              product_id: id,
              status: { $ne: Statuses.Disabled }
            };
            const productObj = product.toObject();
            let [productStorings, warehouseStorings, mallStorings] = await Promise.all([
              productStoringService.find({
                query: storingQuery
              }),
              warehouseStoringService.find(storingQuery),
              mallStoringService.find(storingQuery)
            ]);
            let productStoringPromises = [];
            let warehouseStoringPromises = [];
            let mallStoringPromises = [];

            if (productStorings.length) {
              productStoringPromises = productStorings.map((productStoring) => {
                productStoring.model_list = productHandler.mergeStoringModelList(
                  productStoring.model_list,
                  productObj.model_list
                );
                return productStoring.save({ session });
              });
            }
            if (warehouseStorings.length) {
              warehouseStoringPromises = warehouseStorings.map((warehouseStoring) => {
                warehouseStoring.model_list = productHandler.mergeStoringModelList(
                  warehouseStoring.model_list,
                  productObj.model_list
                );
                return warehouseStoring.save({ session });
              });
            }
            if (mallStorings.length) {
              mallStoringPromises = mallStorings.map((mallStoring) => {
                mallStoring.model_list = productHandler.mergeStoringModelList(
                  mallStoring.model_list,
                  productObj.model_list
                );
                return mallStoring.save({ session });
              });
            }
            await Promise.all([
              ...productStoringPromises,
              ...warehouseStoringPromises,
              ...mallStoringPromises
            ]);
            companyService.changeCount(product.company_id, { active_product: 1 });
          }

          return product;
        });

        // Create admin activity
        adminActivityService.create({
          admin_id: req.admin.id,
          on_model: 's_product',
          object_id: updatedProduct._id,
          updated_fields: ['status'],
          type: 'update',
          snapshot: updatedProduct,
          resource: req.originalUrl
        });

        return new BaseResponse({ statusCode: 200, data: updatedProduct }).return(res);
      } catch (error) {
        next(error);
      }
    },
    async statisticBySubCategory(req, res, next) {
      try {
        let { company_id } = req.query;
        const query = company_id && { company_id: company_id.toObjectId() };
        const statistic = await productService.statisticBySubCategory(query);
        return res.send(new BaseResponse({ statusCode: 200, data: statistic }));
      } catch (err) {
        next(err);
      }
    }
  }
};

/**
 *
 *
 * @param {{
 *   address,
 *   validDiscounts,
 *   store,
 *   product,
 *   logistics
 * }} param
 */
async function getTransportFee({ address, validDiscounts, store, product, logistics }) {
  const isFreeTransport = product.is_free_transport;
  const discount = validDiscounts.find((discount) => product.price >= discount.order_value);
  const transportFees = {};
  await Promise.map(logistics, async (logistic) => {
    try {
      const original_fee = await baseLogistics[logistic.provider].getTempFee({
        toAddress: address,
        product: product,
        store: store
      });
      const discountValue = discount && discount.discount_rate * original_fee;
      const fee = isFreeTransport ? 0 : discountValue ? original_fee - discountValue : original_fee;
      transportFees[logistic.provider] = {
        calculated_transport_fee: original_fee,
        fee
      };
    } catch (error) {
      return {};
    }
  });
  return transportFees;
}
/**
 *
 *
 * @param {{
 *   address,
 *   store,
 *   productStoring,
 * }} param
 */
async function getDistances({ address, store, productStoring }) {
  productStoring = productStoring.toObject();
  let lat = address.location.coordinates[1];
  let lon = address.location.coordinates[0];
  let distance = getDistance(
    { lat: store.location.coordinates[1], lon: store.location.coordinates[0] },
    { lat, lon }
  );
  productStoring.store.distance = distance;
  return productStoring;
}
