import adminActivityService from './admin-activity.service';
import adminConfig from './admin-activity.config';
import { BaseError, BaseResponse, errorCode } from '../utils';

export default {
  async getById(req, res, next) {
    try {
      const { activity_id: id } = req.params;
      const { select } = req.query;
      const populate = {
        path: 'admin',
        select: 'name email status'
      };

      const history = await adminActivityService.findOne({ _id: id }, select, { populate });

      return new BaseResponse({
        statusCode: 200,
        data: history
      }).return(res);
    } catch (err) {
      next(err);
    }
  },
  async get(req, res, next) {
    try {
      const { select, sort, page, limit, created_from, created_to, ...query } = req.query;
      const populate = {
        path: 'admin',
        select: 'name email status'
      };
      if (created_from || created_to) {
        query.createdAt = {};
        created_from && (query.createdAt['$gte'] = new Date(created_from));
        created_to && (query.createdAt['$lte'] = new Date(created_to));
      }

      const { docs: histories, count } = await adminActivityService.findAndCount({
        query,
        select,
        sort,
        limit,
        page,
        populate
      });

      const total_page = Math.ceil(count / (limit || adminConfig.DefaultLimit));

      return new BaseResponse({
        statusCode: 200,
        data: histories
      })
        .addMeta({ total_page, total: count })
        .return(res);
    } catch (err) {
      next(err);
    }
  }
};
