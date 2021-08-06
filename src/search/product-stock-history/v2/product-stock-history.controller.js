import { BaseResponse, BaseError, errorCode, selectToPopulate } from '../../../commons/utils';
import productStockHistoryServiceV2 from './product-stock-history.service';
import { PopulatedFields, Statuses, Types } from './product-stock-history.config';
import { getDateRangeQuery } from '../../../commons/utils/utils';

export default {
  company_mall: {
    async getById(req, res, next) {
      try {
        const {
          stock_permission: stockPermission,
          params: { id: historyId },
          query: { select, populate: populatedStr }
        } = req;
        // This query ensure user can only get a history of her/his [store|warehouse|mall]
        const entityIds = [
          ...stockPermission.store_ids,
          ...stockPermission.warehouse_ids,
          ...stockPermission.mall_ids
        ];
        const query = {
          _id: historyId,
          $or: [{ from_entity_id: { $in: entityIds } }, { to_entity_id: { $in: entityIds } }]
        };

        const { populate } = selectToPopulate(populatedStr, PopulatedFields);

        const stockHistory = await productStockHistoryServiceV2.findOne(query, select, {
          populate
        });
        return new BaseResponse({ statusCode: 200, data: stockHistory }).return(res);
      } catch (err) {
        next(err);
      }
    },
    async get(req, res, next) {
      try {
        const {
          stock_permission: stockPermission,
          query: {
            limit,
            page,
            sort,
            select,
            populate: populatedStr,
            product_id,
            // Special fields --
            created_from,
            created_to,
            relate_to,
            store_id,
            warehouse_id,
            mall_id,
            direction,
            direction_entity_id,
            // --
            ...query
          }
        } = req;
        // This query ensure user can only get histories of her/his [store|warehouse|mall] --
        let entityIds = [
          ...stockPermission.store_ids,
          ...stockPermission.warehouse_ids,
          ...stockPermission.mall_ids
        ];
        const entityIdQuery = store_id || warehouse_id || mall_id;
        if (entityIdQuery) {
          entityIds = entityIds.filter((entityId) => entityId === entityIdQuery);
          if (!entityIds.length) {
            throw new BaseError({
              statusCode: 401,
              error: errorCode.client,
              errors: { permission: errorCode['permission.notAllow'] }
            });
          }
        }
        query['$and'] = [
          { $or: [{ from_entity_id: { $in: entityIds } }, { to_entity_id: { $in: entityIds } }] }
        ];
        // --

        if (product_id) {
          query['$and'].push({
            $or: [{ 'products.product_id': product_id }, { 'batches.product_id': product_id }]
          });
        }
        if (direction && direction_entity_id) {
          const orQuery =
            direction === 'in'
              ? {
                  $or: [
                    {
                      type: { $in: [Types.Import, Types.LocalImport] },
                      from_entity_id: direction_entity_id
                    },
                    { type: Types.Move, to_entity_id: direction_entity_id }
                  ]
                }
              : {
                  $or: [
                    {
                      type: { $in: [Types.Export, Types.LocalExport] },
                      from_entity_id: direction_entity_id
                    },
                    { type: Types.Move, from_entity_id: direction_entity_id }
                  ]
                };
          query['$and'].push(orQuery);
        }
        if (relate_to) {
          const relateTos = relate_to.split(/\s+/g);
          query.relate_to = { $in: relateTos };
        }
        // --

        const { populate } = selectToPopulate(populatedStr, PopulatedFields);
        const [stockHistories, metadata] = await productStockHistoryServiceV2.findWithPagination({
          page,
          limit,
          select,
          sort,
          populate,
          query: {
            ...query,
            ...getDateRangeQuery('createdAt', { fromDate: created_from, toDate: created_to })
          }
        });

        return new BaseResponse({ statusCode: 200, data: stockHistories })
          .addMeta(metadata)
          .return(res);
      } catch (err) {
        next(err);
      }
    }
  },
  admin: {
    async getById(req, res, next) {
      try {
        const {
          params: { id: historyId },
          query: { select, populate: populatedStr }
        } = req;

        const query = { _id: historyId };

        const { populate } = selectToPopulate(populatedStr, PopulatedFields);
        const stockHistory = await productStockHistoryServiceV2.findOne(query, select, {
          populate
        });
        return new BaseResponse({ statusCode: 200, data: stockHistory }).return(res);
      } catch (err) {
        next(err);
      }
    },
    async get(req, res, next) {
      try {
        const {
          query: {
            limit,
            page,
            sort,
            select,
            populate: populatedStr,
            batch_id,
            batch_code,
            product_id,
            // Special fields --
            created_from,
            created_to,
            relate_to,
            store_id,
            warehouse_id,
            mall_id,
            // --
            ...query
          }
        } = req;
        const entityId = store_id || warehouse_id || mall_id;
        if (entityId) {
          query['$or'] = [{ from_entity_id: entityId }, { to_entity_id: entityId }];
        }
        if (batch_id || batch_code) {
          query.batches = { $elemMatch: {} };
          batch_id && (query.batches['$elemMatch'].batch_id = batch_id);
          batch_code && (query.batches['$elemMatch'].batch_code = batch_code);
          product_id && (query.batches['$elemMatch'].product_id = product_id);
        }
        if (product_id) {
          query['$and'] = [{ products: { $elemMatch: { product_id } } }];
        }
        if (relate_to) {
          const relateTos = relate_to.split(/\s+/g);
          query.relate_to = { $in: relateTos };
        }

        const { populate } = selectToPopulate(populatedStr, PopulatedFields);
        const [stockHistories, metadata] = await productStockHistoryServiceV2.findWithPagination({
          page,
          limit,
          select,
          sort,
          populate,
          query: {
            ...query,
            ...getDateRangeQuery('createdAt', { fromDate: created_from, toDate: created_to })
          }
        });

        return new BaseResponse({ statusCode: 200, data: stockHistories })
          .addMeta(metadata)
          .return(res);
      } catch (err) {
        next(err);
      }
    }
  }
};
