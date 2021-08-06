import mallActivityModel from './mall-activity.model';
import extendService from '../../../commons/utils/extend-service';
import _ from 'lodash';
import { mergeObject, BaseError, errorCode, logger } from '../../../commons/utils';

export default {
  ...extendService(mallActivityModel),
  async findEnsure({ select, options, ...query }) {
    const activity = await this.findOne(mergeObject({}, query), select, options);
    if (!activity) {
      throw new BaseError({
        statusCode: 400,
        error: errorCode.client,
        errors: {
          activity: errorCode['client.mallActivityNotExists']
        }
      });
    }
    return activity;
  },
  implicitCreate(action) {
    return (req, updates, { excludeFields = [], isExcludeData = false } = {}) => {
      if (!req.mall) return;
      const data = isExcludeData ? {} : _.omit(req.body, excludeFields);
      const doc = {
        mall_id: req.mall._id,
        data: Object.assign(data, req.params),
        resource: req.originalUrl,
        method: req.method,
        user_id: req.user._id,
        ...action
      };
      if (typeof doc !== 'object' || doc === null) return;
      return this.create({ ...doc, ...updates });
    };
  },
  async create({ mall_id, user_id, data, resource, action, method, object_ids, on_model }) {
    try {
      if (!user_id) {
        throw new Error('user is required');
      }
      const end = resource.indexOf('?') !== -1 ? resource.indexOf('?') + 1 : resource.length;
      const path = resource.slice(0, end);
      return await mallActivityModel.create({
        mall_id,
        user_id,
        data,
        resource: path,
        action,
        method,
        object_ids,
        on_model
      });
    } catch (error) {
      logger.error('[create] can not create company activity: %o', error);
      return { error: true, msg: 'T_T' };
    }
  }
};
