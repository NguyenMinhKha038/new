import notificationService from './notification.service';
import { BaseResponse, BaseError, errorCode, mergeObject, splitString } from '../../commons/utils';
import deviceService from '../device/device.service';
import permissionGroupService from '../permission-group/permission-group.service';

export default {
  user: {
    async get(req, res, next) {
      try {
        const {
          include_types,
          type,
          exclude_types,
          limit,
          page,
          select,
          sort,
          is_read
        } = req.query;

        const query = {
          user_id: req.user.id,
          to: 'user',
          is_read
        };

        if (include_types) {
          const typeQuery = splitString(include_types);
          query.type = { $in: typeQuery };
        } else if (type) {
          const typeQuery = splitString(type);
          query.type = { $in: typeQuery };
        } else if (exclude_types) {
          const typeQuery = splitString(exclude_types);
          query.type = { $nin: typeQuery };
        }

        const [notifications, count, unreadCount] = await Promise.all([
          notificationService.find({
            ...query,
            limit,
            page,
            select,
            sort
          }),
          limit &&
            notificationService.count({
              ...query
            }),
          notificationService.count({ ...query, is_read: false })
        ]);
        const total_page = limit && Math.ceil(count / limit);
        return new BaseResponse({ statusCode: 200, data: notifications })
          .addMeta({ total_page, total_unread: unreadCount })
          .return(res);
      } catch (error) {
        next(error);
      }
    },
    async updateDevice(req, res, next) {
      try {
        const { token, platform, device_id } = req.body;
        await deviceService.createOrUpdate(
          { device_id, type: 'user', platform },
          mergeObject({ token }, { ...(req.user && { user_id: req.user.id }) })
        );
        const staff = await permissionGroupService.findOne({
          user_id: req.user.id,
          status: 'active'
        });
        if (staff) {
          await deviceService.createOrUpdate(
            { user_id: req.user.id, type: 'company', company_id: staff.company_id, platform },
            mergeObject(
              { token },
              {
                company_role: staff.is_owner ? 'owner' : staff.type,
                store_id: staff.store_id,
                warehouse_id: staff.warehouse_id
              }
            )
          );
        }
        return new BaseResponse({ statusCode: 200, data: {} }).return(res);
      } catch (error) {
        next(error);
      }
    }
  },
  async markRead(req, res, next) {
    try {
      const { _id } = req.query;
      let query = {};
      if (req.company) {
        query = { company_id: req.company._id };
      } else if (req.mall) {
        query = { mall_id: req.mall._id };
      } else {
        query = { user_id: req.user._id };
      }
      _id && (query._id = _id);
      notificationService.update({ ...query, is_read: false }, { is_read: true });
      return new BaseResponse({ statusCode: 200, data: {} }).return(res);
    } catch (error) {
      next(error);
    }
  },
  company: {
    async get(req, res, next) {
      try {
        const {
          include_types,
          type,
          exclude_types,
          limit,
          page,
          select,
          sort,
          is_read
        } = req.query;

        const query = { company_id: req.company.id, to: 'company', is_read };

        if (include_types) {
          const typeQuery = splitString(include_types);
          query.type = { $in: typeQuery };
        } else if (type) {
          const typeQuery = splitString(type);
          query.type = { $in: typeQuery };
        } else if (exclude_types) {
          const typeQuery = splitString(exclude_types);
          query.type = { $nin: typeQuery };
        }

        const [notifications, count, unreadCount] = await Promise.all([
          notificationService.find({ ...query, limit, page, select, sort }),
          limit && notificationService.count(query),
          notificationService.count({ ...query, is_read: false })
        ]);
        const total_page = limit && Math.ceil(count / limit);
        return new BaseResponse({ statusCode: 200, data: notifications })
          .addMeta({ total_page, total_unread: unreadCount })
          .return(res);
      } catch (error) {
        next(error);
      }
    },
    async updateDevice(req, res, next) {
      try {
        const { token, platform } = req.body;
        const { id: user_id } = req.user;
        const { type: company_role, store_id, is_owner, id: company_id } = req.company;
        await deviceService.createOrUpdate(
          { user_id, type: 'company', company_id, platform },
          mergeObject({ token }, { company_role: company_role ? company_role : 'owner', store_id })
        );
        return new BaseResponse({ statusCode: 200, data: {} }).return(res);
      } catch (error) {
        next(error);
      }
    },
    async getById(req, res, next) {
      try {
        const { id } = req.params;
        const notification = await notificationService.findById(id);
        if (!notification) {
          return next(
            new BaseError({
              statusCode: 400,
              error: errorCode.client,
              errors: { id: errorCode['client.global.notFound'] }
            }).addMeta({ message: 'notification id is not found' })
          );
        }
        return new BaseResponse({ statusCode: 200, data: notification }).return(res);
      } catch (err) {
        next(err);
      }
    }
  },
  mall: {
    async updateDevice(req, res, next) {
      try {
        const { token, platform } = req.body;
        const { id: user_id } = req.user;
        const { type: mall_role, id: mall_id } = req.mall;
        await deviceService.createOrUpdate(
          { user_id, type: 'mall', mall_id, platform },
          mergeObject({ token }, { mall_role })
        );
        return new BaseResponse({ statusCode: 200, data: {} }).return(res);
      } catch (error) {
        next(error);
      }
    }
  }
};
