import Promise from 'bluebird';
import localConfigs from '../../../assets/config.json';
import { BaseError, errorCode, findAdvanced, logger } from '../utils';
import * as configMigrater from './config.migrater';
import configModel from './config.model';
import { isValidConfig } from './config.validator';

export default {
  type: {
    new_user: 'new_user',
    ref: 'ref',
    post_video: 'post_video',
    view: 'view'
  },
  /**
   *
   *
   * @param {keyof import('./config.schema')} key
   * @returns {Promise<any>}
   */
  async get(key) {
    try {
      const config = await configModel.findOne({ key });
      if (!config)
        throw new BaseError({
          statusCode: 500,
          error: errorCode.server,
          errors: { config: errorCode['server.configNotExist'] }
        });
      return config.value;
    } catch (error) {}
  },
  async init() {
    const configs = [
      { key: 'new_user', value: 1000, name: 'Điểm thành viên mới' },
      { key: 'ref', value: 100, name: 'Điểm giới thiệu' },
      { key: 'post_video', value: 20, name: 'Điểm đăng bài' },
      { key: 'view', value: 1, name: 'Điểm xem' },
      { key: 'max_ref', value: 'AAAAAA', name: 'ID' }
    ];
    await Promise.map(configs, ({ key, value, name }) => {
      return configModel.findOneAndUpdate({ key }, mergeObject({}, { key, value, name }), {
        upsert: true,
        new: true
      });
    });
    const config = await this.find();
    return config;
  },
  async find({ limit, page, select, sort, key } = {}) {
    if (!key) key = { $ne: 'max_ref' };
    const initConfigs = await findAdvanced(configModel, {
      limit,
      page,
      select,
      sort,
      query: { key }
    });
    return initConfigs;
  },
  async findById(id) {
    const config = await configModel.findById(id);
    return config;
  },
  async findByKey(key) {
    const config = await configModel.findOne({ key });
    if (!config)
      throw new BaseError({
        statusCode: 400,
        error: errorCode.client,
        errors: {
          key: errorCode['client.configNotExist']
        }
      });
    return config;
  },
  async findOne(query, options) {
    return configModel.findOne(query, options);
  },
  async create({ key, value }) {
    try {
      const config = new configModel({ key, value });
      await config.save();
      return config;
    } catch (error) {
      if (error.code === 11000)
        throw new BaseError({
          statusCode: 400,
          error: errorCode.client,
          errors: {
            key: errorCode['client.configDuplicate']
          }
        });
      throw error;
    }
  },
  async update({ key, ...update }) {
    const config = await this.findByKey(key);
    for (const key in update) {
      config[key] = update[key];
    }
    await config.save();
    return config;
  },
  async delete(key) {
    const config = await this.findByKey(key);
    await config.remove();
    return config;
  },
  async updateMany(configs) {
    const SetedConfigs = await configModel.find({
      key: { $in: configs.map((config) => config.key) }
    });
    const unsettedConfigs = configs.filter(
      (config) => !SetedConfigs.map((config) => config.key).includes(config.key)
    );
    let config = await configModel.insertMany(unsettedConfigs);
    return config;
  },
  async sync() {
    const configs = await configModel.find({});
    return Promise.each(configs, async (config, number) => {
      try {
        console.log(`${number + 1}.`, config.key, 'version', config.version);
        const localConfig = localConfigs.find((_config) => _config.key === config.key);
        if (!localConfig) return console.log('\u2714 unused config', config.key);
        if (config.version < localConfig.version) {
          console.log('\u276F detected different version', localConfig.version);
          for (
            let currentVersion = config.version;
            currentVersion < localConfig.version;
            currentVersion++
          ) {
            if (!configMigrater[config.key][currentVersion]) {
              console.log('\u2714 cannot find version', currentVersion + 1);
              continue;
            }
            await configMigrater[config.key][currentVersion][currentVersion + 1](config);
            console.log('\u2714 migrated from', currentVersion, 'to', currentVersion + 1);
          }
          await config.save();
        }
        await isValidConfig(config)
          .then(() => console.log('\u2714'))
          .catch((error) => console.log('\u2717 error', error.errors.details));
      } catch (error) {
        console.error(error);
      }
    });
  },

  /**
   *
   * @param {*} condition
   * @param {*} data
   * @param {import('mongoose').QueryFindOneAndUpdateOptions} options
   */
  async findOneAndUpdate(condition, data, options) {
    return await configModel.findOneAndUpdate(condition, data, options);
  }

  // //vong
  // async updateValueString(query, data) {
  //   return await configModel.findOneAndUpdate(query, data);
  // }
};
