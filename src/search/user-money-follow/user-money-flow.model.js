import { Schema, model } from 'mongoose';

const userMoneyFlowSchema = new Schema({
  user_id: Schema.Types.ObjectId,
  total_deposit: Number,
  total_refund: Number,
  total_return_refund: Number,
  total_return_commission: Number,
  total_commission: Number,
  total_withdraw: Number,
  total_withdrawal_fee: Number,
  total_pay: Number,
  total_pay_back: Number,
  total_transfer: Number,
  total_receipt: Number,
  total_gain: Number,
  total_loss: Number,
  total_pay_topup: Number,
  total_pay_bill: Number
});

const userMoneyFlowModel = model('s_user_money_flow', userMoneyFlowSchema);
userMoneyFlowModel.createCollection();
export default userMoneyFlowModel;
