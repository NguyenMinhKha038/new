import { Schema, model } from 'mongoose';
import { getDate } from '../../commons/utils';

const revenueSchema = new Schema(
  {
    date: { type: Date, default: getDate },
    company_id: { type: Schema.Types.ObjectId, required: true },
    store_id: { type: Schema.Types.ObjectId, required: true },
    //* +
    total: { type: Number, default: 0 },
    total_pay: { type: Number, default: 0 },
    total_deposit: { type: Number, default: 0 },
    //* -
    total_refund: { type: Number, default: 0 },
    total_service_fee: { type: Number, default: 0 },
    total_transport_fee: { type: Number, default: 0 },
    total_banner_fee: { type: Number, default: 0 },
    //* s
    total_discount: { type: Number, default: 0 },
    total_buyer: { type: Number, default: 0 },
    total_withdraw: { type: Number, default: 0 },
    total_withdrawal_fee: { type: Number, default: 0 }
  },
  { timestamps: true }
);

export default model('s_revenue', revenueSchema);
