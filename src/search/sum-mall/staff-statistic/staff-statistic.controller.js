import mallService from '../mall/mall.service';
import { BaseResponse, BaseError } from '../../../commons/utils';
import staffCheckInService from '../staff-check-in/staff-check-in.service';
import { MallStatuses } from '../mall/mall.config';
import moment from 'moment';

export default {
  admin: {
    async get(req, res, next) {
      try {
        const { limit, page, select, sort, from, to, ...query } = req.query;
        const skip = page ? (page - 1) * limit : 0;
        const mainQuery = from ? { ...query, date: { $lte: to, $gte: from } } : query;
        const formatDate = moment().utc(new Date()).startOf('day').toDate();
        const result = await staffCheckInService.aggregate([
          { $match: mainQuery },
          {
            $group: {
              _id: '$staff_id',
              total_present_shifts: {
                $sum: { $cond: [{ $eq: ['$is_finish', true] }, 1, 0] }
              },
              total_absent_shifts: {
                $sum: {
                  $cond: [
                    { $and: [{ $eq: ['$is_finish', false] }, { $lt: ['$date', formatDate] }] },
                    1,
                    0
                  ]
                }
              },
              total_salaries: {
                $sum: {
                  $cond: [
                    { $eq: ['$is_finish', true] },
                    {
                      $multiply: [
                        '$salary_per_hour',
                        { $subtract: ['$work_shift.to', '$work_shift.from'] }
                      ]
                    },
                    0
                  ]
                }
              }
            }
          },
          {
            $addFields: {
              staff_id: '$_id'
            }
          },
          { $skip: skip }
        ]);
        const total_page = limit ? Math.ceil(result.length / limit) : 1;
        return new BaseResponse({ statusCode: 200, data: result })
          .addMeta({ total_page, total: result.length })
          .return(res);
      } catch (error) {
        next(error);
      }
    }
  },
  mall: {
    async get(req, res, next) {
      try {
        const { user_id: manager_id } = req.mall;
        const { limit, page, select, sort, from, to, ...query } = req.query;
        const mall = await mallService.findEnsure({
          manager_id,
          status: MallStatuses.Active
        });
        const mall_id = mall ? mall._id : null;
        const skip = page ? (page - 1) * skip : 0;
        const mainQuery = from
          ? { ...query, date: { $lte: to, $gte: from }, mall_id }
          : { ...query, mall_id };
        const formatDate = moment().utc(new Date()).startOf('day').toDate();
        const result = await staffCheckInService.aggregate([
          { $match: mainQuery },
          {
            $group: {
              _id: '$staff_id',
              total_present_shifts: {
                $sum: { $cond: [{ $eq: ['$is_finish', true] }, 1, 0] }
              },
              total_absent_shifts: {
                $sum: {
                  $cond: [
                    { $and: [{ $eq: ['$is_finish', false] }, { $lt: ['$date', formatDate] }] },
                    1,
                    0
                  ]
                }
              },
              total_salaries: {
                $sum: {
                  $cond: [
                    { $eq: ['$is_finish', true] },
                    {
                      $multiply: [
                        '$salary_per_hour',
                        { $subtract: ['$work_shift.to', '$work_shift.from'] }
                      ]
                    },
                    0
                  ]
                }
              }
            }
          },
          {
            $addFields: {
              staff_id: '$_id'
            }
          },
          { $skip: skip }
        ]);
        const total_page = limit ? Math.ceil(result.length / limit) : 0;
        return new BaseResponse({ statusCode: 200, data: result })
          .addMeta({ total_page, total: result.length })
          .return(res);
      } catch (error) {
        next(error);
      }
    }
  },
  staff: {
    async get(req, res, next) {
      try {
        const { staff_id } = req.mall;
        const { limit, page, select, sort, from, to, ...query } = req.query;
        const mainQuery = from
          ? { ...query, date: { $lte: to, $gte: from }, staff_id }
          : { ...query, staff_id };
        const skip = page ? (page - 1) * skip : 0;
        const formatDate = moment().utc(new Date()).startOf('day').toDate();
        const result = await staffCheckInService.aggregate([
          { $match: mainQuery },
          {
            $group: {
              _id: '$staff_id',
              total_present_shifts: {
                $sum: { $cond: [{ $eq: ['$is_finish', true] }, 1, 0] }
              },
              total_absent_shifts: {
                $sum: {
                  $cond: [
                    { $and: [{ $eq: ['$is_finish', false] }, { $lt: ['$date', formatDate] }] },
                    1,
                    0
                  ]
                }
              },
              total_salaries: {
                $sum: {
                  $cond: [
                    { $eq: ['$is_finish', true] },
                    {
                      $multiply: [
                        '$salary_per_hour',
                        { $subtract: ['$work_shift.to', '$work_shift.from'] }
                      ]
                    },
                    0
                  ]
                }
              }
            }
          },
          {
            $addFields: {
              staff_id: '$_id'
            }
          },
          { $skip: skip }
        ]);
        const total_page = limit ? Math.ceil(result.length / limit) : 0;
        return new BaseResponse({ statusCode: 200, data: result })
          .addMeta({ total_page, total: result.length })
          .return(res);
      } catch (error) {
        next(error);
      }
    }
  }
};
