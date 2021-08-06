import { Schema, model } from 'mongoose';
import { getDate } from '../../commons/utils';

const statisticSchema = new Schema(
  {
    date: { type: Date, default: getDate },
    total_company: { type: Number, default: 0 },
    total_store: { type: Number, default: 0 },
    total_user: { type: Number, default: 0 },
    total_product: { type: Number, default: 0 },
    total_pay: { type: Number, default: 0 },
    total_deposit_user: { type: Number, default: 0 },
    total_transfer: { type: Number, default: 0 },
    total_withdrawal: { type: Number, default: 0 },
    total_order: { type: Number, default: 0 },
    total_revenue: { type: Number, default: 0 },
    total_deposit_company: { type: Number, default: 0 },
    total_withdrawal_company: { type: Number, default: 0 },
    total_refund: { type: Number, default: 0 },
    total_commission: { type: Number, default: 0 },
    total_discount: { type: Number, default: 0 },
    total_promotion: { type: Number, default: 0 },
    total_promotion_code: { type: Number, default: 0 },
    total_view: { type: Number, default: 0 },
    total_like: { type: Number, default: 0 },
    total_comment: { type: Number, default: 0 },
    total_share: { type: Number, default: 0 },
    total_rate: { type: Number, default: 0 },
    total_banner_fee: { type: Number, default: 0 },
    total_service_fee: { type: Number, default: 0 },
    total_withdrawal_fee: { type: Number, default: 0 },
    total_report: { type: Number, default: 0 },
    total_pay_topup: { type: Number, default: 0 },
    total_pay_topup_combo: { type: Number, default: 0 },
    total_transport_fee: { type: Number, default: 0 },
    total_pay_bill: { type: Number, default: 0 }
  },
  { timestamps: true }
);

export default model('s_statistic', statisticSchema);
