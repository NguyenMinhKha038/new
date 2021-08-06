import { Promise } from 'bluebird';
import sellingOptionModel from './selling-option.model';
import extendService from '../../commons/utils/extend-service';
import { Statuses } from './selling-option.config';
import { BaseError, errorCode } from '../../commons/utils';

export default {
  ...extendService(sellingOptionModel),
  create(data, options = {}) {
    return new sellingOptionModel(data).save(options);
  },
  findOneActive(query, select, options) {
    return sellingOptionModel.findOne({ ...query, status: Statuses.Active }, select, options);
  },
  findOneActiveAndUpdate(query, updates, options = {}) {
    const opts = { ...options, new: true };
    return sellingOptionModel.findOneAndUpdate(
      { ...query, status: Statuses.Active },
      updates,
      opts
    );
  },
  findOneActiveAndDelete(query) {
    return sellingOptionModel.findOneAndDelete({ ...query, status: Statuses.Active });
  },
  findManyActive(query, select, options) {
    return sellingOptionModel.find({ ...query, status: Statuses.Active }, select, options);
  },
  async findOneEnsure(query, select, options = {}) {
    const sellingOption = await sellingOptionModel.findOne(query, select, options);
    if (!sellingOption) {
      throw new BaseError({
        statusCode: 404,
        error: errorCode.client,
        errors: {
          selling_option: errorCode['client.sellingOptionNotFound']
        },
        message: 'option not found'
      });
    }

    return sellingOption;
  },
  async findManyEnsure(queries, select, options = {}) {
    const sellingOptions = await Promise.map(
      queries,
      (query) => this.findOneEnsure(query, select, options),
      { concurrency: 10 }
    );

    return sellingOptions;
  }
};
