import { Promise } from 'bluebird';
import { Statuses, Scopes, Types } from './tag.config';
import tagModel from './tag.model';
import extendService from '../../commons/utils/extend-service';
import { BaseError, errorCode } from '../../commons/utils';

export default {
  ...extendService(tagModel),
  create(data, options = {}) {
    return new tagModel(data).save(options);
  },
  findOneActive(query, select, options) {
    return tagModel.findOne({ ...query, status: Statuses.Active }, select, options);
  },
  findOneActiveAndUpdate(query, updates, options = {}) {
    const opts = { ...options, new: true };
    return tagModel.findOneAndUpdate({ ...query, status: Statuses.Active }, updates, opts);
  },
  findOneActiveAndDelete(query) {
    return tagModel.findOneAndDelete({ ...query, status: Statuses.Active });
  },
  findManyActive(query, select, options) {
    return tagModel.find({ ...query, status: Statuses.Active }, select, options);
  },
  findOneUnexpired(query, select, options = {}) {
    const { $or: orQuery, ...q } = query;
    const customQuery = {
      ...q,
      status: Statuses.Active
    };
    if (orQuery) {
      customQuery['$and'] = [
        { $or: orQuery },
        {
          $or: [{ type: Types.Permanent }, { type: Types.Flash, expiry_date: { $gt: new Date() } }]
        }
      ];
    } else {
      customQuery['$or'] = [
        { type: Types.Permanent },
        { type: Types.Flash, expiry_date: { $gt: new Date() } }
      ];
    }
    return tagModel.findOne(customQuery, select, options);
  },
  findOneUnexpiredAndUpdate(query, updates, options = {}) {
    const { $or: orQuery, ...q } = query;
    const customQuery = {
      ...q,
      status: Statuses.Active
    };
    if (orQuery) {
      customQuery['$and'] = [
        { $or: orQuery },
        {
          $or: [{ type: Types.Permanent }, { type: Types.Flash, expiry_date: { $gt: new Date() } }]
        }
      ];
    } else {
      customQuery['$or'] = [
        { type: Types.Permanent },
        { type: Types.Flash, expiry_date: { $gt: new Date() } }
      ];
    }

    return tagModel.findOneAndUpdate(customQuery, updates, options);
  },
  findManyUnexpired(query, select, options = {}) {
    const { $or: orQuery, ...q } = query;
    const customQuery = {
      ...q,
      status: Statuses.Active
    };
    if (orQuery) {
      customQuery['$and'] = [
        { $or: orQuery },
        {
          $or: [{ type: Types.Permanent }, { type: Types.Flash, expiry_date: { $gt: new Date() } }]
        }
      ];
    } else {
      customQuery['$or'] = [
        { type: Types.Permanent },
        { type: Types.Flash, expiry_date: { $gt: new Date() } }
      ];
    }

    return tagModel.find(customQuery, select, options);
  },
  async findOneEnsure(query, select, options = {}) {
    const tag = await this.findOneUnexpired(query, select, options);
    if (!tag) {
      throw new BaseError({
        statusCode: 404,
        error: errorCode.client,
        errors: {
          tag: errorCode['client.tagNotFound']
        },
        message: 'tag not found'
      });
    }

    return tag;
  },
  async findManyEnsure(queries, select, options = {}) {
    const tags = await Promise.map(queries, (query) => this.findOneEnsure(query, select, options), {
      concurrency: 10
    });

    return tags;
  }
};
