import providerModel from './provider.model';
import extendService from '../../commons/utils/extend-service';
import { Statuses } from './provider.config';
import { BaseError, errorCode } from '../../commons/utils';

export default {
  ...extendService(providerModel),
  async findOneEnsure(query, select, options) {
    const provider = await providerModel.findOne(query, select, options);
    if (!provider) {
      throw new BaseError({
        statusCode: 404,
        error: errorCode.client,
        errors: { provider_id: errorCode['client.providerNotFound'] }
      });
    }

    return provider;
  },
  findOneActive(query, select, options) {
    const customQuery = { ...query, status: Statuses.Active };
    return providerModel.findOne(customQuery, select, options);
  },
  findOneActiveAndUpdate(query, updates, options = {}) {
    const customQuery = { ...query, status: Statuses.Active };
    const opts = { ...options, new: true };
    return providerModel.findOneAndUpdate(customQuery, updates, opts);
  },
  async createIfNotExist(query, data, options) {
    const exists = await providerModel.findOne(query);
    if (exists) {
      return exists;
    }

    return await providerModel.create(data, options);
  }
};
