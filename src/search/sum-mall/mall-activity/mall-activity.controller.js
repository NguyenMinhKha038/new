import mallActivityService from './mall-activity.service';
import { BaseResponse } from '../../../commons/utils';
import { mallActions } from './mall-activity.config';

export default {
  mall: {
    async get(req, res, next) {
      try {
        const { _id: mall_id } = req.mall;
        const { page, limit, select, sort, created_from, created_to, ...query } = req.query;
        if (created_from || created_to) {
          query.createdAt = {};
          created_from && (query.createdAt['$gte'] = new Date(created_from));
          created_to && (query.createdAt['$lte'] = new Date(created_to));
        }
        const [result, { total_page, total }] = await mallActivityService.findWithPagination({
          page,
          limit,
          select,
          sort,
          query: { ...query, mall_id }
        });
        return new BaseResponse({
          statusCode: 400,
          data: result
        })
          .addMeta({ total_page, total })
          .return(res);
      } catch (error) {
        next(error);
      }
    },
    async getById(req, res, next) {
      try {
        const { id } = req.params;
        const { select } = req.query;
        const { _id: mall_id } = req.mall;
        const result = await mallActivityService.findEnsure({ _id: id, mall_id, select });
        return new BaseResponse({
          statusCode: 200,
          data: result
        }).return(res);
      } catch (error) {
        next(error);
      }
    }
  },
  admin: {
    async get(req, res, next) {
      try {
        const { page, limit, select, sort, created_from, created_to, ...query } = req.query;
        if (created_from || created_to) {
          query.createdAt = {};
          created_from && (query.createdAt['$gte'] = new Date(created_from));
          created_to && (query.createdAt['$lte'] = new Date(created_to));
        }
        const [result, { total_page, total }] = await mallActivityService.findWithPagination({
          page,
          limit,
          select,
          sort,
          query
        });
        return new BaseResponse({
          statusCode: 400,
          data: result
        })
          .addMeta({ total_page, total })
          .return(res);
      } catch (error) {
        next(error);
      }
    },
    async getById(req, res, next) {
      try {
        const { id } = req.params;
        const { select } = req.query;
        const result = await mallActivityService.findEnsure({ _id: id, select });
        return new BaseResponse({
          statusCode: 400,
          data: result
        }).return(res);
      } catch (error) {
        next(error);
      }
    }
  }
};
