import Bluebird, { Promise } from 'bluebird';
import { findAdvanced, logger, mergeObject } from '../../commons/utils';
import deviceService from '../device/device.service';
import fireBaseService from './notification-fcm.service';
import notificationModel from './notification.model';
import './notification.typedef';
import _ from 'lodash';
import deviceModel from '../device/device.model';

export default {
  find({ limit, page, select, sort, ...rawQuery }) {
    const query = mergeObject({}, rawQuery);
    return findAdvanced(notificationModel, {
      query,
      limit,
      page,
      select,
      sort
    });
  },
  /**
   * @description Find and send message to list of token
   * @param {*} query
   * @param {*} data
   * @param {*} options
   */
  // With query param includes : mall_id, store_id, warehouse_id, company_id, company_role, mall_role, ...restQuery
  // With data param includes : title, message, object_id, onModel, type
  // With options param includes : exclude_ids, session
  async findAndSend(query, data, options) {
    const { mall_id, company_id, warehouse_id } = query;
    const { exclude_ids = [], session } = options;
    const excludesQuery = exclude_ids.length ? { user_id: { $nin: exclude_ids } } : {};
    const receivers = await deviceModel.find(
      { ...query, expiresAt: { $gte: new Date() }, token: { $exists: 1 }, ...excludesQuery },
      null,
      {
        session
      }
    );
    Promise.each(receivers, (receiver) =>
      this.createAndSendV2({
        receiver,
        mall_id,
        company_id,
        warehouse_id,
        session,
        ...data
      })
    );
  },
  /**
   *
   *
   * @param {{ user_id: string, company_id: string,mall_id : string , type: SNotificationType, title, message, object_id, onModel }} param
   * @returns {Promise<SNotification>}
   */
  async createAndSendV2({
    company_id,
    mall_staff_id,
    mall_id,
    store_id,
    type,
    title,
    session,
    warehouse_id,
    message,
    object_id,
    onModel,
    receiver
  }) {
    logger.info('Notification: %o ', {
      user_id: receiver.user_id,
      company_id,
      store_id,
      mall_id,
      mall_staff_id,
      warehouse_id,
      type,
      title,
      message,
      object_id,
      onModel
    });
    let to = 'user';
    if (company_id || warehouse_id) {
      to = 'company';
    } else if (mall_id || mall_staff_id) {
      to = 'mall';
    } else if (store_id) {
      to = 'store';
    }
    const [notification] = await notificationModel.create(
      [
        {
          user_id: receiver.user_id,
          platform: receiver.platform,
          to,
          mall_id,
          mall_staff_id,
          company_id,
          warehouse_id,
          type,
          title,
          message,
          object_id,
          onModel
        }
      ],
      { session }
    );
    receiver.token &&
      fireBaseService.sendMessage({
        tokens: [receiver.token],
        notification: { body: message, title },
        data: { success: 'true', _id: notification.id, title, message, to, type }
      });
    return notification;
  },
  async getStaffAndSend({
    user_ids = [],
    mall_id,
    warehouse_id,
    company_id,
    store_id,
    staff_type,
    type,
    title,
    message,
    object_id,
    onModel,
    exclude_ids = []
  }) {
    // This query to exclude user(s) from receiving notification.
    const excludesQuery =
      Array.isArray(exclude_ids) && exclude_ids.length > 0
        ? { user_id: { $nin: exclude_ids } }
        : {};
    const receivers = await deviceService.find({
      $or: [
        { company_id, company_role: staff_type, warehouse_id },
        { company_id, company_role: staff_type, store_id },
        { company_id, company_role: 'owner' },
        {
          mall_id,
          $or: [{ mall_role: staff_type }, { mall_role: 'mall_manager' }]
        },
        { user_id: { $in: user_ids } }
      ],
      ...excludesQuery
    });
    Promise.each(receivers, (receiver) =>
      this.createAndSend({
        user_id: receiver.user_id,
        mall_id,
        company_id,
        message,
        object_id,
        onModel,
        title,
        type
      })
    );
  },
  async getCompanyStaffAndSend({
    company_id,
    store_id,
    staff_type,
    type,
    title,
    message,
    object_id,
    onModel,
    exclude_ids = []
  }) {
    // This query to exclude user(s) from receiving notification.
    const excludesQuery =
      Array.isArray(exclude_ids) && exclude_ids.length > 0
        ? { user_id: { $nin: exclude_ids } }
        : {};
    // Handle staff_type
    let staffType = staff_type;
    if (Array.isArray(staff_type)) {
      staffType = { $in: staff_type };
    }
    let [staffs, owner] = await Promise.all([
      deviceService.find({ company_id, company_role: staffType, store_id, ...excludesQuery }),
      deviceService.findOne({ company_id, company_role: 'owner', ...excludesQuery })
    ]);
    owner && staffs.push(owner);
    Promise.each(staffs, (staff) =>
      this.createAndSend({
        user_id: staff.user_id,
        company_id,
        message,
        object_id,
        onModel,
        title,
        type
      })
    );
  },
  /**
   *
   *
   * @param {{ user_id: string, company_id: string,mall_id : string , type: SNotificationType, title, message, object_id, onModel }} param
   * @returns {Promise<SNotification>}
   */
  async createAndSend({
    user_id,
    company_id,
    staff_id,
    mall_id,
    type,
    title,
    session,
    warehouse_id,
    message,
    object_id,
    onModel
  }) {
    logger.info('Notification: %o ', {
      user_id,
      company_id,
      mall_id,
      staff_id,
      warehouse_id,
      type,
      title,
      message,
      object_id,
      onModel
    });
    const to = company_id ? 'company' : mall_id ? 'mall' : warehouse_id ? 'warehouse' : 'user';
    const [notification] = await notificationModel.create(
      [
        {
          user_id,
          to: staff_id ? 'mall' : to,
          mall_id,
          staff_id,
          company_id,
          warehouse_id,
          type,
          title,
          message,
          object_id,
          onModel
        }
      ],
      { session }
    );
    let receiver = await deviceService.find(
      { user_id, type: to, expiresAt: { $gt: new Date() }, session },
      'token'
    );
    const tokens = receiver.map((item) => item.token).filter((item) => !!item);
    tokens.length &&
      fireBaseService.sendMessage({
        tokens,
        notification: { body: message, title },
        data: { success: 'true', _id: notification.id, title, message, to, type }
      });
    return notification;
  },
  /**
   *
   *
   * @param {{ user_ids: string[], company_id: string, type: SNotificationType, title, message, object_id, onModel }} param
   * @returns {Promise<SNotification>}
   */
  async createAndSendMultiple({ user_ids, company_id, type, title, message, object_id, onModel }) {
    const to = company_id ? 'company' : 'user';
    Bluebird.each(user_ids, (user_id) =>
      notificationModel.create({
        user_id,
        company_id,
        type,
        title,
        message,
        object_id,
        onModel,
        to
      })
    );
    let receivers = await deviceService.find(
      { user_id: user_ids, type: to, expiresAt: { $gt: new Date() } },
      'token'
    );
    const tokens = receivers
      .map((receiver) => {
        return receiver.token;
      })
      .filter((token) => !!token);
    tokens.length &&
      fireBaseService.sendMessage({
        tokens: tokens,
        notification: { body: message, title },
        data: { success: 'true', title, message, to, type, object_id, onModel }
      });
  },
  async count(query) {
    return notificationModel.countDocuments(mergeObject({}, query));
  },
  async update(query, doc) {
    return notificationModel.updateMany(query, doc, { runValidators: true });
  },
  async findById(id) {
    return notificationModel.findById(id);
  }
};
