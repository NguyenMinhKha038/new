import userMoneyFlowModel from './user-money-flow.model';
import { QueryFindOneAndUpdateOptions } from 'mongoose';
export default {
  /**
   *
   *
   * @param {*} user_id
   * @param {{
   *       total_deposit: number,
   *       total_pay: number,
   *       total_gain: number,
   *       total_refund: number,
   *       total_withdrawal_fee: number,
   *       total_loss: number,
   *       total_withdraw: number,
   *       total_receipt: number,
   *       total_transfer: number,
   *       total_pay_topup: number,
   *       total_pay_bill: number,
   *       total_return_refund: number,
   *       total_commission: number,
   *       total_return_commission: number,
   *       total_pay_back: number
   *     }} updates
   * @param {QueryFindOneAndUpdateOptions} [options={}]
   * @returns {Promise<any>}
   */
  async update(user_id, updates, options = {}) {
    if (!user_id) return;
    return await userMoneyFlowModel.findOneAndUpdate(
      { user_id },
      { $inc: updates },
      { upsert: true, new: true, ...options }
    );
  }
};
