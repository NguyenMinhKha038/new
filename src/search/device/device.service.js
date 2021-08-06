import deviceModel from './device.model';
import { findAdvanced } from '../../commons/utils';

export default {
  find({ limit, page, populate, select, session, sort, ...query } = {}) {
    return findAdvanced(deviceModel, { limit, page, populate, query, select, sort, session });
  },
  findOne(...params) {
    return deviceModel.findOne(...params).exec();
  },
  createOrUpdate(query, doc) {
    return deviceModel
      .findOneAndUpdate(
        query,
        { ...doc, expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000 },
        { new: true, upsert: true, setDefaultsOnInsert: true }
      )
      .exec();
  }
};
