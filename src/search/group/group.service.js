import { Promise } from 'bluebird';
import { Statuses } from './group.config';
import groupModel from './group.model';
import extendService from '../../commons/utils/extend-service';
import { BaseError, errorCode } from '../../commons/utils';

export default {
  ...extendService(groupModel),
  create(data, options = {}) {
    return new groupModel(data).save(options);
  },
  findOneActive(query, select, options) {
    return groupModel.findOne({ ...query, status: Statuses.Active }, select, options);
  },
  findOneActiveAndUpdate(query, updates, options = {}) {
    const opts = { ...options, new: true };
    return groupModel.findOneAndUpdate({ ...query, status: Statuses.Active }, updates, opts);
  },
  findOneActiveAndDelete(query) {
    return groupModel.findOneAndDelete({ ...query, status: Statuses.Active });
  },
  findManyActive(query, select, options) {
    return groupModel.find({ ...query, status: Statuses.Active }, select, options);
  },
  async findOneEnsure(query, select, options = {}) {
    const group = await groupModel.findOne(query, select, options);
    if (!group) {
      throw new BaseError({
        statusCode: 404,
        error: errorCode.client,
        errors: {
          group: errorCode['client.groupNotFound']
        },
        message: 'group not found'
      });
    }

    return group;
  },
  async findManyEnsure(queries, select, options = {}) {
    const groups = await Promise.map(
      queries,
      (query) => this.findOneEnsure(query, select, options),
      { concurrency: 10 }
    );

    return groups;
  }
};
