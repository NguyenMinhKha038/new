import globalPromotionRegistrationModel from './global-promotion-registration.model';
import { BaseError, errorCode, mergeObject } from '../../commons/utils';

export default {
  async find({ query, select, options = {} }) {
    return await globalPromotionRegistrationModel.find(mergeObject({}, query), select, options);
  },
  async findById({ id, select, options }) {
    return await globalPromotionRegistrationModel.findById(id, select, {
      ...options,
      populate: [{ path: 'global_promotion' }, { path: 'company', select: '-chat_password' }]
    });
  },
  async count(query) {
    return await globalPromotionRegistrationModel.countDocuments(mergeObject({}, query));
  },
  async create(data, options = {}) {
    return await globalPromotionRegistrationModel.create(data, options);
  },
  async findOne({ select, options = {}, ...query }) {
    return await globalPromotionRegistrationModel.findOne(mergeObject({}, query), select, options);
  },
  async updateById(id, data, options = {}) {
    return await globalPromotionRegistrationModel.findByIdAndUpdate(id, data, {
      ...options,
      new: true
    });
  },
  async findEnsure(query, options, populate) {
    const registration = await globalPromotionRegistrationModel
      .findOne(mergeObject({}, query), options)
      .populate(populate);
    if (!registration) {
      throw new BaseError({
        statusCode: 400,
        error: errorCode.client,
        errors: {
          promotion_registration: errorCode['client.registrationPromotionNotExists']
        }
      });
    }
    return registration;
  },
  async updateTime({ id, start_at, expire_at, global_promotion_status, options = {} }) {
    return await globalPromotionRegistrationModel.update(
      {
        global_promotion_id: id
      },
      {
        start_at,
        expire_at,
        global_promotion_status
      },
      options
    );
  }
};
