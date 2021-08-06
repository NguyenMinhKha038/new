import { BaseResponse } from '../../commons/utils';
import companyHistoryService from './company-history.service';

export default {
  admin: {
    async get(req, res, next) {
      try {
        let { limit, page, select, sort, start_time, end_time, ...query } = req.query;
        if (start_time && end_time) {
          start_time = start_time && new Date(start_time);
          end_time = end_time ? new Date(end_time) : new Date();
          query.createdAt = start_time && { $gt: start_time, $lt: end_time };
        }
        const [histories, count] = await Promise.all([
          companyHistoryService.find({
            limit,
            page,
            select,
            sort,
            populate: [
              // { path: 'user_id', select: 'name' },
              { path: 'transaction_id', populate: { path: 'store', select: 'name' } },
              { path: 'user', select: 'name avatar' },
              { path: 'company', select: 'name' }
              // { path: 'store' }
            ],
            ...query
          }),
          limit && companyHistoryService.count(query)
        ]);
        const total_page = limit && Math.ceil(count / limit);
        return new BaseResponse({ statusCode: 200, data: histories })
          .addMeta({ total_page, total: count })
          .return(res);
      } catch (error) {
        next(error);
      }
    }
  },
  company: {
    async get(req, res, next) {
      try {
        let { limit, page, select, sort, start_time, end_time, ...query } = req.query;
        const { id: company_id } = req.company;
        if (start_time && end_time) {
          start_time = start_time && new Date(start_time);
          end_time = end_time ? new Date(end_time) : new Date();
          query.createdAt = start_time && { $gt: start_time, $lt: end_time };
        }
        const [histories, count] = await Promise.all([
          companyHistoryService.find({
            limit,
            page,
            select,
            populate: [
              // { path: 'user_id', select: 'name' },
              { path: 'transaction_id', populate: { path: 'store', select: 'name' } },
              { path: 'user', select: 'name avatar' }
              // { path: 'store' }
            ],
            sort,
            ...query,
            company_id
          }),
          limit && companyHistoryService.count({ company_id, ...query })
        ]);
        const total_page = limit && Math.ceil(count / limit);
        return new BaseResponse({ statusCode: 200, data: histories })
          .addMeta({ total_page, total: count })
          .return(res);
      } catch (error) {
        next(error);
      }
    }
  }
};
