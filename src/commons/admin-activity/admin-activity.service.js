import adminActivityModel from './admin-activity.model';
import findAdvanced from '../utils/find-advanced';
import adminConfig from './admin-activity.config';
import { logger } from '../utils';
import { Model } from 'mongoose';

export default {
  findOne(query, select, options) {
    return adminActivityModel.findOne(query, select, options);
  },
  find({ query, select, sort, limit = 50, page = 1, populate }) {
    return findAdvanced(adminActivityModel, {
      select,
      sort,
      limit,
      page,
      populate,
      query
    });
  },
  count(query) {
    return adminActivityModel.countDocuments(query);
  },
  async findAndCount({
    query,
    select,
    sort,
    limit = adminConfig.DefaultLimit,
    page = 1,
    populate
  }) {
    const [docs, count] = await Promise.all([
      this.find({ query, select, sort, limit, page, populate }),
      this.count(query)
    ]);

    return { docs, count };
  },
  /**
   *
   * @param {{
   * admin_id: string,
   * object_id: string,
   * type: string,
   * snapshot: object,
   * on_model: string,
   * resource: string,
   * parent_activity_id: string
   * }} doc
   *
   */
  async create({
    admin_id,
    on_model,
    object_id,
    updated_fields,
    type,
    snapshot = {},
    resource,
    parent_activity_id
  }) {
    try {
      // Check if admin_id not exist
      if (!admin_id) {
        throw new Error('admin_id is required');
      }
      // Check if snapshot is not mongoose model instance
      const isInstanceOfModel = snapshot.__proto__ instanceof Model;
      if (!on_model && !isInstanceOfModel) {
        throw new Error('on_model must be passed if snapshot is not a mngoose model instance');
      }
      const onModel = on_model || snapshot.constructor.modelName;
      const snapObj = isInstanceOfModel ? snapshot.toObject() : snapshot;
      const snapObjKeys = Object.keys(snapObj).filter(
        (key) => !['id', '_id', 'updatedAt', 'createdAt'].includes(key)
      );
      let updatedFields = type === 'insert' && !updated_fields ? snapObjKeys : updated_fields;
      if (!Array.isArray(updatedFields)) {
        const obj =
          updatedFields.__proto__ instanceof Model ? updatedFields.toObject() : updatedFields;
        updatedFields = Object.keys(obj).filter(
          (key) => !['id', '_id', 'updatedAt', 'createdAt'].includes(key)
        );
      }
      const end = resource.indexOf('?') !== -1 ? resource.indexOf('?') + 1 : resource.length;
      const api = resource.slice(0, end);
      const objectId = object_id || snapObj._id;

      return await adminActivityModel.create({
        admin_id,
        on_model: onModel,
        object_id: objectId,
        updated_fields: updatedFields,
        type,
        snapshot: snapObj,
        resource: api,
        parent_activity_id
      });
    } catch (err) {
      logger.error('[create] can not create admin activity: %o', err);
      return { error: true, msg: 'T_T' };
    }
  },
  /**
   *
   * @param {[{
   * admin_id: string,
   * object_id: string,
   * type: string,
   * snapshot: object,
   * on_model: string,
   * resource: string,
   * is_parent: boolean
   * }]} data_arr
   *
   */
  async createMulti(data_arr) {
    try {
      const parentActionIndex = data_arr.findIndex((data) => data.is_parent);
      const childActionsData = data_arr.filter((data) => !data.is_parent);

      if (parentActionIndex !== -1) {
        const { is_parent, ...data } = data_arr[parentActionIndex];
        const parentAction = await this.create(data);

        const childActions = await Promise.all(
          childActionsData.map((childData) =>
            this.create({ ...childData, parent_activity_id: parentAction._id })
          )
        );

        const results = [...childActions];
        results.splice(parentActionIndex, 0, parentAction);
        return results;
      }

      return await Promise.all(childActionsData.map((data) => this.create(data)));
    } catch (err) {
      logger.error('[createMulti] can not create admin activities: %o', err);
      return { error: true, msg: 'T_T' };
    }
  }
};
