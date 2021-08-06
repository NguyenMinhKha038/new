import { BaseResponse } from '../../commons/utils';
import behaviorService from './behavior.service';
import behaviorConfig from './behavior.config';

export default {
  async get(req, res, next) {
    try {
      const { created_from, created_to, province_code, ...query } = req.query;
      // Format fields
      if (created_from || created_to) {
        query.createdAt = {};
        created_from && (query.createdAt['$gte'] = new Date(created_from));
        created_to && (query.createdAt['$lte'] = new Date(created_to));
      }
      province_code && (query['location.province_code'] = province_code + '');

      const { behaviors, count } = await behaviorService.findAndCount(query);
      const total_page = Math.ceil(count / (req.query.limit || behaviorConfig.DefaultLimit));

      return new BaseResponse({ statusCode: 200, data: behaviors })
        .addMeta({ total_page })
        .return(res);
    } catch (err) {
      next(err);
    }
  },
  async getById(req, res, next) {
    try {
      const { id: behavior_id } = req.params;
      const behavior = await behaviorService.findOne({ _id: behavior_id });

      return new BaseResponse({ statusCode: 200, data: behavior }).return(res);
    } catch (err) {
      next(err);
    }
  },
  // This controller just for testing
  async createBehavior(req, res, next) {
    try {
      const data = req.body;
      const { data: behavior } = await behaviorService.createShoppingBehavior(data);

      return new BaseResponse({ statusCode: 200, data: behavior }).return(res);
    } catch (err) {
      next(err);
    }
  }
};
