import revenueService from './revenue.service';
import { mergeObject, BaseResponse } from '../../commons/utils';

export default {
  async get(req, res, next) {
    try {
      let { limit, page, select, sort, start_time, end_time, ...rest } = req.query;
      const query = mergeObject(
        {
          date: {
            $gte: start_time,
            $lte: end_time
          }
        },
        rest
      );
      const revenues = await revenueService.find({
        limit,
        page,
        select,
        sort,
        ...query
      });
      return new BaseResponse({ statusCode: 200, data: revenues }).return(res);
    } catch (error) {
      next(error);
    }
  },
  async getByTimeType(req, res, next) {
    try {
      let { limit, page, select, sort, start_time, end_time, time_type, ...rest } = req.query;
      let timeTypeRequest = '';
      switch (time_type) {
        case 'day':
          timeTypeRequest = '$dayOfMonth';
          break;
        case 'week':
          timeTypeRequest = '$dayOfWeek';
          break;
        case 'month':
          timeTypeRequest = '$month';
          break;
        default:
          break;
      }
      start_time = new Date(req.query.start_time);
      end_time = req.query.end_time ? new Date(req.query.end_time) : new Date();

      let query = [
        {
          $match: {
            date: { $gte: start_time, $lte: end_time },
            company_id: req.company.id
          }
        },
        {
          $group: {
            _id: {
              [timeTypeRequest]: { date: '$date', timezone: 'Asia/Ho_Chi_Minh' }
            },
            total_refund: { $sum: '$total_refund' },
            total_discount: { $sum: '$total_discount' },
            total_buyer: { $sum: '$total_buyer' },
            total_banner_fee: { $sum: '$total_banner_fee' },
            total_service_fee: { $sum: '$total_service_fee' },
            total: { $sum: '$total' }
          }
        }
      ];

      const revenues = await revenueService.aggregate(query);
      return new BaseResponse({ statusCode: 200, data: revenues }).return(res);
    } catch (error) {
      next(error);
    }
  },
  async statistic(req, res, next) {
    try {
      let { start_time, end_time } = req.query;
      start_time = req.query.start_time ? new Date(req.query.start_time) : new Date();
      end_time = req.query.end_time ? new Date(req.query.end_time) : new Date();
      const revenue = await revenueService.statisticByDate({
        start_time,
        end_time,
        company_id: req.company.id
      });
      return new BaseResponse({ statusCode: 200, data: revenue }).return(res);
    } catch (error) {
      next(error);
    }
  },
  async getTotal(req, res, next) {
    try {
      let { start_time, end_time } = req.query;
      start_time = req.query.start_time ? new Date(req.query.start_time) : new Date();
      end_time = req.query.end_time ? new Date(req.query.end_time) : new Date();
      const revenue = await revenueService.getTotalByDate({
        start_time,
        end_time,
        company_id: req.company.id
      });
      return new BaseResponse({ statusCode: 200, data: revenue }).return(res);
    } catch (error) {
      next(error);
    }
  },
  async statisticStore(req, res, next) {
    try {
      let { start_time, end_time } = req.query;
      start_time = req.query.start_time ? new Date(req.query.start_time) : new Date();
      end_time = req.query.end_time ? new Date(req.query.end_time) : new Date();
      const revenue = await revenueService.statisticByStore({
        start_time,
        end_time,
        company_id: req.company.id
      });
      return new BaseResponse({ statusCode: 200, data: revenue }).return(res);
    } catch (error) {
      next(error);
    }
  },
  async statisticStoreDates(req, res, next) {
    try {
      let { start_time, end_time, store_id } = req.query;
      start_time = req.query.start_time ? new Date(req.query.start_time) : new Date();
      end_time = req.query.end_time ? new Date(req.query.end_time) : new Date();
      const revenue = await revenueService.statisticByStoreDates({
        start_time,
        end_time,
        company_id: req.company.id,
        store_id
      });
      return new BaseResponse({ statusCode: 200, data: revenue }).return(res);
    } catch (error) {
      next(error);
    }
  },
  async getById(req, res, next) {
    try {
      const { id } = req.params;
      const revenue = await revenueService.findById(id);
      return new BaseResponse({ statusCode: 200, data: revenue }).return(res);
    } catch (error) {
      next(error);
    }
  },
  async statisticCompanyDates(req, res, next) {
    try {
      let { start_time, end_time, company_id, category_id, type_category_id, group_by } = req.query;
      start_time = req.query.start_time ? new Date(req.query.start_time) : new Date();
      end_time = req.query.end_time ? new Date(req.query.end_time) : new Date();
      const revenue = await revenueService.statisticCompanyDates({
        start_time,
        end_time,
        company_id,
        category_id,
        type_category_id,
        group_by
      });
      return new BaseResponse({ statusCode: 200, data: revenue }).return(res);
    } catch (error) {
      next(error);
    }
  },
  async menuRevenueByPeriod(req, res, next) {
    try {
      const { start_time, end_time, store_id, date_order } = req.query;

      const revenueData = await revenueService.menuRevenueByStoreDates({
        start_time,
        end_time,
        store_id,
        date_order
      });
      return new BaseResponse({ statusCode: 200, data: revenueData }).return(res);
    } catch (err) {
      next(err);
    }
  },
  async menuRevenueByDate(req, res, next) {
    try {
      const { date, store_id, sort } = req.query;
      const revenueData = await revenueService.menuRevenueByStoreDate({
        date,
        store_id,
        sort
      });
      return new BaseResponse({ statusCode: 200, data: revenueData }).return(res);
    } catch (err) {
      next(err);
    }
  }
};
