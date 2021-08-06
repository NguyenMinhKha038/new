import { findAdvanced, mergeObject, BaseError, errorCode } from '../../commons/utils';
import bannerModel from './banner.model';

export default {
  async find({ limit = 0, page, select, sort, populate, company_id, status, active, ...params }) {
    const query = mergeObject({}, { status, company_id }, params);
    return await findAdvanced(bannerModel, {
      limit,
      page,
      select,
      sort,
      query,
      populate
    });
  },
  async findOne(query, select, options) {
    return await bannerModel.findOne(query, select, options);
  },
  async findById(id, select, options) {
    const banner = await bannerModel.findById(id, select, options);
    if (!banner)
      throw new BaseError({
        statusCode: 400,
        error: errorCode.client,
        errors: errorCode['client.bannerNotExist']
      });
    return banner;
  },
  async findActive(id) {
    const banner = await bannerModel.findOne({
      _id: id,
      status: 'approved',
      is_active_company: true,
      start_time: { $lte: new Date() },
      end_time: { $gte: new Date() }
    });
    if (!banner)
      throw new BaseError({
        statusCode: 400,
        error: errorCode.client,
        errors: { banner: errorCode['client.bannerNotExist'] }
      });
    return banner;
  },
  async isOwner(banner_id, user_id) {
    const banner = await this.findById(banner_id);
    if (banner.user_id.toString() !== user_id)
      throw new BaseError({
        statusCode: 401,
        error: errorCode.authorization,
        errors: {
          permission: errorCode['permission.notAllow']
        }
      });
  },
  async create(doc) {
    const banner = await bannerModel.create(doc);
    return banner;
  },
  async update(query, doc) {
    const banner = await bannerModel.findByIdAndUpdate(query, doc, {
      new: true,
      runValidators: true
    });
    return banner;
  },
  async updateMany(query, doc) {
    const banner = await bannerModel.updateMany(query, doc, { multi: true });
    return banner;
  },
  async count(query) {
    const total = await bannerModel.countDocuments(mergeObject({}, query));
    return total;
  },
  async remove(id) {
    await bannerModel.findByIdAndRemove(id);
    return;
  },
  async aggregate(query) {
    return await bannerModel.aggregate(query);
    // return;
  },
  async isExistBanner({ position, start_time, end_time, session, exclude_id }) {
    const isExistBanner = await this.findOne(
      {
        ...(exclude_id ? { _id: { $ne: exclude_id } } : {}),
        status: 'approved',
        position: position,
        $or: [
          {
            start_time: { $lte: start_time },
            end_time: { $lte: end_time, $gte: start_time }
          },
          {
            start_time: { $lte: start_time },
            end_time: { $gte: end_time }
          },
          {
            start_time: { $gte: start_time },
            end_time: { $lte: end_time }
          },
          {
            start_time: { $gte: start_time, $lte: end_time },
            end_time: { $gte: end_time }
          }
        ]
      },
      null,
      { session }
    );
    if (isExistBanner)
      throw new BaseError({
        statusCode: 403,
        error: errorCode.client,
        errors: { banner: errorCode['client.bannerIsExist'] }
      });
  }
};
