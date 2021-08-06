import { userService } from '../../../commons/user';
import {
  BaseError,
  BaseResponse,
  errorCode,
  splitString,
  withSession,
  withSafety
} from '../../../commons/utils';
import { searchService } from '../../search/search.service';
import mallStaffService from '../staff/staff.service';
import { MallStatuses } from './mall.config';
import mallService from './mall.service';
import { MallStaffStatuses, MallStaffRoles } from '../staff/staff.config';
import { Promise } from 'bluebird';
import notificationService from '../../notification/notification.service';
import mallActivityService from '../mall-activity/mall-activity.service';
import { mallActions } from '../mall-activity/mall-activity.config';

export default {
  admin: {
    async get(req, res, next) {
      try {
        const { limit, page, select, sort, ...query } = req.query;
        const [result, { total_page, total }] = await mallService.findWithPagination({
          page,
          limit,
          select,
          sort,
          query
        });
        return new BaseResponse({ statusCode: 200, data: result })
          .addMeta({ total_page, total })
          .return(res);
      } catch (error) {
        next(error);
      }
    },
    async getById(req, res, next) {
      try {
        const { id } = req.params;
        const { select } = req.query;
        const result = await mallService.findOne({ _id: id }, select);
        return new BaseResponse({ statusCode: 200, data: result }).return(res);
      } catch (error) {
        next(error);
      }
    },
    async create(req, res, next) {
      try {
        const mall = req.body;
        let { location, name, address, phone_number, manager_id } = req.body;
        const result = await withSession(async (session) => {
          const [existedMall, manager, isStaff] = await Promise.all([
            mallService.findOne(
              {
                status: MallStatuses.Active,
                $or: [
                  { name },
                  {
                    phone_number
                  },
                  { manager_id }
                ]
              },
              null,
              { session }
            ),
            userService.findEnsure({
              _id: manager_id,
              status: { $ne: 'disabled' },
              options: { session }
            }),
            mallStaffService.findOne(
              { user_id: manager_id, status: MallStaffStatuses.Active },
              null,
              {
                session
              }
            )
          ]);
          if (existedMall) {
            throw new BaseError({
              statusCode: 400,
              error: errorCode.client,
              errors: {
                mall: errorCode['client.mallExists']
              }
            });
          }
          if (isStaff) {
            throw new BaseError({
              statusCode: 400,
              error: errorCode.client,
              errors: {
                manager: errorCode['client.isOtherMallStaff']
              }
            });
          }
          const [lat, long] = (location && splitString(location)) || [];
          const normalizedAddress = `${address.text}, ${address.ward}, ${address.district}, ${address.province}`;
          location = location
            ? { type: 'Point', coordinates: [+long, +lat] }
            : {
                type: 'Point',
                coordinates: await searchService.getCoordinates(normalizedAddress)
              };
          const [result] = await mallService.create(
            [
              {
                manager_id,
                ...mall,
                location
              }
            ],
            { session }
          );
          await mallStaffService.create(
            [
              {
                name: manager.name,
                user_id: manager._id,
                mall_id: result._id,
                roles: [MallStaffRoles.MallManager]
              }
            ],
            { session }
          );
          return result;
        });
        return new BaseResponse({
          statusCode: 200,
          data: result
        }).return(res);
      } catch (error) {
        next(error);
      }
    },
    async search(req, res, next) {
      try {
        const { mall_name, limit, page } = req.query;
        const [result, { total_page, total }] = await mallService.findWithPagination({
          page,
          limit,
          select: { score: { $meta: 'textScore' } },
          sort: { score: { $meta: 'textScore' } },
          query: { $text: { $search: mall_name } }
        });
        return new BaseResponse({
          statusCode: 200,
          data: result
        })
          .addMeta({ total_page, total })
          .return(res);
      } catch (error) {
        next(error);
      }
    },
    async updateMallManager(req, res, next) {
      try {
        const { id } = req.params;
        const { manager_id } = req.body;
        const result = await withSession(async (session) => {
          const [mall, manager] = await Promise.all([
            mallService.findEnsure({
              _id: id,
              manager_id: { $ne: manager_id },
              options: { session }
            }),
            userService.findEnsure({
              _id: manager_id,
              status: { $ne: 'disabled' },
              options: { session }
            })
          ]);
          if (mall.status === MallStatuses.Active) {
            const [existedManager, isStaff] = await Promise.all([
              mallService.findOne(
                {
                  _id: { $ne: id },
                  manager_id,
                  status: MallStatuses.Active
                },
                null,
                { session }
              ),
              mallStaffService.findOne(
                {
                  user_id: manager_id,
                  status: MallStaffStatuses.Active
                },
                null,
                { session }
              )
            ]);
            if (existedManager) {
              throw new BaseError({
                statusCode: 400,
                error: errorCode.client,
                errors: {
                  manager: errorCode['client.isOtherMallManager']
                }
              });
            }
            if (isStaff) {
              throw new BaseError({
                statusCode: 400,
                error: errorCode.client,
                errors: {
                  manager: errorCode['client.isOtherMallStaff']
                }
              });
            }
          }
          const oldManagerId = mall.manager_id;
          mall.manager_id = manager_id;
          const [result, updatedManager] = await Promise.all([
            mall.save({ session }),
            mallStaffService.findOneAndUpdate(
              {
                mall_id: mall._id,
                user_id: oldManagerId,
                roles: MallStaffRoles.MallManager
              },
              { user_id: manager_id },
              { session }
            )
          ]);
          return result;
        });
        return new BaseResponse({
          statusCode: 200,
          data: result
        }).return(res);
      } catch (error) {
        next(error);
      }
    },
    async updateStatus(req, res, next) {
      try {
        const { id } = req.params;
        const { status } = req.body;
        const result = await withSession(async (session) => {
          const mall = await mallService.findEnsure({ _id: id });
          const manager = await mallStaffService.findEnsure({
            mall_id: mall._id,
            roles: MallStaffRoles.MallManager,
            options: { session }
          });
          if (status === MallStatuses.Active) {
            const [existedMall, isStaff] = await Promise.all([
              mallService.findOne(
                {
                  _id: { $ne: mall._id },
                  status: MallStatuses.Active,
                  $or: [
                    { manager_id: mall.manager_id },
                    { phone_number: mall.phone_number },
                    { name: mall.name }
                  ]
                },
                null,
                { session }
              ),
              mallStaffService.findOne(
                {
                  _id: { $ne: manager._id },
                  user_id: mall.manager_id,
                  status: MallStaffStatuses.Active
                },
                null,
                { session }
              )
            ]);
            if (existedMall) {
              throw new BaseError({
                statusCode: 400,
                error: errorCode.client,
                errors: {
                  mall: errorCode['client.mallExists']
                }
              });
            }
            if (isStaff) {
              throw new BaseError({
                statusCode: 400,
                error: errorCode.client,
                errors: {
                  manager: errorCode['client.isOtherMallStaff']
                }
              });
            }
          }
          mall.status = status;
          const [result] = await Promise.all([
            mall.save({ session }),
            status === MallStatuses.AdminDisabled &&
              mallStaffService.update(
                { mall_id: mall._id },
                { status: MallStaffStatuses.Disabled },
                { session }
              )
          ]);
          await notificationService.getStaffAndSend({
            mall_id: mall._id,
            staff_type: 'mall_stock',
            type: 'update_mall_status',
            title: 'Cập nhập trạng thái của mall',
            message: `Trạng thái mall bạn đang quản lí đã chuyển thành ${status}`,
            object_id: result.id,
            onModel: 's_mall'
          });
          return result;
        });
        return new BaseResponse({
          statusCode: 200,
          data: result
        }).return(res);
      } catch (error) {
        next(error);
      }
    }
  },
  mall: {
    async getMyInfo(req, res, next) {
      try {
        const { user_id: manager_id } = req.mall;
        const result = await mallService.findOne({
          manager_id,
          status: MallStatuses.Active
        });
        return new BaseResponse({
          statusCode: 200,
          data: result
        }).return(res);
      } catch (error) {
        next(error);
      }
    },
    async get(req, res, next) {
      try {
        const { user_id: manager_id } = req.mall;
        const { limit, page, select, sort, ...query } = req.query;
        const [result, { total_page, total }] = await mallService.findWithPagination({
          page,
          limit,
          select,
          sort,
          query: {
            ...query,
            manager_id
          }
        });
        return new BaseResponse({ statusCode: 200, data: result })
          .addMeta({ total_page, total })
          .return(res);
      } catch (error) {
        next(error);
      }
    },
    async getById(req, res, next) {
      try {
        const { user_id: manager_id } = req.mall;
        const { id } = req.params;
        const { select } = req.query;
        const result = await mallService.findOne(
          {
            _id: id,
            manager_id: manager_id
          },
          select
        );
        return new BaseResponse({ statusCode: 200, data: result }).return(res);
      } catch (error) {
        next(error);
      }
    },
    async update(req, res, next) {
      try {
        const { user_id: manager_id } = req.mall;
        const { id } = req.params;
        let update = req.body;
        let { location, name, phone_number } = req.body;
        const mall = await mallService.findEnsure({ _id: id, manager_id });
        if (mall.status === MallStatuses.Active) {
          const existedMall = await mallService.findOne({
            _id: { $ne: id },
            status: MallStatuses.Active,
            $or: [{ name }, { phone_number }, { manager_id }]
          });
          if (existedMall) {
            throw new BaseError({
              statusCode: 400,
              error: errorCode.client,
              errors: {
                mall: errorCode['client.mallExists']
              }
            });
          }
        }
        if (location) {
          const [lat, long] = (location && splitString(location)) || [];
          location = { type: 'Point', coordinates: [+long, +lat] };
          update = { ...update, location };
        }
        const result = await mallService.findByIdAndUpdate(id, update, { new: true });
        withSafety(() => {
          mallActivityService.implicitCreate(mallActions.updateInfo)(req, {
            object_ids: [mall._id]
          });
        });
        return new BaseResponse({
          statusCode: 200,
          data: result
        }).return(res);
      } catch (error) {
        next(error);
      }
    },
    async updateStatus(req, res, next) {
      try {
        const { user_id: manager_id } = req.mall;
        const { id } = req.params;
        const { status } = req.body;
        const [mall, manager] = await Promise.all([
          mallService.findEnsure({
            _id: id,
            manager_id,
            status: { $ne: MallStatuses.ManagerDisabled }
          }),
          mallStaffService.findEnsure({
            mall_id: id,
            roles: MallStaffRoles.MallManager
          })
        ]);
        if (status === MallStatuses.Active) {
          const [existedMall, isStaff] = await Promise.all([
            mallService.findOne({
              _id: { $ne: mall._id },
              status: MallStatuses.Active,
              $or: [
                { manager_id: mall.manager_id },
                { phone_number: mall.phone_number },
                { name: mall.name }
              ]
            }),
            mallStaffService.findOne({
              _id: { $ne: manager._id },
              user_id: mall.manager_id,
              status: MallStaffStatuses.Active
            })
          ]);
          if (existedMall) {
            throw new BaseError({
              statusCode: 400,
              error: errorCode.client,
              errors: {
                mall: errorCode['client.mallExists']
              }
            });
          }
          if (isStaff) {
            throw new BaseError({
              statusCode: 400,
              error: errorCode.client,
              errors: {
                manager: errorCode['client.isOtherMallStaff']
              }
            });
          }
        }
        mall.status = status;
        const result = await mall.save();
        return new BaseResponse({ statusCode: 200, data: result }).return(res);
      } catch (error) {
        next(error);
      }
    }
  },
  async get(req, res, next) {
    try {
      const { limit, page, select, sort, ...query } = req.query;
      const [result, { total_page, total }] = await mallService.findWithPagination({
        page,
        limit,
        select,
        sort,
        query: { ...query, status: MallStatuses.Active }
      });
      return new BaseResponse({ statusCode: 200, data: result })
        .addMeta({ total_page, total })
        .return(res);
    } catch (error) {
      next(error);
    }
  },
  async getById(req, res, next) {
    try {
      const { id } = req.params;
      const { select } = req.query;
      const result = await mallService.findOne({ _id: id, status: MallStatuses.Active }, select);
      return new BaseResponse({ statusCode: 200, data: result }).return(res);
    } catch (error) {
      next(error);
    }
  },
  async search(req, res, next) {
    try {
      const { mall_name, limit, page } = req.query;
      const [result, { total_page, total }] = await mallService.findWithPagination({
        page,
        limit,
        select: { score: { $meta: 'textScore' } },
        sort: { score: { $meta: 'textScore' } },
        query: { $text: { $search: mall_name }, status: MallStatuses.Active }
      });
      return new BaseResponse({
        statusCode: 200,
        data: result
      })
        .addMeta({ total_page, total })
        .return(res);
    } catch (error) {
      next(error);
    }
  }
};
