import companyMoneyFlowService from './company-money-flow.service';
import { BaseResponse } from '../../commons/utils';

export default {
  async get(req, res, next) {
    try {
      const { limit, page, select, sort } = req.query;
      let [data, count] = await Promise.all([
        companyMoneyFlowService.get({
          limit,
          page,
          select,
          sort
        }),
        limit && companyMoneyFlowService.count({})
      ]);
      const total_page = limit && Math.ceil(count / limit);
      return new BaseResponse({ statusCode: 200, data })
        .addMeta({ total_page, total: count })
        .return(res);
    } catch (error) {
      next(error);
    }
  }
};
