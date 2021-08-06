import { Schema, model } from 'mongoose';

const companyMoneyFlowSchema = new Schema(
  {
    company_id: Schema.Types.ObjectId,
    total_deposit: Number,
    total_pay: Number,
    total_refund: Number,
    total_service_fee: Number,
    total_transport_fee: Number,
    total_banner_fee: Number,
    total_gain: Number,
    total_loss: Number,
    total_withdraw: Number,
    total_withdrawal_fee: Number
  },
  { toJSON: { virtuals: true } }
);

companyMoneyFlowSchema.virtual('difference').get(function () {
  return this.total_gain - this.total_loss;
});

const companyMoneyFlow = model('s_company_money_flow', companyMoneyFlowSchema);
companyMoneyFlow.createCollection();
export default companyMoneyFlow;
