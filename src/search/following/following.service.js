import followingModel from './following.model';
import companyService from '../company/company.service';
import { mergeObject, findAdvanced } from '../../commons/utils';

export default {
  async find({ limit, page, select, sort, user_id }) {
    const followings = await findAdvanced(followingModel, {
      query: { user_id },
      limit,
      page,
      select,
      sort,
      populate: {
        path: 'company_id',
        select: '-views -shares -likes -rates'
      }
    });
    return followings;
  },
  async findByUserId(user_id, company_id) {
    return followingModel.findOne(mergeObject({}, { user_id, company_id }));
  },
  async update(user_id, company_id) {
    await companyService.findActive(company_id);
    const following = await followingModel.findOneAndUpdate(
      { user_id, company_id },
      {},
      { upsert: true, new: true, runValidators: true, rawResult: true }
    );
    return following;
  },
  async create(doc) {
    return await followingModel.create(doc);
  },
  async delete(user_id, company_id) {
    return followingModel.findOneAndDelete({ user_id, company_id });
  },
  async count(query) {
    return followingModel.countDocuments(mergeObject({}, query));
  }
};
