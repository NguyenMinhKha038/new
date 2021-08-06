import settingModel from './setting.model';

export default {
  async get(company_id, options = {}) {
    return settingModel.findOneAndUpdate(
      { company_id },
      {},
      { setDefaultsOnInsert: true, new: true, upsert: true, ...options }
    );
  },
  async getByKey(company_id, setting) {
    return settingModel
      .findOneAndUpdate({ company_id }, {}, { setDefaultsOnInsert: true, new: true, upsert: true })
      .select(setting);
  },
  async create(doc) {
    return await settingModel.create(doc);
  },
  async update(company_id, doc) {
    return settingModel.findOneAndUpdate({ company_id }, doc, {
      runValidators: true,
      new: true,
      upsert: true
    });
  }
};
