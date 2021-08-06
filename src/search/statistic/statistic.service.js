import statisticModel from './statistic.model';
import { findAdvanced, getDate, mergeObject } from '../../commons/utils';

const statisticService = {
  async find(conditions = { limit: '', page: '', select: '', sort: '', query: {} }) {
    const statistics = await findAdvanced(statisticModel, conditions);
    return statistics;
  },
  async statisticByDate({ start_time, end_time }) {
    [start_time, end_time] = [
      getDate(start_time),
      getDate(new Date(end_time.setDate(end_time.getDate() + 1)))
    ];
    const statistics = await statisticModel.aggregate([
      {
        $match: {
          date: { $gte: start_time, $lte: end_time }
        }
      },
      {
        $group: {
          _id: null,
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
          total_commission: { $sum: '$total_commission' },
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
          total_pay_topup: { $sum: 'total_pay_topup' },
          total_pay_topup_combo: { $sum: 'total_pay_topup_combo' },
          total_pay_bill: { $sum: 'total_pay_bill' }
        }
      }
    ]);
    return statistics;
  },
  async findById(_id) {
    return statisticModel.findById(_id);
  },
  async update(
    update = {
      total_company: 0,
      total_store: 0,
      total_user: 0,
      total_product: 0,
      total_pay: 0,
      total_deposit_user: 0,
      total_transfer: 0,
      total_withdrawal: 0,
      total_order: 0,
      total_revenue: 0,
      total_refund: 0,
      total_commission: 0,
      total_discount: 0,
      total_promotion: 0,
      total_promotion_code: 0,
      total_view: 0,
      total_like: 0,
      total_comment: 0,
      total_share: 0,
      total_rate: 0,
      total_deposit_company: 0,
      total_banner_fee: 0,
      total_service_fee: 0,
      total_withdrawal_fee: 0,
      total_report: 0,
      total_withdrawal_company: 0,
      total_pay_topup: 0,
      total_pay_topup_combo: 0,
      total_pay_bill: 0
    }
  ) {
    return statisticModel.findOneAndUpdate(
      { date: getDate() },
      { $inc: mergeObject({}, update) },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
  },
  async aggregate(pipeline) {
    return statisticModel.aggregate(pipeline);
  }
};

export default statisticService;
