import { Promise } from 'bluebird';
import { companyLogisticsAccountModel } from './logistics.model';

export default {
  async find({ limit, page, select, sort, ...query }) {
    const logistics = await companyLogisticsAccountModel.find(query, null, {
      limit,
      skip: limit * page,
      sort,
      select
    });
    await Promise.map(logistics, (l) => l.setInfo());
    return logistics;
  },
  async findById(_id) {
    return companyLogisticsAccountModel.findById(_id);
  },
  async findOne(query, select, options) {
    return companyLogisticsAccountModel.findOne(query, select, options);
  },
  async count(query) {
    return companyLogisticsAccountModel.countDocuments(query);
  },
  async create(doc) {
    return companyLogisticsAccountModel.create(doc);
  },
  async updateOne(query, doc, options) {
    return companyLogisticsAccountModel.findOneAndUpdate(query, doc, options);
  }
};
