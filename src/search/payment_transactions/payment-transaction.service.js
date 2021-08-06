import paymentTransactionModel from './payment-transaction.model';
import findAdvanced from '../../commons/utils/find-advanced';
import { BaseError, errorCode, mergeObject } from '../../commons/utils';
import { create } from 'lodash';

export default {
  find({ limit, page, select, sort, populate, ...query }) {
    return findAdvanced(paymentTransactionModel, {
      query: mergeObject({}, query),
      limit,
      page,
      select,
      sort,
      populate
    });
  },
  /**
   * @param {{  
   *  order_id, 
   *  user_id, 
   *  company_id, 
   *  store_id,
   *  is_confirmed 
   * }} query
   * @return { Promise<Document> }
   */
  findOne(query, select, options) {
    return paymentTransactionModel.findOne(query, select, options);
  },
  /**
   * @param {{  
    *  order_id: string, 
    *  user_id: string, 
    *  company_id: string, 
    *  store_id: string,
    *  total_refund: number,
    *  commission: number,
    *  total: number 
    * }} doc
    * @return { Promise<Document> }
    */
  create(doc, options) {
    return new paymentTransactionModel(doc).save(options); 
  },
  confirm(id, options) {
    return paymentTransactionModel.findOneAndUpdate({ _id: id }, { is_confirmed: true }, options);
  },
  findOneAndUpdate(query, updates, options) {
    return paymentTransactionModel.findOneAndUpdate(query, updates, options);
  }
}