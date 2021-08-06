import fakeUserModel from './fake-user.model';
import { findAdvanced } from '../../commons/utils';

export default {
  find({ limit, page, populate, select, sort, ...query }) {
    return findAdvanced(fakeUserModel, { limit, page, populate, query, select, sort });
  },
  findOne(query) {
    return fakeUserModel.findOne(query).exec();
  },
  count(query) {
    return fakeUserModel.countDocuments(query).exec();
  }
};
