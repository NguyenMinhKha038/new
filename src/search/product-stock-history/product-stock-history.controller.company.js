import _ from 'lodash';
import { BaseResponse, BaseError, errorCode } from '../../commons/utils';
import productStockHistoryService from './product-stock-history.service';
import { FieldSelections, RelateTo, GetPermission } from './product-stock-history.config';

export default {
  async getHistoryById(req, res, next) {
    try {
      const { id: company_id, is_owner, store_id, type: staff_type } = req.company;
      const { id: history_id } = req.params;
      const { select } = req.query;
      const query = { _id: history_id, company_id };

      // Check permission
      if (!is_owner) {
        const hasPermissions = staff_type.filter((t) => GetPermission.includes(t));
        if (!hasPermissions.length) {
          throw new BaseError({
            statusCode: 401,
            error: errorCode.client,
            errors: { permission: errorCode['permission.notAllow'] }
          });
        }

        // User can query all types of history with permission `company_stock`
        if (hasPermissions.includes('company_stock') && hasPermissions.includes('store_stock')) {
          // passthrough
        } else if (hasPermissions.includes('company_stock')) {
          // User can only query histories relate to stock of her/his company with permission `company_stock`
          query.relate_to = { $in: ['stock', 'both'] };
        } else if (hasPermissions.includes('store_stock')) {
          // User can only query histories relate to his/her store with permission `store_stock`
          query['$or'] = [{ from_store_id: store_id }, { to_store_id: store_id }];
          query.relate_to = { $in: ['store', 'both'] };
        }
      }

      // Build populate on select option because fields of stock history are refs almost
      const populate = [];
      if (select) {
        const selectArray = [...new Set(select.split(' '))];
        const posSelections = Object.keys(FieldSelections);
        selectArray.forEach((item) => {
          if (posSelections.includes(item)) {
            populate.push({ path: item, select: FieldSelections[item] });
          }
        });
      }
      const history = await productStockHistoryService.findOne(query, null, {
        populate
      });
      if (!history) {
        throw new BaseError({
          statusCode: 404,
          error: errorCode.client,
          errors: { product_stock_history: errorCode['client.global.notFound'] }
        });
      }

      return new BaseResponse({ statusCode: 200, data: history }).return(res);
    } catch (err) {
      next(err);
    }
  },
  async getHistories(req, res, next) {
    try {
      const { id: company_id, store_id, is_owner, type: staff_type } = req.company;
      const {
        sort,
        page,
        select,
        limit,
        _id,
        id,
        store_id: query_store_id,
        product_id,
        created_from,
        created_to,
        relate_to,
        ...query
      } = req.query;
      let queryStoreId = query_store_id;
      query.company_id = company_id;

      // Check permission
      if (!is_owner) {
        const hasPermissions = staff_type.filter((t) => GetPermission.includes(t));
        if (!hasPermissions.length) {
          throw new BaseError({
            statusCode: 401,
            error: errorCode.client,
            errors: { permission: errorCode['permission.notAllow'] }
          });
        }

        // User can query all types of history with permission `company_stock`
        if (hasPermissions.includes('company_stock') && hasPermissions.includes('store_stock')) {
          // passthrough
        } else if (hasPermissions.includes('company_stock')) {
          // User can only query histories relate to stock of her/his company with permission `company_stock`
          query.relate_to = { $in: ['stock', 'both'] };
        } else if (
          hasPermissions.includes('store_stock') ||
          hasPermissions.includes('store_manager')
        ) {
          // User can only query histories relate to his/her store with permission `store_stock`
          queryStoreId = store_id;
          query.relate_to = { $in: ['store', 'both'] };
        }
      }

      (_id || id) && (query._id = _id || id);
      if (created_from || created_to) {
        query.createdAt = {};
        created_from && (query.createdAt['$gte'] = new Date(created_from));
        created_to && (query.createdAt['$lte'] = new Date(created_to));
      }
      if (relate_to) {
        const relateToArr = relate_to.split(' ').filter((item) => RelateTo.includes(item.trim()));
        relateToArr.length && (query.relate_to = { $in: relateToArr });
      }
      if (queryStoreId) {
        query['$or'] = [{ from_store_id: queryStoreId }, { to_store_id: queryStoreId }];
      }
      if (product_id) {
        query.products = { $elemMatch: { product_id } };
      }

      // Build populate on select option because fields of stock history are refs almost
      const populate = [];
      if (select) {
        const selectArray = [...new Set(select.split(' '))];
        const posSelections = Object.keys(FieldSelections);
        selectArray.forEach((item) => {
          if (posSelections.includes(item)) {
            populate.push({ path: item, select: FieldSelections[item] });
          }
        });
      }

      const [response, count] = await Promise.all([
        productStockHistoryService.find({
          query,
          populate,
          sort,
          page,
          limit
        }),
        limit && productStockHistoryService.count(query)
      ]);
      const total_page = limit && Math.ceil(count / limit);
      return res.send(
        new BaseResponse({ statusCode: 200, data: response }).addMeta({
          total_page,
          total: count
        })
      );
    } catch (err) {
      return next(err);
    }
  }
};
