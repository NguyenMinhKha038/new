import { BaseResponse } from '../../commons/utils';
import buyerService from './buyer.service';

export default {
  admin: {
    async get(req, res, next) {
      try {
        const { limit, page, select, sort, ...query } = req.query;
        const [result, { total_page, total }] = await buyerService.findWithPagination({
          page,
          limit,
          select,
          sort,
          query
        });
        return new BaseResponse({ statusCode: 200, data: result })
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
        const result = await buyerService.findOne({ _id: id }, select);
        return new BaseResponse({ statusCode: 200, data: result }).return(res);
      } catch (error) {
        next(error);
      }
    }
  },
  company: {
    async get(req, res, next) {
      try {
        const { _id: company_id } = req.company;
        const { limit, page, select, sort, ...query } = req.query;
        const [result, { total_page, total }] = await buyerService.findWithPagination({
          page,
          limit,
          select,
          sort,
          query: {
            ...query,
            company_id
          }
        });
        return new BaseResponse({ statusCode: 200, data: result })
          .addMeta({ total_page, total })
          .return(res);
      } catch (error) {
        next(error);
      }
    },
    async getById(req, res, next) {
      try {
        const { _id: company_id } = req.company;
        const { id } = req.params;
        const { select } = req.query;
        const result = await buyerService.findOne(
          {
            _id: id,
            company_id
          },
          select
        );
        return new BaseResponse({ statusCode: 200, data: result }).return(res);
      } catch (error) {
        next(error);
      }
    }
  }
};
