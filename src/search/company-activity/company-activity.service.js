import { omit } from 'lodash';
import { findAdvanced, logger } from '../../commons/utils';
import companyConfig, { ActionMethods } from './company-activity.config';
import CompanyActivityModel from './company-activity.model';

export default {
  findOne(query, select, options) {
    return CompanyActivityModel.findOne(query, select, options);
  },
  find({ query, select, sort, limit = 50, page = 1, populate }) {
    return findAdvanced(CompanyActivityModel, {
      select,
      sort,
      limit,
      page,
      populate,
      query
    });
  },
  count(query) {
    return CompanyActivityModel.countDocuments(query);
  },
  async findAndCount({
    query,
    select,
    sort,
    limit = companyConfig.DefaultLimit,
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
   * user_id: string,
   * company_id: string,
   * role: string,
   * object_id: string,
   * type: string,
   * data: object,
   * on_model: string,
   * resource: string,
   * parent_activity_id: string
   * }} doc
   *
   */
  async create({
    user_id,
    company_id,
    method,
    on_model,
    object_id,
    type,
    data = {},
    resource,
    parent_activity_id,
    action,
    ...doc
  }) {
    try {
      if (!user_id) {
        // Check if user_id not exist
        throw new Error('user_id is required');
      }
      const end = resource.indexOf('?') !== -1 ? resource.indexOf('?') + 1 : resource.length;
      const api = resource.slice(0, end);
      return await CompanyActivityModel.create({
        user_id,
        company_id,
        action,
        on_model,
        object_id,
        type: type || ActionMethods[method],
        data,
        resource: api,
        parent_activity_id,
        ...doc
      });
    } catch (err) {
      logger.error('[create] can not create company activity: %o', err);
      return { error: true, msg: 'T_T' };
    }
  },
  /**
   *
   * @param {[{
   * user_id: string,
   * object_id: string,
   * type: string,
   * data: object,
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
      logger.error('[createMulti] can not create company activities: %o', err);
      return { error: true, msg: 'T_T' };
    }
  },
  /**
   *
   * @param {typeof import('./company-activity.config').CompanyActions} action
   * @returns {(req, updates:{object_id: string}, {excludeFields:[], isExcludeData: boolean})=>Promise<any>}
   */
  implicitCreate(action) {
    return (req, updates, { excludeFields = [], isExcludeData = false } = {}) => {
      if (!req.company) return;
      const data = isExcludeData ? {} : omit(req.body, excludeFields);
      const doc = {
        company_id: req.company._id,
        data: Object.assign(data, req.params),
        resource: req.originalUrl,
        method: req.method,
        user_id: req.user._id,
        ...action
      };
      if (typeof doc !== 'object' || doc === null) return;
      return this.create({ ...doc, ...updates });
    };
  }
};
