import { userService } from '../../../commons/user';
import {
  BaseError,
  BaseResponse,
  errorCode,
  withSession,
  withSafety
} from '../../../commons/utils';
import { MallStatuses } from '../mall/mall.config';
import mallService from '../mall/mall.service';
import workScheduleService from '../work-schedule/work-schedule.service';
import { MallStaffRoles, MallStaffStatuses } from './staff.config';
import { default as mallStaffService } from './staff.service';
import mallActivityService from '../mall-activity/mall-activity.service';
import { mallActions } from '../mall-activity/mall-activity.config';

export default {
  admin: {
    async get(req, res, next) {
      try {
        const { limit, page, select, sort, roles, ...query } = req.query;
        const mainQuery = roles ? { ...query, roles: { $all: roles } } : query;
        const [result, { total_page, total }] = await mallStaffService.findWithPagination({
          page,
          limit,
          select,
          sort,
          query: mainQuery
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
        const result = await mallStaffService.findOne({ _id: id }, select);
        return new BaseResponse({ statusCode: 200, data: result }).return(res);
      } catch (error) {
        next(error);
      }
    },
    async search(req, res, next) {
      try {
        const { staff_name, page, limit } = req.query;
        const [result, { total_page, total }] = await mallStaffService.findWithPagination({
          limit,
          page,
          sort: { score: { $meta: 'textScore' } },
          select: { score: { $meta: 'textScore' } },
          query: { $text: { $search: staff_name } }
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
    async updateManagerStatus(req, res, next) {
      try {
        const { id } = req.params;
        const { status } = req.body;
        const mallManager = await mallStaffService.findEnsure({
          _id: id,
          roles: MallStaffRoles.MallManager
        });
        if (status === MallStaffStatuses.Active) {
          const existedStaff = await mallStaffService.findOne({
            _id: { $ne: mallManager._id },
            user_id: mallManager.user_id,
            status: MallStaffStatuses.Active
          });
          if (existedStaff) {
            throw new BaseError({
              statusCode: 400,
              error: errorCode.client,
              errors: {
                staff: errorCode['client.staff.existed']
              }
            });
          }
        }
        mallManager.status = status;
        const result = await mallManager.save();
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
    async get(req, res, next) {
      try {
        const { _id: mall_id } = req.mall;
        const { limit, page, select, sort, roles, ...query } = req.query;
        const mainQuery = roles ? { ...query, roles: { $all: roles } } : query;
        await mallService.findEnsure({
          _id: mall_id,
          status: MallStaffStatuses.Active
        });
        const [result, { total_page, total }] = await mallStaffService.findWithPagination({
          page,
          limit,
          select,
          sort,
          query: { ...mainQuery, mall_id }
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
        const { _id: mall_id } = req.mall;
        const { id } = req.params;
        const { select } = req.query;
        await mallService.findEnsure({
          _id: mall_id,
          status: MallStaffStatuses.Active
        });
        const result = await mallStaffService.findOne({ _id: id, mall_id }, select);
        return new BaseResponse({ statusCode: 200, data: result }).return(res);
      } catch (error) {
        next(error);
      }
    },
    async create(req, res, next) {
      try {
        const { _id: mall_id } = req.mall;
        const { user_id } = req.body;
        const staff = req.body;
        const { schedule } = req.body;
        const result = await withSession(async (session) => {
          const [mall, existedStaff, user, existedManager] = await Promise.all([
            mallService.findEnsure({
              _id: mall_id,
              status: MallStaffStatuses.Active,
              options: { session }
            }),
            mallStaffService.findOne({ user_id, status: MallStaffStatuses.Active }, null, {
              session
            }),
            userService.findEnsure({
              _id: user_id,
              status: { $ne: 'disabled' },
              options: { session }
            }),
            mallService.findOne({ manager_id: user_id, status: MallStatuses.Active }, null, {
              session
            })
          ]);
          if (existedStaff) {
            throw new BaseError({
              statusCode: 400,
              error: errorCode.client,
              errors: {
                staff: errorCode['client.existedMallStaff']
              }
            });
          }
          const weeklyWorkShifts = mall.weekly_work_shifts;
          for (const key in schedule) {
            if (!weeklyWorkShifts[key] || !weeklyWorkShifts[key].active) {
              throw new BaseError({
                statusCode: 400,
                error: errorCode.client,
                errors: {
                  schedule: errorCode['client.inValidSchedule']
                }
              });
            }
            const isValidWorkShifts = workScheduleService.checkValidWorkShifts({
              workShifts: schedule[key],
              baseWorkShifts: weeklyWorkShifts[key].work_shifts,
              hasStatus: true
            });
            if (!isValidWorkShifts) {
              throw new BaseError({
                statusCode: 400,
                error: errorCode.client,
                errors: {
                  schedule: errorCode['client.inValidSchedule']
                }
              });
            }
          }
          if (existedManager) {
            throw new BaseError({
              statusCode: 400,
              error: errorCode.client,
              errors: {
                staff: errorCode['client.isOtherMallManager']
              }
            });
          }
          const [result] = await mallStaffService.create(
            [
              {
                name: user.name,
                user_id,
                mall_id: mall._id,
                ...staff
              }
            ],
            { session }
          );
          await mallService.updateOne(
            { _id: mall._id },
            { $inc: { total_active_staffs: 1 } },
            { session }
          );
          return result;
        });
        withSafety(() => {
          mallActivityService.implicitCreate(mallActions.createStaff)(req, {
            object_ids: [result._id]
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
    async update(req, res, next) {
      try {
        const { _id: mall_id } = req.mall;
        const { id } = req.params;
        const { status, schedule } = req.body;
        const update = req.body;
        const mall = await mallService.findEnsure({
          _id: mall_id,
          status: MallStaffStatuses.Active
        });
        const staff = await mallStaffService.findEnsure({
          _id: id,
          roles: { $ne: MallStaffRoles.MallManager },
          mall_id: mall._id
        });
        if (schedule) {
          const weeklyWorkShifts = mall.weekly_work_shifts;
          for (const key in schedule) {
            workScheduleService.checkActiveWorkShifts({ key, schedule, weeklyWorkShifts });
          }
        }
        if (status && status !== staff.status) {
          if (status === MallStaffStatuses.Active) {
            const [existedStaff, existedManager, updatedMall] = await Promise.all([
              mallStaffService.findOne({
                _id: { $ne: id },
                user_id: staff.user_id,
                status: MallStaffStatuses.Active
              }),
              mallService.findOne({
                manager_id: staff.user_id,
                status: MallStatuses.Active
              }),
              mallService.updateOne(
                {
                  _id: mall._id
                },
                { $inc: { total_active_staffs: 1 } }
              )
            ]);
            if (existedStaff) {
              throw new BaseError({
                statusCode: 400,
                error: errorCode.client,
                errors: {
                  staff: errorCode['client.existedMallStaff']
                }
              });
            }
            if (existedManager) {
              throw new BaseError({
                statusCode: 400,
                error: errorCode.client,
                errors: {
                  staff: errorCode['client.isOtherMallManager']
                }
              });
            }
          }
          if (status === MallStaffStatuses.Disabled) {
            await mallService.updateOne({ _id: mall._id }, { $inc: { total_active_staffs: -1 } });
          }
        }
        const result = await mallStaffService.findByIdAndUpdate(id, update, {
          new: true
        });
        withSafety(() => {
          mallActivityService.implicitCreate(mallActions.updateStaff)(req, {
            object_ids: [result._id]
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
    async search(req, res, next) {
      try {
        const { _id: mall_id } = req.mall;
        const { staff_name, page, limit } = req.query;
        await mallService.findEnsure({
          _id: mall_id,
          status: MallStaffStatuses.Active
        });
        const [result, { total_page, total }] = await mallStaffService.findWithPagination({
          limit,
          page,
          sort: { score: { $meta: 'textScore' } },
          select: { score: { $meta: 'textScore' } },
          query: { $text: { $search: staff_name }, mall_id }
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
  },
  staff: {
    async get(req, res, next) {
      try {
        const { user_id } = req.mall;
        const { limit, page, select, sort, roles, ...query } = req.query;
        const mainQuery = roles ? { ...query, roles: { $all: roles } } : query;
        const [result, { total_page, total }] = await mallStaffService.findWithPagination({
          page,
          limit,
          select,
          sort,
          query: { ...mainQuery, user_id }
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
        const { user_id } = req.mall;
        const { id } = req.params;
        const { select } = req.query;
        const result = await mallStaffService.findOne({ _id: id, user_id }, select);
        return new BaseResponse({ statusCode: 200, data: result }).return(res);
      } catch (error) {
        next(error);
      }
    },
    async getMyInfo(req, res, next) {
      try {
        const { staff_id } = req.mall;
        const result = await mallStaffService.findOne({
          _id: staff_id,
          status: MallStaffStatuses.Active
        });
        return new BaseResponse({
          statusCode: 200,
          data: result
        }).return(res);
      } catch (error) {
        next(error);
      }
    }
  }
};
