import {
  BaseError,
  BaseResponse,
  errorCode,
  mergeObject,
  withSafety,
  transactionHelper
} from '../../commons/utils';
import productService from '../product/product.service';
import storeService from '../store/store.service';
import productStoringHandler from './product-storing.handler';
import productStoringModel from './product-storing.model';
import productStoringService from './product-storing.service';
import { Promise } from 'bluebird';
import notificationService from '../notification/notification.service';
import productStockHistoryService from '../product-stock-history/product-stock-history.service';
import companyActivityService from '../company-activity/company-activity.service';
import { CompanyActions } from '../company-activity/company-activity.config';
import { CommonPopulatedFields } from '../stock/stock.config';

export default {
  async find(req, res, next) {
    try {
      const { id: company_id } = req.company;
      const {
        sort,
        page,
        select,
        limit,
        populate_store,
        product_status,
        product_ids,
        product_id,
        ...query
      } = req.query;
      query.company_id = company_id;
      let productList = null;
      if (product_status) {
        productList = await productStoringHandler.getProductList(
          { company_id, status: product_status },
          '_id'
        );
      }
      if (productList) {
        const productIdList = productList.map((item) => item._id);
        query.product_id = productIdList;
      }
      if (product_ids) {
        if (query.product_id) {
          query.product_id = [...query.product_id, ...product_ids];
        } else {
          query.product_id = product_ids;
        }
      }
      if (product_id) {
        if (query.product_id) {
          query.product_id.push(product_id);
        } else {
          query.product_id = [product_id];
        }
      }

      const promotionMatchPopulate = {
        start_at: {
          $lte: new Date()
        },
        expire_at: {
          $gt: new Date()
        },
        status: 'active'
      };

      const { store_id: storeIdQuery, product_id: productIdQuery } = query;
      if (storeIdQuery) {
        promotionMatchPopulate.store_id = storeIdQuery;
      }
      if (productIdQuery) {
        promotionMatchPopulate.product_ids = productIdQuery;
      }
      let populate = [
        { path: 'product_id' },
        {
          path: 'promotion',
          match: promotionMatchPopulate
        }
      ];
      if (populate_store) {
        populate.push({ path: 'store_id' });
      }
      const [productStoringList, count] = await Promise.all([
        productStoringService.find({
          query,
          populate,
          sort,
          page,
          select,
          limit
        }),
        limit !== undefined && productStoringService.count(query)
      ]);
      const total_page = limit && Math.ceil(count / limit);
      // const productStoring = productStoringList.to
      return res.send(
        new BaseResponse({ statusCode: 200, data: productStoringList }).addMeta({
          total_page,
          total: count
        })
      );
    } catch (err) {
      return next(err);
    }
  },
  async importProductToStore(req, res, next) {
    try {
      const { products, store_id } = req.body;
      const { id: company_id, ...company } = req.company;
      const { id: user_id } = req.user;

      const [productStorings, store] = await transactionHelper.withSession(async (session) => {
        const store = await storeService.findActive({ _id: store_id, company_id }, null, {
          session
        });

        const productStorings = await Promise.map(products, async ({ _id: product_id, stock }) => {
          let product = await productService.findActive(
            {
              _id: product_id,
              company_id
            },
            null,
            { session }
          );
          const isExistProductStoring = await productStoringService.findOne(
            {
              product_id,
              store_id
            },
            null,
            { session }
          );
          if (isExistProductStoring) return isExistProductStoring;
          const productStoring = await productStoringHandler.create(
            {
              ...product.toObject(),
              store_id: store._id,
              company_id,
              product_id: product._id,
              stock,
              is_active_product: product.status === 'approved',
              is_active_company: company.status === 'approved',
              is_active_store: store.status === 'active'
            },
            { _id: user_id },
            { session }
          );
          productStoring.product = product;
          await productStoringService.updateOneByPromotion({ productStoring });
          productStoring.product = undefined;
          return productStoring;
        });

        return [productStorings, store];
      });

      withSafety(async () => {
        await storeService.updateOneByPromotion(store);
        storeService.updateProductCount(store_id);
        companyActivityService.implicitCreate(CompanyActions.addProductToStore)(req, {});
      });
      return new BaseResponse({ statusCode: 200, data: productStorings }).return(res);
    } catch (error) {
      next(error);
    }
  },
  async update(req, res, next) {
    try {
      const { product_storing_id } = req.params;
      const { active } = req.body;
      const { id: company_id, ...company } = req.company;
      const productStoring = await productStoringService.findOne({ _id: product_storing_id });
      mergeObject(productStoring, { active });
      await productStoring.save();
      await productStoringService.updateOneByPromotion({ productStoring });
      const store = await storeService.findOne({ _id: productStoring.store_id });
      await storeService.updateOneByPromotion(store);
      await storeService.updateProductCount(store._id);
      withSafety(() => {
        companyActivityService.implicitCreate(CompanyActions.updateProductStoring)(req, {
          object_id: productStoring._id
        });
      });
      return new BaseResponse({ statusCode: 200, data: productStoring }).return(res);
    } catch (error) {
      next(error);
    }
  },
  async search(req, res, next) {
    try {
      const { query, limit = 10 } = req.query;
      const store_id = req.company.store_id || req.query.store_id;
      if (req.company.is_owner)
        await storeService.findActive({
          _id: store_id,
          company_id: req.company.id
        });
      const data = await productStoringModel.esSearch(
        {
          query: {
            bool: {
              must: [
                {
                  match_phrase: { 'store_id._id': store_id }
                },
                {
                  match_phrase: { showable: true }
                },
                query
                  ? {
                      query_string: {
                        fields: ['product_id.name', 'product_id.pid'],
                        query
                        // analyzer: 'word_ngram'
                      }
                    }
                  : {
                      match_all: { boost: 1.2 }
                    }
              ]
            }
          }
        },
        {
          hydrate: {
            select: '-id',
            docsOnly: false,
            populate: [
              {
                path: 'promotion',
                match: {
                  start_at: {
                    $lte: new Date()
                  },
                  expire_at: {
                    $gt: new Date()
                  },
                  remain: {
                    $gt: 0
                  }
                }
              },
              { path: 'product_id' }
            ]
          }
        }
      );
      return new BaseResponse({ statusCode: 200, data: data.hits.hits }).return(res);
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
            fromDeltaQuantity:
              update.type === 'import' ? productStoring.stock : -productStoring.stock,
            type: update.type,
            performedUser: { _id: req.user.id },
            provider: update.provider,
            note: update.note
          });
          return result.fromProductStoring;
        },
        { concurrency: 10 }
      );
      withSafety(() => {
        companyActivityService.implicitCreate(CompanyActions.updateProductStoringStock)(req, {});
      });
      return new BaseResponse({ statusCode: 200, data: productStorings }).return(res);
    } catch (error) {
      next(error);
    }
  },
  async createMoveStockRequest(req, res, next) {
    try {
      const {
        body: { from_store_id: fromStoreId = '', to_store_id: toStoreId = '', ...restBody },
        company: { _id: companyId, is_owner: isOwner, type: staffType = [], store_id: userStoreId },
        user
      } = req;

      // Check permission
      const isPermitted = productStoringHandler.isPermitted('request', {
        userStoreId,
        fromStoreId,
        toStoreId,
        staffType
      });
      if (!isPermitted && !isOwner) {
        throw new BaseError({
          statusCode: 401,
          error: errorCode.client,
          errors: { permission: errorCode['permission.notAllow'] }
        });
      }

      // Handle move request
      const stockHistory = await transactionHelper.withSession(async (session) => {
        const { products: _products, note, product_id, stock } = restBody;
        const products = product_id ? [{ id: product_id, stock }] : _products;
        const needApproved = !isOwner && toStoreId.toString() === userStoreId.toString();
        return await productStoringHandler.handleMoveStockRequest(
          {
            products,
            fromStoreId,
            toStoreId,
            companyId,
            needApproved,
            performedUser: { _id: user.id, store_id: userStoreId },
            note
          },
          { session }
        );
      });

      notificationService.getStaffAndSend({
        company_id: companyId,
        store_id: toStoreId,
        staff_type: 'store_stock',
        title: 'Yêu cầu chuyển kho',
        message: `Chuyển ${stockHistory.total_request_stocks.toLocaleString('vi-VN')} sản phẩm từ ${
          stockHistory.from_store.name
        } đến ${stockHistory.to_store.name}`,
        type: 'company_move_stock_request',
        onModel: 's_product_stock_history',
        object_id: stockHistory._id,
        exclude_ids: [user.id]
      });

      return new BaseResponse({ statusCode: 200, data: stockHistory }).return(res);
    } catch (err) {
      next(err);
    }
  },
  async approveMoveStockRequest(req, res, next) {
    try {
      const {
        body: { product_stock_history_id: stockHistoryId, status, products, note },
        company: { _id: companyId, is_owner: isOwner, type: staffType = [], store_id: userStoreId },
        user
      } = req;
      const query = {
        company_id: companyId,
        _id: stockHistoryId,
        status: 'pending',
        type: 'move',
        need_approved: true
      };

      // Check if stockHistory not exist
      let stockHistory = await productStockHistoryService.findOne(query, null, {
        populate: [...CommonPopulatedFields]
      });
      if (!stockHistory) {
        throw new BaseError({
          statusCode: 404,
          error: errorCode.client,
          errors: { product_stock_stockHistory_id: errorCode['client.stockHistoryNotFound'] },
          message: 'the request not found or approved'
        });
      }

      // Check permission
      const { from_store_id: fromStoreId, to_store_id: toStoreId } = stockHistory;
      const isPermitted = productStoringHandler.isPermitted('approve', {
        fromStoreId,
        toStoreId,
        staffType,
        userStoreId
      });
      if (!isPermitted && !isOwner) {
        throw new BaseError({
          statusCode: 401,
          error: errorCode.client,
          errors: { permission: errorCode['permission.notAllow'] }
        });
      }

      // Handle approve the request
      stockHistory = await transactionHelper.withSession(async (session) => {
        return await productStoringHandler.handleMoveStockApprove(
          {
            note,
            status,
            products,
            stockHistory,
            companyId,
            approvedUser: { _id: user.id, store_id: userStoreId }
          },
          { session }
        );
      });

      // Handle notification
      const fromStore = stockHistory.from_store;
      const toStore = stockHistory.to_store;
      const notificationTitle = 'Yêu cầu chuyển kho đã được kiểm duyệt';
      const notificationMessage = `Yêu cầu chuyển ${
        stockHistory.total_request_stocks
      } sản phẩm từ ${fromStore.name} đến ${toStore.name} đã được xử lý (${
        stockHistory.total_moved_stocks
      } đã được duyệt, ${
        stockHistory.total_request_stocks - stockHistory.total_moved_stocks
      } đã bịtừ chối) bởi ${user.name}`;

      notificationService.getStaffAndSend({
        company_id: companyId,
        store_id: toStore._id,
        staff_type: 'store_stock',
        title: notificationTitle,
        message: notificationMessage,
        type: 'company_move_stock_approved',
        onModel: 's_product_stock_history',
        object_id: stockHistory._id,
        exclude_ids: [user.id]
      });
      withSafety(() => {
        companyActivityService.implicitCreate(CompanyActions.approveMoveProductStoringStock)(req, {
          object_id: stockHistory._id
        });
      });
      return new BaseResponse({ statusCode: 200, data: stockHistory }).return(res);
    } catch (err) {
      return next(err);
    }
  },
  async confirmMoveStockRequest(req, res, next) {
    try {
      const {
        body: { product_stock_history_id: stockHistoryId, status, products, note },
        company: { _id: companyId, is_owner: isOwner, type: staffType = [], store_id: userStoreId },
        user
      } = req;
      const query = {
        company_id: companyId,
        _id: stockHistoryId,
        $or: [{ status: 'pending', need_approved: false }, { status: 'approved' }]
      };

      let stockHistory = await productStockHistoryService.findOne(query, null, {
        populate: [...CommonPopulatedFields]
      });
      if (!stockHistory) {
        throw new BaseError({
          statusCode: 404,
          error: errorCode.client,
          errors: { product_stock_stockHistory_id: errorCode['client.stockHistoryNotFound'] },
          message: 'the request not found or need to be approved first'
        });
      }

      // Check permission
      const { from_store_id: fromStoreId, to_store_id: toStoreId } = stockHistory;
      const isPermitted = productStoringHandler.isPermitted('confirm', {
        fromStoreId,
        toStoreId,
        staffType,
        userStoreId
      });
      if (!isPermitted && !isOwner) {
        throw new BaseError({
          statusCode: 401,
          error: errorCode.client,
          errors: { permission: errorCode['permission.notAllow'] }
        });
      }

      // Handle confirm the request
      stockHistory = await transactionHelper.withSession(async (session) => {
        return await productStoringHandler.handleMoveStockConfirm(
          {
            note,
            status,
            products,
            stockHistory,
            companyId,
            handledUser: { _id: user.id, store_id: userStoreId }
          },
          { session }
        );
      });

      // Handle notification
      const fromStore = stockHistory.from_store;
      const toStore = stockHistory.to_store;
      const notificationTitle =
        stockHistory.status === 'completed' ? 'Chuyển kho thành công' : 'Chuyển kho thất bại';
      const notificationMessage = `Yêu cầu chuyển ${
        stockHistory.total_request_stocks
      } sản phẩm từ ${fromStore.name} đến ${toStore.name} đã được xử lý (${
        stockHistory.total_moved_stocks
      } đã được xác nhận, ${
        stockHistory.total_request_stocks - stockHistory.total_moved_stocks
      } đã bịtừ chối) bởi ${user.name}`;

      notificationService.getStaffAndSend({
        company_id: companyId,
        store_id: toStore._id,
        staff_type: 'store_stock',
        title: notificationTitle,
        message: notificationMessage,
        type: 'company_move_stock_confirmed',
        onModel: 's_product_stock_history',
        object_id: stockHistory._id,
        exclude_ids: [user.id]
      });
      withSafety(() => {
        companyActivityService.implicitCreate(CompanyActions.confirmMoveProductStoringStock)(req, {
          object_id: stockHistory._id
        });
      });
      return new BaseResponse({ statusCode: 200, data: stockHistory }).return(res);
    } catch (error) {
      next(error);
    }
  }
};
