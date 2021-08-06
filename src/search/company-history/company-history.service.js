import { findAdvanced, mergeObject } from '../../commons/utils';
import companyHistoryModel from './company-history.model';

export default {
  type: {
    deposit: 'deposit', // +
    withdraw: 'withdraw',
    user_pay_order: 'user_pay_order', // +
    refund_order: 'refund_order', // -
    pay_service_fee: 'pay_service_fee', // -
    pay_transport_fee: 'pay_transport_fee', // -
    pay_banner_fee: 'pay_banner_fee', // -
    cancel_order: 'cancel_order'
  },
  async find({ limit, page, select, sort, populate, ...query }) {
    query = mergeObject({}, query);
    return await findAdvanced(companyHistoryModel, {
      limit,
      page,
      populate,
      select,
      sort,
      query
    });
  },
  async findById(id) {
    return await companyHistoryModel.findById(id);
  },
  /**
   * @param {{
   *  user_id: string
   *  company_id: string
   *  onModel: "s_deposit_withdraw"| "s_order"| "s_banner"
   *  transaction_id:string
   *  type:  "deposit"| "withdraw"| "user_pay_order"| "refund_order"| "pay_service_fee"| "pay_transport_fee"| "pay_banner_fee"
   *  value: number
   *  new_balance: number
   *  }} doc
   *  @param {any} session
   * @returns
   */

  async create(doc, { session } = {}) {
    if (doc.value) {
      doc.onModel = this.getOnModel(doc);
      return new companyHistoryModel(doc).save({ session });
    }
  },
  getOnModel(doc) {
    if (doc.onModel) return doc.onModel;
    switch (doc.type) {
      case 'deposit':
        return 's_deposit_withdraw';
      case 'user_pay_order':
        return 's_order';
      case 'pay_service_fee':
        return 's_order';
      case 'pay_transport_fee':
        return 's_order';
      case 'refund_order':
        return 's_order';
      case 'pay_banner_fee':
        return 's_banner';
    }
  },
  async count(query) {
    return await companyHistoryModel.countDocuments(mergeObject(query));
  }
};
