import { BaseResponse } from '../../commons/utils';
import companyConfig from './company-activity.config';
import companyActivityService from './company-activity.service';

export default {
  async getById(req, res, next) {
    try {
      const { id } = req.params;
      const { select } = req.query;
      const populate = ['staff_info', 'object'];
      const history = await companyActivityService.findOne({ _id: id }, select, { populate });
      history.object =
        history.object && history.object.transform ? history.object.transform() : history.object;
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
      const populate = ['staff_info', 'object'];
      if (created_from || created_to) {
        query.createdAt = {};
        created_from && (query.createdAt['$gte'] = new Date(created_from));
        created_to && (query.createdAt['$lte'] = new Date(created_to));
      }

      const { docs: histories, count } = await companyActivityService.findAndCount({
        query,
        select,
        sort,
        limit,
        page,
        populate
      });
      histories.map((history) => {
        history.object =
          history.object && history.object.transform ? history.object.transform() : history.object;
      });
      const total_page = Math.ceil(count / (limit || companyConfig.DefaultLimit));

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
