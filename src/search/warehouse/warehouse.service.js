import elasticService from '../../commons/elastic/elastic.service';
import { logger, BaseError, errorCode } from '../../commons/utils';
import warehouseModel from './warehouse.model';
import extendService from '../../commons/utils/extend-service';
import { Statuses } from '../warehouse/warehouse.config';

export default {
  ...extendService(warehouseModel),
  // override create to use session with object data.
  // REF: https://stackoverflow.com/questions/58620144/how-to-pass-a-session-to-model-create-in-mongoose
  create(data, options = {}) {
    const warehouse = new warehouseModel(data);
    return warehouse.save(options);
  },
  findOneActive(query, select, options) {
    const customQuery = {
      ...query,
      status: Statuses.Active
    };
    return warehouseModel.findOne(customQuery, select, options);
  },
  async findOneEnsure(query, select, options) {
    const warehouse = await warehouseModel.findOne(query, select, options);
    if (!warehouse) {
      throw new BaseError({
        statusCode: 404,
        error: errorCode.client,
        errors: {
          warehouse: errorCode['client.warehouseNotFound']
        }
      });
    }

    return warehouse;
  },
  findManyActive(query, select, options) {
    const customQuery = {
      ...query,
      status: Statuses.Active
    };
    return warehouseModel.find(customQuery, select, options);
  },
  findOneActiveAndUpdate(query, updates, options = {}) {
    const customQuery = {
      ...query,
      status: Statuses.Active
    };
    const opts = { ...options, new: true };
    return warehouseModel.findOneAndUpdate(customQuery, updates, opts);
  },
  findOneActiveAndDelete(query) {
    const customQuery = {
      ...query,
      status: Statuses.Active
    };
    return warehouseModel.findOneAndDelete(customQuery);
  },
  findOneAndUpdate(query, updates, options = {}) {
    return warehouseModel.findOneAndUpdate(query, updates, { ...options, new: true });
  },
  async indexElasticSearch(query) {
    if (!elasticService.active) return;
    warehouseModel.find(query, null, { populate: warehouseOptions.populate }).then((warehouses) => {
      warehouses.map((warehouse) => {
        try {
          const { name, address, company_id, type_category_id, company_category_id } = warehouse;
          elasticService.client.index({
            id: warehouse.id,
            type: warehouseModel.modelName,
            index: warehouseModel.collection.name,
            body: {
              name,
              address,
              company_id,
              type_category_id,
              company_category_id,
              coordinates: warehouse.location.coordinates,
              result_type: 'warehouse',
              showable: warehouse.status === Statuses.Active && warehouse.is_active_company === true
            }
          });
        } catch (error) {
          logger.error(error);
        }
      });
    });
  }
};
