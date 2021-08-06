import companyMoneyFlowModel from './company-money-flow.model';
import { findAdvanced, mergeObject } from '../../commons/utils';
import { QueryFindOneAndUpdateOptions } from 'mongoose';
export default {
  async get({ limit, page, select, sort, ...query }) {
    return findAdvanced(companyMoneyFlowModel, {
      query,
      limit,
      page,
      select,
      sort
    });
  },
  /**
   *
   *
   * @param {*} company_id
   * @param {{
   *       total_deposit: number,
   *       total_pay: number,
   *       total_gain: number,
   *       total_refund: number,
   *       total_service_fee: number,
   *       total_transport_fee: number,
   *       total_withdrawal_fee: number,
   *       total_banner_fee: number,
   *       total_loss: number,
   *       total_withdraw: number
   *     }} updates
   * @param {QueryFindOneAndUpdateOptions} options
   * @returns {Promise<any>}
   */
  async update(company_id, updates, options = {}) {
    return await companyMoneyFlowModel.findOneAndUpdate(
      { company_id },
      { $inc: updates },
      { upsert: true, new: true, ...options }
    );
  },
  async count(query) {
    return companyMoneyFlowModel.countDocuments(mergeObject({}, query));
  }
};
