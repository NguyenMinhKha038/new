import menuModel from './menu.model';
import extendService from '../../commons/utils/extend-service';
import { Statuses } from './menu.config';
import { BaseError, errorCode } from '../../commons/utils';

export default {
  ...extendService(menuModel),
  /**
   *
   *
   * @param {object} query
   * @returns {Promise<SMenu>}
   */
  findOneOrCreate(query) {
    return menuModel
      .findOneAndUpdate(
        query,
        {},
        { new: true, runValidators: true, setDefaultsOnInsert: true, upsert: true }
      )
      .exec();
  },
  findOneActive(query, select, options) {
    return menuModel.findOne({ ...query, status: Statuses.Active }, select, options);
  },
  findOneActiveAndUpdate(query, updates, options) {
    return menuModel.findOneAndUpdate({ ...query, status: Statuses.Active }, updates, {
      ...options,
      new: true
    });
  },
  async findOneEnsure(query, select, options) {
    const menu = await menuModel.findOne(query, select, options);
    if (!menu) {
      throw new BaseError({
        statusCode: 404,
        error: errorCode.client,
        errors: { product: errorCode['client.menuNotFound'] }
      });
    }

    return menu;
  }
};
