import {
  BaseError,
  BaseResponse,
  errorCode,
  transactionHelper,
  withSafety
} from '../../commons/utils';
import { CompanyActions } from '../company-activity/company-activity.config';
import companyActivityService from '../company-activity/company-activity.service';
import productStockHistoryService from '../product-stock-history/product-stock-history.service';
import productStoringService from '../product-storing/product-storing.service';
import productService from '../product/product.service';
import { MovingTypes, CommonPopulatedFields } from './stock.config';
import stockHandler from './stock.handler';

export default {
  company: {
    async createMoveStockRequest(req, res, next) {
      try {
        const {
          moving_type,
          store_id,
          products: _products,
          product_id,
          stock,
          note,
          requester_type
        } = req.body;
        const { company, user } = req;

        // Check permission
        const isOwner = company.is_owner;
        const isPermitted = stockHandler.isPermitted('request', {
          moving_type,
          user_store_id: company.store_id,
          staff_type: company.type,
          ...(moving_type === MovingTypes.StockToStore
            ? { to_store_id: store_id }
            : { from_store_id: store_id })
        });
        if (!isOwner && !isPermitted) {
          throw new BaseError({
            statusCode: 401,
            error: errorCode.client,
            errors: { permission: errorCode['permission.notAllow'] }
          });
        }

        // Check requester_type
        if (!stockHandler.requesterTypesOf(company).includes(requester_type)) {
          throw new BaseError({
            statusCode: 400,
            error: errorCode.client,
            errors: { requester_type: errorCode['any.invalid'] },
            message: `user has not permission to choose this requester_type`
          });
        }

        // Handle moving request --
        // In case: move stocks of single product.
        const products = product_id ? [{ id: product_id, stock }] : _products;
        const stockHistory = await transactionHelper.withSession(async (session) => {
          const needApproved = stockHandler.needApproved(
            { staffTypes: company.type, isOwner: company.is_owner },
            moving_type
          );

          return await stockHandler.handleMoveStockRequest(
            {
              movingType: moving_type,
              storeId: store_id,
              companyId: company._id,
              products,
              note,
              performedUser: { _id: user.id, store_id: company.store_id },
              requesterType: requester_type,
              needApproved
            },
            { session }
          );
        });
        // --

        // Handle notification
        stockHandler.handleNotification({
          history: stockHistory,
          performed_by: user,
          exclude_ids: [user.id]
        });
        withSafety(() => {
          companyActivityService.implicitCreate(CompanyActions.requestMoveProductStock)(req, {
            object_id: stockHistory._id
          });
        });

        return new BaseResponse({ statusCode: 201, data: stockHistory }).return(res);
      } catch (err) {
        next(err);
      }
    },
    async confirmMoveStockRequest(req, res, next) {
      try {
        const { product_stock_history_id, note, status, products } = req.body;
        const { user, company } = req;

        const query = {
          _id: product_stock_history_id,
          company_id: company._id,
          type: 'move',
          moving_type: { $in: Object.values(MovingTypes) },
          $or: [{ status: 'pending', need_approved: false }, { status: 'approved' }]
        };

        // Build populates
        const populate = [...CommonPopulatedFields];

        // Handle move stock confirm --
        let newStockHistory = null;
        await transactionHelper.withSession(async (session) => {
          // Get product stock history
          const stockHistory = await productStockHistoryService.findOne(query, null, {
            populate,
            session
          });
          if (!stockHistory) {
            throw new BaseError({
              statusCode: 404,
              error: errorCode.client,
              errors: { product_stock_history: errorCode['client.stockHistoryNotFound'] },
              message: 'this request is not able to confirm now'
            });
          }

          // Check permission
          const { moving_type, from_store_id, to_store_id } = stockHistory;
          const isOwner = company.is_owner;
          const isPermitted = stockHandler.isPermitted('confirm', {
            moving_type,
            user_store_id: company.store_id,
            staff_type: company.type,
            from_store_id,
            to_store_id
          });
          if (!isOwner && !isPermitted) {
            throw new BaseError({
              statusCode: 401,
              error: errorCode.client,
              errors: { permission: errorCode['permission.notAllow'] }
            });
          }

          newStockHistory = await stockHandler.handleMoveStockConfirm(
            {
              stockHistory,
              handledUser: { _id: user.id, store_id: company.store_id },
              products,
              note,
              status
            },
            { session }
          );
        });
        // --

        // Handle notification
        stockHandler.handleNotification({
          history: newStockHistory,
          handled_by: user,
          exclude_ids: [user.id]
        });
        withSafety(() => {
          companyActivityService.implicitCreate(CompanyActions.confirmMoveProductStock)(req, {
            object_id: newStockHistory._id
          });
        });

        return new BaseResponse({ statusCode: 200, data: newStockHistory }).return(res);
      } catch (err) {
        next(err);
      }
    },
    async approveMoveStockRequest(req, res, next) {
      try {
        const { product_stock_history_id, products, note, status } = req.body;
        const { user, company } = req;

        const query = {
          company_id: company._id,
          _id: product_stock_history_id,
          type: 'move',
          moving_type: { $in: Object.values(MovingTypes) },
          status: 'pending',
          need_approved: true
        };
        // Build populates
        const populate = [...CommonPopulatedFields];

        // Handle approve --
        let stockHistory = null;
        await transactionHelper.withSession(async (session) => {
          // Get product stock history
          stockHistory = await productStockHistoryService.findOne(query, null, {
            populate,
            session
          });
          if (!stockHistory) {
            throw new BaseError({
              statusCode: 404,
              error: errorCode.client,
              errors: { product_stock_history: errorCode['client.stockHistoryNotFound'] },
              message: 'the request not found or not able to approve now'
            });
          }

          // Check permission
          const { moving_type, from_store_id, to_store_id } = stockHistory;
          const isOwner = company.is_owner;
          const isPermitted = stockHandler.isPermitted('approve', {
            moving_type,
            user_store_id: company.store_id,
            staff_type: company.type,
            from_store_id,
            to_store_id
          });
          if (!isOwner && !isPermitted) {
            throw new BaseError({
              statusCode: 401,
              error: errorCode.client,
              errors: { permission: errorCode['permission.notAllow'] }
            });
          }

          stockHistory = await stockHandler.handleMoveStockApprove(
            {
              stockHistory,
              approvedUser: { _id: user.id, store_id: company.store_id },
              products,
              note,
              status
            },
            { session }
          );
        });
        // --

        // Handle notification
        stockHandler.handleNotification({
          history: stockHistory,
          approved_by: user,
          exclude_ids: [user.id]
        });
        withSafety(() => {
          companyActivityService.implicitCreate(CompanyActions.approveMoveProductStock)(req, {
            object_id: stockHistory._id
          });
        });

        return new BaseResponse({ statusCode: 200, data: stockHistory }).return(res);
      } catch (err) {
        next(err);
      }
    },
    async updateStock(req, res, next) {
      try {
        const { products, provider, note, type } = req.body;
        const { user, company } = req;

        // Check permission
        const isOwner = company.is_owner;
        const isPermitted = stockHandler.isPermitted('update', { staff_type: company.type });
        if (!isOwner && !isPermitted) {
          throw new BaseError({
            statusCode: 401,
            error: errorCode.client,
            errors: { permission: errorCode['permission.notAllow'] }
          });
        }

        // Update stocks
        const results = await transactionHelper.withSession(async (session) => {
          return await stockHandler.handleUpdateStock(
            {
              type,
              productsToUpdate: products,
              companyId: company._id,
              performedUser: { _id: user.id },
              provider,
              note
            },
            { session }
          );
        });

        withSafety(() => {
          companyActivityService.implicitCreate(CompanyActions.updateProductStock)(req, {});
        });
        return new BaseResponse({ statusCode: 200, data: results }).return(res);
      } catch (err) {
        next(err);
      }
    }
  },
  admin: {}
};
