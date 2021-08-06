import configService from './config.service';
import { BaseResponse } from '../utils';
import { isValidConfig } from './config.validator';
import { getAppVersion, updateAppVersion } from '../middlewares/app-version';
import _ from 'lodash';

export default {
  async init(req, res, next) {
    try {
      const configs = await configService.init();
      return new BaseResponse({ statusCode: 200, data: configs }).return(res);
    } catch (error) {
      next(error);
    }
  },
  async get(req, res, next) {
    try {
      const { limit, page, select, sort, key } = req.query;
      const configs = await configService.find({ limit, page, select, sort, key });
      return new BaseResponse({ statusCode: 200, data: configs }).return(res);
    } catch (error) {
      next(error);
    }
  },
  async getByKey(req, res, next) {
    try {
      const { key } = req.params;
      const config = await configService.findByKey(key);
      return new BaseResponse({ statusCode: 200, data: config }).return(res);
    } catch (error) {
      next(error);
    }
  },
  async create(req, res, next) {
    try {
      const config = await configService.create(req.body);
      return new BaseResponse({ statusCode: 200, data: config }).return(res);
    } catch (error) {
      next(error);
    }
  },
  async update(req, res, next) {
    try {
      let data = req.body;
      data = await isValidConfig(data);
      console.log('data', data);
      if (data.key === 'app_version') {
        if (
          data.value.enterprise_web &&
          data.value.enterprise_web !== getAppVersion('enterprise_web')
        ) {
          updateAppVersion('enterprise', data.value.enterprise_web);
        }
        if (data.value.admin_web && data.value.admin_web !== getAppVersion('admin_web')) {
          updateAppVersion('admin', data.value.admin_web);
        }
      }
      const config = await configService.update(data);
      return new BaseResponse({ statusCode: 200, data: config }).return(res);
    } catch (error) {
      next(error);
    }
  },
  updateTopupConfig: async (req, res, next) => {
    try {
      const updates = req.body;
      let topupConfig = await configService.findByKey('topup');
      for (const key in updates) {
        topupConfig = _.set(topupConfig, 'value.' + key, updates[key]);
      }
      const newObj = await isValidConfig(topupConfig);
      const result = await configService.update({ key: 'topup', value: newObj.value });
      return new BaseResponse({
        statusCode: 200,
        data: result
      }).return(res);
    } catch (error) {
      next(error);
    }
  },
  async delete(req, res, next) {
    try {
      const { key } = req.query;
      await configService.delete(key);
      return new BaseResponse({ statusCode: 200, data: {} }).return(res);
    } catch (error) {
      next(error);
    }
  },
  async updateAppVersion(req, res, next) {
    try {
      const update = {};
      for (const key in req.body) {
        update['value.' + key] = req.body[key];
      }
      const config = await configService.findOneAndUpdate(
        { key: 'app_version' },
        { $set: { ...update } },
        { new: true }
      );
      return new BaseResponse({ statusCode: 200, data: config }).return(res);
    } catch (error) {
      return next(error);
    }
  }
};
