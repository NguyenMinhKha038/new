import { pick, uniqBy } from 'lodash';
import {
  BaseError,
  BaseResponse,
  errorCode,
  selectToPopulate,
  withSafety
} from '../../commons/utils';
import stockCheckingService from '../stock-checking/stock-checking.service';
import { Statuses, PopulatedFields } from './stock-checking-item.config';
import {
  CheckingTypes,
  Statuses as StockCheckingStatuses
} from '../stock-checking/stock-checking.config';
import stockCheckingItemHandler from './stock-checking-item.handler';
import stockCheckingItemService from './stock-checking-item.service';
import productStoringService from '../product-storing/product-storing.service';
import warehouseStoringService from '../warehouse-storing/warehouse-storing.service';
import companyActivityService from '../company-activity/company-activity.service';
import { CompanyActions } from '../company-activity/company-activity.config';

export default {
  company: {
    async update(req, res, next) {
      try {
        const { id } = req.params;
        const { id: user_id } = req.user;
        const { populate: populateStr } = req.query;

        const stockCheckingItem = await stockCheckingItemService.findOneEnsure(
          {
            _id: id,
            status: { $ne: Statuses.Disabled }
          },
          null,
          {
            populate: [
              {
                path: 'stock_checking',
                match: { status: StockCheckingStatuses.Handling }
              },
              {
                path: 'warehouse_storing'
              },
              {
                path: 'product_storing'
              }
            ]
          }
        );

        const stockChecking = stockCheckingItem.stock_checking;

        if (!stockChecking) {
          throw new BaseError({
            statusCode: 404,
            error: errorCode.client,
            errors: { stockCheckingItem: errorCode['client.stockCheckingMustBeHandling'] }
          });
        }
        if (stockChecking.staff_id.toString() !== user_id) {
          throw new BaseError({
            statusCode: 403,
            error: errorCode.client,
            errors: { stockCheckingItem: errorCode['permission.notAllow'] }
          });
        }

        const currentStoringItem =
          stockCheckingItem.warehouse_storing || stockCheckingItem.product_storing;

        const updateBody = pick(req.body, [
          'status',
          'stock',
          'actual_stock',
          'good_condition',
          'medium_condition',
          'poor_condition',
          'product_storing_id',
          'warehouse_storing_id',
          'model_id'
        ]);
        // update storing item (CUSTOM stock-checking only)
        if (
          stockChecking.type === CheckingTypes.Custom &&
          (updateBody.product_storing_id || updateBody.warehouse_storing_id)
        ) {
          let storingItem;
          // checking at store
          if (stockChecking.store_id) {
            storingItem = await productStoringService.findOneEnsure(
              {
                _id: updateBody.product_storing_id,
                store_id: stockChecking.store_id
              },
              null,
              { populate: { path: 'product', select: 'name' } }
            );
            updateBody.product_storing_id = storingItem._id;
            updateBody.storing_id = storingItem._id;
          }
          // checking at warehouse
          if (stockChecking.warehouse_id) {
            product_storing_id;
            storingItem = await warehouseStoringService.findOneEnsure(
              {
                _id: updateBody.warehouse_storing_id,
                warehouse_id: stockChecking.warehouse_id
              },
              null,
              { populate: { path: 'product', select: 'name' } }
            );
            updateBody.warehouse_storing_id = storingItem._id;
            updateBody.storing_id = storingItem._id;
          }
          const existedModel = await stockCheckingItemHandler.findModelInModelList({
            model_id: updateBody.model_id,
            model_list: storingItem.model_list
          });

          updateBody.model_id = existedModel ? existedModel.id : null;
          updateBody.name = storingItem.product.name;
          updateBody.product_id = storingItem.product._id;
        } else {
          delete updateBody.product_storing_id;
          delete updateBody.warehouse_storing_id;

          const existedModel = await stockCheckingItemHandler.findModelInModelList({
            model_id: updateBody.model_id,
            model_list: currentStoringItem.model_list
          });

          updateBody.model_id = existedModel ? existedModel.id : null;
        }

        const { populate } = selectToPopulate(populateStr, PopulatedFields);

        Object.assign(stockCheckingItem, updateBody);

        await (await stockCheckingItem.save()).populate(populate ? populate : []).execPopulate();

        withSafety(() => {
          companyActivityService.implicitCreate(CompanyActions.updateStockCheckingItem)(req, {
            object_id: stockCheckingItem._id
          });
        });

        return new BaseResponse({ statusCode: 200, data: stockCheckingItem }).return(res);
      } catch (err) {
        next(err);
      }
    },
    async updateMany(req, res, next) {
      try {
        let updateItems = req.body;
        const { id: user_id } = req.user;
        updateItems = uniqBy(updateItems, (item) => item.stock_checking_item_id);

        const { populate: populateStr } = req.query;
        const { populate } = selectToPopulate(populateStr, PopulatedFields);

        const promises = updateItems.map(async (updateItem) => {
          const { stock_checking_item_id: id } = updateItem;
          const stockCheckingItem = await stockCheckingItemService.findOneEnsure(
            {
              _id: id,
              status: { $ne: Statuses.Disabled }
            },
            null,
            {
              populate: [
                {
                  path: 'stock_checking',
                  match: { status: StockCheckingStatuses.Handling }
                },
                {
                  path: 'warehouse_storing'
                },
                {
                  path: 'product_storing'
                }
              ]
            }
          );
          const stockChecking = stockCheckingItem.stock_checking;
          if (!stockChecking) {
            throw new BaseError({
              statusCode: 404,
              error: errorCode.client,
              errors: { stockCheckingItem: errorCode['client.stockCheckingMustBeHandling'] }
            });
          }
          if (stockChecking.staff_id.toString() !== user_id) {
            throw new BaseError({
              statusCode: 403,
              error: errorCode.client,
              errors: { stockCheckingItem: errorCode['permission.notAllow'] }
            });
          }
          const currentStoringItem =
            stockCheckingItem.warehouse_storing || stockCheckingItem.product_storing;

          const updateBody = pick(req.body, [
            'status',
            'stock',
            'actual_stock',
            'good_condition',
            'medium_condition',
            'poor_condition',
            'product_storing_id',
            'warehouse_storing_id',
            'model_id'
          ]);
          // update storing item (CUSTOM stock-checking only)
          if (
            stockChecking.type === CheckingTypes.Custom &&
            (updateBody.product_storing_id || updateBody.warehouse_storing_id)
          ) {
            let storingItem;
            // checking at store
            if (stockChecking.store_id) {
              storingItem = await productStoringService.findOneEnsure(
                {
                  _id: updateBody.product_storing_id,
                  store_id: stockChecking.store_id
                },
                null,
                { populate: { path: 'product', select: 'name' } }
              );
              updateBody.product_storing_id = storingItem._id;
              updateBody.storing_id = storingItem._id;
            }
            // checking at warehouse
            if (stockChecking.warehouse_id) {
              product_storing_id;
              storingItem = await warehouseStoringService.findOneEnsure(
                {
                  _id: updateBody.warehouse_storing_id,
                  warehouse_id: stockChecking.warehouse_id
                },
                null,
                { populate: { path: 'product', select: 'name' } }
              );
              updateBody.warehouse_storing_id = storingItem._id;
              updateBody.storing_id = storingItem._id;
            }
            const existedModel = await stockCheckingItemHandler.findModelInModelList({
              model_id: updateBody.model_id,
              model_list: storingItem.model_list
            });

            updateBody.model_id = existedModel ? existedModel.id : null;
            updateBody.name = storingItem.product.name;
            updateBody.product_id = storingItem.product._id;
          } else {
            delete updateBody.product_storing_id;
            delete updateBody.warehouse_storing_id;

            const existedModel = await stockCheckingItemHandler.findModelInModelList({
              model_id: updateBody.model_id,
              model_list: currentStoringItem.model_list
            });

            updateBody.model_id = existedModel ? existedModel.id : null;
          }

          Object.assign(stockCheckingItem, updateBody);

          withSafety(() => {
            companyActivityService.implicitCreate(CompanyActions.updateStockCheckingItem)(req, {
              object_id: stockCheckingItem._id
            });
          });

          await (await stockCheckingItem.save()).populate(populate ? populate : []).execPopulate();
          return stockCheckingItem;
        });

        const updatedItems = await Promise.all(promises);

        return new BaseResponse({ statusCode: 200, data: { updated: updatedItems.length } }).return(
          res
        );
      } catch (err) {
        next(err);
      }
    },
    async create(req, res, next) {
      try {
        const {
          stock_checking_id,
          warehouse_storing_id,
          product_storing_id,
          model_id,
          stock,
          actual_stock,
          good_condition,
          medium_condition,
          poor_condition
        } = req.body;
        const { populate: populateStr } = req.query;

        // only custom stock-checking can manual create stock-checking-item
        const stockChecking = await stockCheckingService.findOneEnsure({
          _id: stock_checking_id,
          status: { $ne: StockCheckingStatuses.Completed },
          type: CheckingTypes.Custom
        });

        let storingItem;
        if (stockChecking.store_id) {
          storingItem = await productStoringService.findOneEnsure(
            {
              _id: product_storing_id,
              store_id: stockChecking.store_id
            },
            null,
            { populate: { path: 'product', select: 'name' } }
          );
        }
        if (stockChecking.warehouse_id) {
          storingItem = await warehouseStoringService.findOneEnsure(
            {
              _id: warehouse_storing_id,
              warehouse_id: stockChecking.warehouse_id
            },
            null,
            { populate: { path: 'product', select: 'name' } }
          );
        }
        const { populate } = selectToPopulate(populateStr, PopulatedFields);

        const existModel = await stockCheckingItemHandler.findModelInModelList({
          model_id,
          model_list: storingItem.model_list
        });

        const stockCheckingItem = await stockCheckingItemService.createAndPopulate({
          doc: {
            stock_checking_id,
            storing_id: storingItem._id,
            warehouse_storing_id: stockChecking.warehouse_id ? warehouse_storing_id : undefined,
            product_storing_id: stockChecking.store_id ? product_storing_id : undefined,
            model_id: existModel ? existModel._id : null,
            product_id: storingItem.product_id,
            name: storingItem.product.name,
            stock,
            actual_stock,
            good_condition,
            medium_condition,
            poor_condition
          },
          populate
        });

        withSafety(() => {
          companyActivityService.implicitCreate(CompanyActions.createStockCheckingItem)(req, {
            object_id: stockCheckingItem._id
          });
        });

        return new BaseResponse({ statusCode: 201, data: stockCheckingItem }).return(res);
      } catch (err) {
        next(err);
      }
    },
    async get(req, res, next) {
      try {
        const { status, select, populate: populateStr, page, limit, sort, ...query } = req.query;

        query.status = status ? status : { $ne: Statuses.Disabled };

        const { populate } = selectToPopulate(populateStr, PopulatedFields);

        const [stockCheckingItems, metaData] = await stockCheckingItemService.findWithPagination({
          page,
          limit,
          sort,
          select,
          populate,
          query
        });

        return new BaseResponse({ statusCode: 200, data: stockCheckingItems })
          .addMeta(metaData)
          .return(res);
      } catch (err) {
        next(err);
      }
    },
    async getById(req, res, next) {
      try {
        const { id } = req.params;

        const stockCheckingItem = await stockCheckingItemService.findOneEnsure(
          { _id: id, status: { $ne: Statuses.Disabled } },
          null,
          {
            populate: PopulatedFields
          }
        );

        return new BaseResponse({ statusCode: 200, data: stockCheckingItem }).return(res);
      } catch (err) {
        next(err);
      }
    }
  }
};
