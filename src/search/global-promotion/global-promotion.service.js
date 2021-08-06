import globalPromotionModel from './global-promotion.model';
import { mergeObject } from '../../commons/utils';
import companyService from '../company/company.service';
import notificationService from '../notification/notification.service';

export default {
  async find({ query, select, options = {} }) {
    return await globalPromotionModel.find(mergeObject({}, query), select, options);
  },
  async findOne({ query = {}, select, options = {} }) {
    return await globalPromotionModel.findOne(mergeObject({}, query), select, options);
  },
  async findById({ id, options = {}, select }) {
    return await globalPromotionModel.findById(id, select, options);
  },
  async create(data) {
    return await globalPromotionModel.create(data);
  },
  async updateOne(query, data) {
    return await globalPromotionModel.findOneAndUpdate(mergeObject({}, query), data, { new: true });
  },
  async updateById(_id, data, options = {}) {
    return await globalPromotionModel.findByIdAndUpdate(_id, data, { ...options, new: true });
  },
  async count(query) {
    return await globalPromotionModel.countDocuments(mergeObject({}, query));
  }
};
