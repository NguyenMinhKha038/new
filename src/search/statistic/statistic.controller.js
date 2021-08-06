import statisticService from './statistic.service';
import { mergeObject, BaseResponse } from '../../commons/utils';

export default {
  async get(req, res, next) {
    try {
      let { limit, page, select, sort, start_time, end_time, ...rest } = req.query;
      if (start_time && end_time) {
        rest = {
          ...rest,
          date: {
            $gte: new Date(start_time),
            $lte: new Date(end_time)
          }
        };
      }
      const statistics = await statisticService.find({
        limit,
        page,
        select,
        sort,
        query: rest
      });
      return new BaseResponse({ statusCode: 200, data: statistics }).return(res);
    } catch (error) {
      next(error);
    }
  },
  async statistic(req, res, next) {
    try {
      let { start_time, end_time } = req.query;
      start_time = req.query.start_time ? new Date(req.query.start_time) : new Date();
      end_time = req.query.end_time ? new Date(req.query.end_time) : new Date();
      const statistic = await statisticService.statisticByDate({
        start_time,
        end_time
      });
      return new BaseResponse({ statusCode: 200, data: statistic[0] }).return(res);
    } catch (error) {
      next(error);
    }
  },
  async getById(req, res, next) {
    try {
      const { id } = req.params;
      const statistic = await statisticService.findById(id);
      return new BaseResponse({ statusCode: 200, data: statistic }).return(res);
    } catch (error) {
      next(error);
    }
  },
  async statisticByTimeType(req, res, next) {
    try {
      const { start_time, end_time, time_type } = req.query;
      let timeConvert = '';
      switch (time_type) {
        case 'day':
          timeConvert = '$dayOfMonth';
          break;
        case 'week':
          timeConvert = '$week';
          break;
        case 'month':
          timeConvert = '$month';
          break;
      }
      const pipeline = [
        {
          $match: {
            date: {
              $gte: new Date(start_time),
              $lte: new Date(end_time)
            }
          }
        },
        {
          $group: {
            _id: {
              [timeConvert]: { date: '$date', timezone: 'Asia/Ho_Chi_Minh' }
            },
            total_company: { $sum: '$total_company' },
            total_store: { $sum: '$total_store' },
            total_user: { $sum: '$total_user' },
            total_product: { $sum: '$total_product' },
            total_pay: { $sum: '$total_pay' },
            total_deposit_user: { $sum: '$total_deposit_user' },
            total_transfer: { $sum: '$total_transfer' },
            total_withdrawal: { $sum: '$total_withdrawal' },
            total_deposit_company: { $sum: '$total_deposit_company' },
            total_withdrawal_company: { $sum: '$total_withdrawal_company' },
            total_order: { $sum: '$total_order' },
            total_revenue: { $sum: '$total_revenue' },
            total_refund: { $sum: '$total_refund' },
            total_discount: { $sum: '$total_discount' },
            total_promotion: { $sum: '$total_promotion' },
            total_promotion_code: { $sum: '$total_promotion_code' },
            total_view: { $sum: 'total_view' },
            total_like: { $sum: 'total_like' },
            total_comment: { $sum: 'total_comment' },
            total_share: { $sum: 'total_share' },
            total_rate: { $sum: 'total_rate' },
            total_banner_fee: { $sum: 'total_banner_fee' },
            total_service_fee: { $sum: 'total_service_fee' },
            total_report: { $sum: 'total_service_fee' },
            total_pay_topup: { $sum: 'total_pay_topup' }
          }
        },
        {
          $sort: {
            _id: 1
          }
        }
      ];
      const response = await statisticService.aggregate(pipeline);
      return res.send(new BaseResponse({ statusCode: 201, data: response }));
    } catch (err) {
      next(err);
    }
  }
  // async
};
