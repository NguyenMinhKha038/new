import warehouseStoringModel from './warehouse-storing.model';
import extendService from '../../commons/utils/extend-service';
import { Statuses } from './warehouse-storing.config';
import { BaseError, errorCode } from '../../commons/utils';

export default {
  ...extendService(warehouseStoringModel),
  findOneActive(query, select, options) {
    const customQuery = {
      ...query,
      status: Statuses.Active
    };
    return warehouseStoringModel.findOne(customQuery, select, options);
  },
  findOneActiveAndUpdate(query, updates, options = {}) {
    const customQuery = {
      ...query,
      status: Statuses.Active
    };
    const opts = { ...options, new: true };
    return warehouseStoringModel.findOneAndUpdate(customQuery, updates, opts);
  },
  findOneActiveAndDelete(query) {
    const customQuery = {
      ...query,
      status: Statuses.Active
    };
    return warehouseStoringModel.findOneAndDelete(customQuery);
  },
  findOneAndUpdate(query, updates, options = {}) {
    return warehouseStoringModel.findOneAndUpdate(query, updates, { ...options, new: true });
  },
  async findOneEnsure(query, select, options = {}) {
    const warehouseStoring = await warehouseStoringModel.findOne(query, select, options);
    if (!warehouseStoring) {
      throw new BaseError({
        statusCode: 404,
        error: errorCode.client,
        errors: { warehouse_storing_id: errorCode['client.warehouseStoringNotFound'] }
      });
    }

    return warehouseStoring;
  },
  create({ _id, id, __v, updatedAt, createdAt, ...doc }, options = {}) {
    const newDoc = new warehouseStoringModel(doc);
    return newDoc.save(options);
  },
  upsert(query, doc, options = {}) {
    return warehouseStoringModel.findOneAndUpdate(query, doc, {
      runValidators: true,
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
      ...options
    });
  }
};
