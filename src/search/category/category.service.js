import { BaseError, errorCode, findAdvanced, mergeObject } from '../../commons/utils';
import categoryModel from './category.model';
// import fs from 'fs';

// categoryModel.find().then(async (data) => {
//   fs.writeFileSync('assets/new-category.json', JSON.stringify(data), 'utf8');
// });

export default {
  async find({ limit = 100, page, select, sort, populate, ...query }) {
    return findAdvanced(categoryModel, {
      query: mergeObject({}, query),
      limit,
      page,
      select,
      sort,
      populate
    });
  },
  async findOne(query, select, options = {}) {
    return await categoryModel.findOne(query, select, options);
  },
  async findById(id, select, options = {}) {
    const category = await categoryModel.findById(id, select, options);
    if (!category)
      throw new BaseError({
        statusCode: 400,
        error: errorCode.client,
        errors: { category_id: errorCode['client.categoryNotExist'] }
      });
    return category;
  },
  async findActive(id, type) {
    const category = await categoryModel.findOne(
      mergeObject({ _id: id, status: 'active' }, { type })
    );
    if (!category)
      throw new BaseError({
        statusCode: 400,
        error: errorCode.client,
        errors: { category_id: errorCode['client.categoryNotExist'] }
      });
    return category;
  },
  async createAndPopulate(doc, options, populate) {
    return await (await new categoryModel(doc).save(options)).populate(populate).execPopulate();
  },
  async update(id, doc, populate) {
    return await categoryModel
      .findByIdAndUpdate(id, doc, { runValidators: true, new: true })
      .populate(populate);
  },
  async remove(query) {
    return await categoryModel.findOneAndDelete(query);
  },
  async count(query) {
    return await categoryModel.countDocuments(mergeObject({}, query));
  },
  async isValidParent({ type, parent_id }) {
    const isMatch = await categoryModel.findOne({
      type: type - 1,
      _id: parent_id,
      status: 'active'
    });
    if (!isMatch) {
      throw new BaseError({
        statusCode: 400,
        error: errorCode.client,
        errors: { parent_id: errorCode['client.categoryParentNotMatch'] }
      });
    }
    return isMatch;
  },
  async insertMany(data) {
    return await categoryModel.insertMany(data);
  }
};
