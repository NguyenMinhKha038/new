import {
  BaseError,
  BaseResponse,
  errorCode,
  withSafety,
  withSession
} from '../../../commons/utils';
import permissionGroupService from '../../permission-group/permission-group.service';
import companyScheduleService from '../company-schedule.service';
import companySettingService from '../../setting/setting.service';
import { AddScheduleRoles, Levels, ScheduleStatuses } from '../company-schedule.config';
import workScheduleService from '../../sum-mall/work-schedule/work-schedule.service';
import { CompanyActions } from '../../company-activity/company-activity.config';
import companyActivityService from '../../company-activity/company-activity.service';
import notificationService from '../../notification/notification.service';
import moment from 'moment';
import { Promise } from 'bluebird';
import populateSensitive from '../../../commons/utils/populate-sensitive-field';

export default {
  admin: {
    async get(req, res, next) {
      try {
        const { limit, page, select, populate, sort, from, to, level, ...query } = req.query;
        if (from || to) {
          query.date = {};
          from && (query.date['$gte'] = new Date(from));
          to && (query.date['$lte'] = new Date(to));
        }
        if (level) {
          if (level === Levels.Company) {
            query.$or = [{ store_id: { $exists: false } }, { store_id: { $eq: null } }];
          }
          if (level === Levels.Store) {
            query.$and = [{ store_id: { $exists: true } }, { store_id: { $ne: null } }];
          }
        }
        const sensitivePopulate = populateSensitive(populate);
        const [result, { total_page, total }] = await companyScheduleService.findWithPagination({
          page,
          limit,
          select,
          sort,
          query,
          populate: sensitivePopulate
        });
        return new BaseResponse({ statusCode: 200, data: result })
          .addMeta({ total_page, total })
          .return(res);
      } catch (error) {
        next(error);
      }
    }
  },
  company: {
    async get(req, res, next) {
      try {
        const { _id: company_id, type, store_id, is_owner, permission_group_id } = req.company;
        const { limit, populate, page, select, sort, from, level, to, ...query } = req.query;
        if (!is_owner && !type) {
          throw new BaseError({
            statusCode: 400,
            error: errorCode.authorization,
            errors: {
              permission: errorCode['permission.notAllow']
            }
          });
        }
        if (!is_owner && type.includes('store_manager')) {
          query.store_id = store_id;
        }
        if (!is_owner && !type.includes('store_manager')) {
          query.permission_group_id = permission_group_id;
        }
        if (from || to) {
          query.date = {};
          from && (query.date['$gte'] = new Date(from));
          to && (query.date['$lte'] = new Date(to));
        }
        if (level) {
          if (level === Levels.Company) {
            query.$or = [{ store_id: { $exists: false } }, { store_id: { $eq: null } }];
          }
          if (level === Levels.Store) {
            query.$and = [{ store_id: { $exists: true } }, { store_id: { $ne: null } }];
          }
        }
        const sensitivePopulate = populateSensitive(populate);
        const [result, { total_page, total }] = await companyScheduleService.findWithPagination({
          page,
          limit,
          select,
          sort,
          query: { ...query, company_id },
          populate: sensitivePopulate
        });
        return new BaseResponse({ statusCode: 200, data: result })
          .addMeta({ total_page, total })
          .return(res);
      } catch (error) {
        next(error);
      }
    },
    async create(req, res, next) {
      try {
        const { _id: company_id, type, store_id, is_owner } = req.company;
        const { permission_group_id, schedule, details } = req.body;
        if (!is_owner && (!type || !type.includes('store_manager'))) {
          throw new BaseError({
            statusCode: 400,
            error: errorCode.authorization,
            errors: {
              permission: errorCode['permission.notAllow']
            }
          });
        }
        const endNextSunday = moment
          .utc()
          .endOf('day')
          .day(7 + 7)
          .toDate();
        details &&
          details.find((detail) => {
            if (detail.date > endNextSunday) {
              throw new BaseError({
                statusCode: 400,
                error: errorCode.client,
                errors: {
                  time: errorCode['client.notActive']
                }
              });
            }
          });

        const result = await withSession(async (session) => {
          const staffQuery = {
            _id: permission_group_id,
            company_id
          };
          const [staff, companySettings] = await Promise.all([
            permissionGroupService.findOneActive(
              {
                _id: permission_group_id,
                company_id
              },
              null,
              {
                populate: [
                  {
                    path: 'company',
                    match: { status: 'approved' }
                  },
                  {
                    path: 'user',
                    match: { status: { $ne: 'disabled' } }
                  }
                ],
                session
              }
            ),
            companySettingService.get(company_id)
          ]);
          if (!is_owner && staff.store_id.toString() !== store_id.toString()) {
            throw new BaseError({
              statusCode: 400,
              error: errorCode.authorization,
              errors: {
                permission: errorCode['permission.notAllow']
              }
            });
          }
          if (!staff || !staff.user || !staff.company) {
            throw new BaseError({
              statusCode: 400,
              error: errorCode.client,
              errors: {
                user: errorCode['client.notActive']
              }
            });
          }
          if (!companySettings || !companySettings.weekly_work_shifts) {
            throw new BaseError({
              statusCode: 400,
              error: errorCode.client,
              errors: {
                settings: errorCode['client.noScheduleSettingExists']
              }
            });
          }
          let result;
          if (!schedule) {
            let schedules = [];
            await Promise.map(details, async ({ date, work_shifts }) => {
              const formatDate = moment.utc(date).startOf('day').toDate();
              const existedSchedule = await companyScheduleService.findOne(
                {
                  permission_group_id,
                  date: formatDate,
                  status: ScheduleStatuses.Active
                },
                null,
                { session }
              );
              if (existedSchedule) {
                throw new BaseError({
                  statusCode: 400,
                  error: errorCode.client,
                  errors: {
                    schedule: errorCode['client.scheduleExisted']
                  }
                });
              }
              const baseWorkShifts = workScheduleService.getBaseWorkShifts({
                date,
                object: companySettings
              });
              const isValidWorkShifts = workScheduleService.checkValidWorkShifts({
                workShifts: work_shifts,
                baseWorkShifts
              });
              if (!isValidWorkShifts) {
                throw new BaseError({
                  statusCode: 400,
                  error: errorCode.client,
                  errors: {
                    work_shifts: errorCode['client.invalidWorkShift']
                  }
                });
              }

              schedules.push({
                permission_group_id,
                work_shifts,
                company_id,
                date: formatDate,
                add_by: AddScheduleRoles.Manager,
                user_id: staff.user_id,
                store_id: staff.store_id
              });
            });
            result = await companyScheduleService.create(schedules, { session });
          }
          if (schedule) {
            const sunday = moment.utc().startOf('day').day(7).toDate();
            await companyScheduleService.updateMany(
              { permission_group_id, date: { $gt: sunday } },
              { status: ScheduleStatuses.ManagerDisabled },
              { session }
            );
            const [disabledSchedule, workSchedules] = await Promise.all([
              companyScheduleService.find(
                {
                  permission_group_id,
                  date: { $gt: sunday }
                },
                null,
                { session }
              ),
              companyScheduleService.getSchedule({
                schedule,
                permissionGroup: staff,
                settings: companySettings
              })
            ]);
            result = await Promise.map(workSchedules, async (schedule) => {
              const query = {
                permission_group_id: schedule.permission_group_id,
                company_id: schedule.company_id,
                date: schedule.date,
                user_id: staff.user_id,
                store_id: staff.store_id
              };
              return await companyScheduleService.findOneAndUpdate(
                query,
                {
                  ...query,
                  work_shifts: schedule.work_shifts,
                  status: ScheduleStatuses.Active,
                  add_by: AddScheduleRoles.Manager
                },
                { upsert: true, new: true, setDefaultsOnInsert: true, session }
              );
            });
            disabledSchedule.forEach((schedule) => {
              const isActivate = result.find(
                (item) => item._id.toString() === schedule._id.toString()
              );
              if (!isActivate) {
                result.push(schedule);
              }
            });
          }
          const activity = await withSafety(() => {
            return companyActivityService.implicitCreate(CompanyActions.createSchedule)(req, {
              object_id: company_id
            });
          });
          notificationService.createAndSend({
            user_id: staff.user_id,
            company_id: staff.company_id,
            type: 'schedule_be_created',
            title: 'Lịch làm việc đã được tạo.',
            message: `Lịch làm việc của bạn vào tuần sau đã được tạo bởi quản lí, hãy vào kiểm tra nhé !`,
            object_id: result[0]._id,
            onModel: 's_company_schedule'
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
    },
    async update(req, res, next) {
      try {
        const { _id: company_id, type, store_id, is_owner } = req.company;
        if (!is_owner && (!type || !type.includes('store_manager'))) {
          throw new BaseError({
            statusCode: 400,
            error: errorCode.authorization,
            errors: {
              permission: errorCode['permission.notAllow']
            }
          });
        }
        const { update, permission_group_id } = req.body;

        const result = await withSession(async (session) => {
          const [staff, companySettings] = await Promise.all([
            permissionGroupService.findOneActive(
              {
                _id: permission_group_id,
                company_id
              },
              null,
              {
                populate: [
                  {
                    path: 'company',
                    match: { status: 'approved' }
                  },
                  {
                    path: 'user',
                    match: { status: { $ne: 'disabled' } }
                  }
                ],
                session
              }
            ),
            await companySettingService.get(company_id, { session })
          ]);
          if (!is_owner && staff.store_id.toString() !== store_id.toString()) {
            throw new BaseError({
              statusCode: 400,
              error: errorCode.authorization,
              errors: {
                permission: errorCode['permission.notAllow']
              }
            });
          }

          if (!staff || !staff.user || !staff.company) {
            throw new BaseError({
              statusCode: 400,
              error: errorCode.client,
              errors: {
                user: errorCode['client.notActive']
              }
            });
          }
          if (!companySettings || !companySettings.weekly_work_shifts) {
            throw new BaseError({
              statusCode: 400,
              error: errorCode.client,
              errors: {
                settings: errorCode['client.noScheduleSettingExists']
              }
            });
          }
          let result = [];
          const createSchedules = [];
          await Promise.map(update, async ({ id, work_shifts, date }) => {
            if (id) {
              const schedule = await companyScheduleService.findEnsure({
                _id: id,
                company_id,
                permission_group_id,
                date: { $gte: moment.utc(Date.now()).startOf('day').toDate() },
                options: {
                  session
                }
              });
              if (!is_owner && schedule.store_id.toString() !== store_id.toString()) {
                throw new BaseError({
                  statusCode: 400,
                  error: errorCode.authorization,
                  errors: {
                    permission: errorCode['permission.notAllow']
                  }
                });
              }
              if (!work_shifts.length) {
                schedule.status = ScheduleStatuses.ManagerDisabled;
                schedule.work_shifts = work_shifts;
                result.push(await schedule.save({ session }));
                return;
              }
              const baseWorkShifts = workScheduleService.getBaseWorkShifts({
                date: schedule.date,
                object: companySettings
              });
              const isValidWorkShifts = workScheduleService.checkValidWorkShifts({
                workShifts: work_shifts,
                baseWorkShifts
              });
              if (!isValidWorkShifts) {
                throw new BaseError({
                  statusCode: 400,
                  error: errorCode.client,
                  errors: {
                    work_shifts: errorCode['client.invalidWorkShift']
                  }
                });
              }
              schedule.work_shifts = work_shifts;
              schedule.status = ScheduleStatuses.Active;
              result.push(await schedule.save({ session }));
            }
            if (date) {
              if (!work_shifts.length) {
                throw new BaseError({
                  statusCode: 400,
                  error: errorCode.client,
                  errors: {
                    work_shifts: errorCode['client.invalidWorkShift']
                  }
                });
              }
              const formatDate = moment.utc(date).startOf('day').toDate();
              const existedSchedule = await companyScheduleService.findOne(
                {
                  permission_group_id,
                  date: formatDate,
                  status: ScheduleStatuses.Active
                },
                null,
                { session }
              );
              if (existedSchedule) {
                throw new BaseError({
                  statusCode: 400,
                  error: errorCode.client,
                  errors: {
                    schedule: errorCode['client.scheduleExisted']
                  }
                });
              }
              const baseWorkShifts = workScheduleService.getBaseWorkShifts({
                date,
                object: companySettings
              });
              const isValidWorkShifts = workScheduleService.checkValidWorkShifts({
                workShifts: work_shifts,
                baseWorkShifts
              });
              if (!isValidWorkShifts) {
                throw new BaseError({
                  statusCode: 400,
                  error: errorCode.client,
                  errors: {
                    work_shifts: errorCode['client.invalidWorkShift']
                  }
                });
              }
              createSchedules.push({
                permission_group_id,
                work_shifts,
                company_id,
                date: formatDate,
                add_by: AddScheduleRoles.Manager,
                user_id: staff.user_id,
                store_id: staff.store_id
              });
            }
          });
          if (createSchedules.length) {
            const schedules = await companyScheduleService.create(createSchedules, { session });
            result = [...result, ...schedules];
          }
          notificationService.createAndSend({
            user_id: staff.user_id,
            company_id: staff.company_id,
            type: 'schedule_be_changed',
            title: 'Lịch làm việc đã thay đổi.',
            message: `Lịch làm việc của bạn đã được thay đổi bởi quản lí, hãy vào kiểm tra nhé !`,
            object_id: result[0]._id,
            onModel: 's_company_schedule'
          });
          return result;
        });
        withSafety(() => {
          companyActivityService.implicitCreate(CompanyActions.updateSchedule)(req, {
            object_id: result._id
          });
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
