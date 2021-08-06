import topupModel from './topup.model';
import { findAdvanced } from '../../commons/utils';
import topupComboModel from './topup-combo.model';

const topup = {
  /**
   *
   *
   * @param {TopUp} doc
   * @returns {Promise<TopUp&MongooseDocument>}
   */
  create(doc, { session } = {}) {
    return new topupModel(doc).save({ session });
  },
  /**
   *
   *
   * @param {{limit:number, page:number, populate: [], select: string, sort: string} & TopUp } param
   * @returns {Promise<TopUp&MongooseDocument[]>}
   */
  find({ limit, page, populate, select, sort, ...query }) {
    return findAdvanced(topupModel, { limit, page, populate, query, select, sort });
  },
  async findOne(query, select, options) {
    return topupModel.findOne(query, select, options);
  },
  async count(query) {
    return topupModel.countDocuments(query);
  }
};
const combo = {
  /**
   *
   *
   * @param {TopUpCombo} doc
   * @returns {Promise<TopUpCombo&MongooseDocument>}
   */
  create(doc, { session } = {}) {
    return new topupComboModel(doc).save({ session });
  },
  /**
   *
   *
   * @param {{limit:number, page:number, populate: [], select: string, sort: string} & TopUpCombo } param
   * @returns {Promise<TopUpCombo&MongooseDocument[]>}
   */
  find({ limit, page, populate, select, sort, ...query }) {
    return findAdvanced(topupComboModel, { limit, page, populate, query, select, sort });
  },
  async findOne(query, select, options) {
    return topupComboModel.findOne(query, select, options);
  },
  async count(query) {
    return topupComboModel.countDocuments(query);
  }
};

export default {
  topup: topup,
  combo: combo
};
