import { BaseResponse } from '../../commons/utils';
import supportReasonService from './support-reason.service';

export default {
  get: async (req, res, next) => {
    try {
      const { limit: pageSize, page, sort, ...query } = req.query;
      const limit = pageSize || 20;
      const skip = page ? (page - 1) * limit : 0;
      const [data, total] = await Promise.all([
        supportReasonService.find(query, {}, { limit, skip, sort }),
        supportReasonService.count(query)
      ]);

      const totalPage = Math.ceil(total / limit);
      return new BaseResponse({ statusCode: 200, data }).addMeta({ total, totalPage }).return(res);
    } catch (error) {
      return next(error);
    }
  },
  admin: {
    create: async (req, res, next) => {
      try {
        const body = req.body;
        const data = await supportReasonService.create(body);
        return new BaseResponse({ statusCode: 200, data }).return(res);
      } catch (error) {
        return next(error);
      }
    },
    update: async (req, res, next) => {
      try {
        const { _id, ...doc } = req.body;
        const data = await supportReasonService.findOneAndUpdate(
          { _id },
          { ...doc },
          { new: true }
        );
        return new BaseResponse({ statusCode: 200, data }).return(res);
      } catch (error) {
        return next(error);
      }
    }
  }
};
