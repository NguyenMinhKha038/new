import companyScheduleService from './company-schedule.service';
import moment from 'moment';
import { ScheduleStatuses, AddScheduleRoles } from './company-schedule.config';
import { BaseError, errorCode, BaseResponse, withSession, withSafety } from '../../commons/utils';
import { Promise } from 'bluebird';
import notificationService from '../notification/notification.service';
import companyActivityService from '../company-activity/company-activity.service';
import { CompanyActions } from '../company-activity/company-activity.config';
import permissionGroupService from '../permission-group/permission-group.service';
import workScheduleService from '../sum-mall/work-schedule/work-schedule.service';
import companySettingService from '../setting/setting.service';
import populateSensitive from '../../commons/utils/populate-sensitive-field';

export default {
  admin: {
    async get(req, res, next) {
      try {
        const { limit, page, select, populate, sort, from, to, ...query } = req.query;
        if (from || to) {
          query.date = {};
          from && (query.date['$gte'] = new Date(from));
          to && (query.date['$lte'] = new Date(to));
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
    },
    async getById(req, res, next) {
      try {
        const { id } = req.params;
        const { select, populate } = req.query;
        if (!is_owner && (!type || !type.includes('store_manager'))) {
          throw new BaseError({
            statusCode: 400,
            error: errorCode.authorization,
            errors: {
              permission: errorCode['permission.notAllow']
            }
          });
        }
        const sensitivePopulate = populateSensitive(populate);
        const result = await companyScheduleService.findOne({ _id: id }, select, {
          populate: sensitivePopulate
        });
        if (!is_owner && result.store_id.toString() !== store_id.toString()) {
          throw new BaseError({
            statusCode: 400,
            error: errorCode.authorization,
            errors: {
              permission: errorCode['permission.notAllow']
            }
          });
        }
        return new BaseResponse({ statusCode: 200, data: result }).return(res);
      } catch (error) {
        next(error);
      }
    }
  },
  company: {
    async get(req, res, next) {
      try {
        const { _id: company_id, type, store_id, is_owner } = req.company;
        const { limit, populate, page, select, sort, from, to, ...query } = req.query;
        if (!is_owner && (!type || !type.includes('store_manager'))) {
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
        if (from || to) {
          query.date = {};
          from && (query.date['$gte'] = new Date(from));
          to && (query.date['$lte'] = new Date(to));
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
    async getById(req, res, next) {
      try {
        const { _id: company_id, type, store_id, is_owner } = req.company;
        const { id } = req.params;
        const { select, populate } = req.query;
        if (!is_owner && (!type || !type.includes('store_manager'))) {
          throw new BaseError({
            statusCode: 400,
            error: errorCode.authorization,
            errors: {
              permission: errorCode['permission.notAllow']
            }
          });
        }
        const sensitivePopulate = populateSensitive(populate);
        const result = await companyScheduleService.findOne({ _id: id, company_id }, select, {
          populate: sensitivePopulate
        });
        if (!is_owner && result.store_id.toString() !== store_id.toString()) {
          throw new BaseError({
            statusCode: 400,
            error: errorCode.authorization,
            errors: {
              permission: errorCode['permission.notAllow']
            }
          });
        }
        return new BaseResponse({ statusCode: 200, data: result }).return(res);
      } catch (error) {
        next(error);
      }
    },
    async updateStatus(req, res, next) {
      try {
        const { _id: company_id, type, store_id, is_owner } = req.company;
        const { id } = req.params;
        const { status } = req.body;
        if (!is_owner && (!type || !type.includes('store_manager'))) {
          throw new BaseError({
            statusCode: 400,
            error: errorCode.authorization,
            errors: {
              permission: errorCode['permission.notAllow']
            }
          });
        }
        const result = await withSession(async (session) => {
          const workSchedule = await companyScheduleService.findEnsure({
            _id: id,
            company_id,
            options: {
              populate: [
                {
                  path: 'staff',
                  match: { status: 'active' },
                  populate: {
                    path: 'user',
                    status: { $ne: 'disabled' }
                  }
                }
              ],
              session
            }
          });
          if (!is_owner && workSchedule.store_id.toString() !== store_id.toString()) {
            throw new BaseError({
              statusCode: 400,
              error: errorCode.authorization,
              errors: {
                permission: errorCode['permission.notAllow']
              }
            });
          }
          if (!workSchedule.staff || !workSchedule.staff.user) {
            throw new BaseError({
              statusCode: 400,
              error: errorCode.client,
              errors: {
                staff: errorCode['client.staffNotActive']
              }
            });
          }
          if (status === ScheduleStatuses.Active) {
            const [existedSchedule, companySettings] = await Promise.all([
              companyScheduleService.findOne(
                {
                  _id: { $ne: id },
                  status: ScheduleStatuses.Active,
                  company_id,
                  permission_group_id: workSchedule.permission_group_id,
                  date: workSchedule.date
                },
                null,
                { session }
              ),
              companySettingService.get(company_id)
            ]);
            if (!companySettings || !companySettings.weekly_work_shifts) {
              throw new BaseError({
                statusCode: 400,
                error: errorCode.client,
                errors: {
                  settings: errorCode['client.noScheduleSettingExists']
                }
              });
            }
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
              date: workSchedule.date,
              object: companySettings
            });
            const isValidWorkShifts = workScheduleService.checkValidWorkShifts({
              workShifts: workSchedule.work_shifts,
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
          }
          workSchedule.status = status;
          const result = await workSchedule.save({ session });

          notificationService.createAndSend({
            user_id: workSchedule.staff.user_id,
            staff_id: workSchedule.permission_group_id,
            type: 'schedule_be_changed',
            title: `Trạng thái lịch làm việc đã thay đổi(Company).`,
            message: `Lịch làm việc của bạn vào ngày ${workSchedule.date} đã bị thay đổi trạng thái bởi quản lí, hãy vào kiểm tra nhé !`,
            object_id: result._id,
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
    async create(req, res, next) {
      try {
        const { _id: company_id, type, store_id, is_owner } = req.company;
        const { permission_group_id, work_shifts, date, schedule } = req.body;
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
        if (date > endNextSunday) {
          throw new BaseError({
            statusCode: 400,
            error: errorCode.client,
            errors: {
              time: errorCode['client.notActive']
            }
          });
        }
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
            [result] = await companyScheduleService.create(
              [
                {
                  permission_group_id,
                  work_shifts,
                  company_id,
                  date: formatDate,
                  add_by: AddScheduleRoles.Manager,
                  user_id: staff.user_id,
                  store_id: staff.store_id
                }
              ],
              { session }
            );
          }
          if (schedule) {
            const sunday = moment.utc().startOf('day').day(7).toDate();
            await companyScheduleService.updateMany(
              { permission_group_id, date: { $gt: sunday } },
              { status: ScheduleStatuses.Disabled },
              { session }
            );
            const workSchedules = companyScheduleService.getSchedule({
              schedule,
              permissionGroup: staff,
              settings: companySettings
            });
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
          }
          const activity = await withSafety(() => {
            return companyActivityService.implicitCreate(CompanyActions.createSchedule)(req, {
              object_id: '60151387b48d07410332e89c'
            });
          });
          notificationService.createAndSend({
            user_id: staff.user_id,
            company_id: staff.company_id,
            type: 'schedule_be_created',
            title: 'Lịch làm việc đã được tạo.',
            message: `Lịch làm việc của bạn vào tuần sau đã được tạo bởi quản lí, hãy vào kiểm tra nhé !`,
            object_id: activity._id,
            onModel: 's_company_activity'
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
        const { id } = req.params;
        const { work_shifts } = req.body;
        const result = await withSession(async (session) => {
          const [schedule, companySettings] = await Promise.all([
            companyScheduleService.findEnsure({
              _id: id,
              company_id,
              date: { $gte: Date.now() },
              options: {
                populate: [
                  {
                    path: 'staff',
                    match: { status: 'active' },
                    populate: { path: 'user', match: { status: { $ne: 'disabled' } } }
                  },
                  { path: 'company', match: { status: 'approved' } }
                ],
                session
              }
            }),
            companySettingService.get(company_id)
          ]);
          if (!is_owner && schedule.store_id.toString() !== store_id.toString()) {
            throw new BaseError({
              statusCode: 400,
              error: errorCode.authorization,
              errors: {
                permission: errorCode['permission.notAllow']
              }
            });
          }
          const company = schedule.company;
          const staff = schedule.staff;
          if (!staff || !staff.user || !company) {
            throw new BaseError({
              statusCode: 400,
              error: errorCode.client,
              errors: {
                schedule: errorCode['client.notActive']
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
          const result = await schedule.save({ session });
          notificationService.createAndSend({
            user_id: staff.user_id,
            company_id: staff.company_id,
            type: 'schedule_be_changed',
            title: 'Lịch làm việc đã thay đổi.',
            message: `Lịch làm việc của bạn vào ngày ${schedule.date} đã được thay đổi bởi quản lí, hãy vào kiểm tra nhé !`,
            object_id: result._id,
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
  },
  staff: {
    async get(req, res, next) {
      try {
        const { _id: permission_group_id } = req.company_staff;
        const { limit, page, select, sort, from, to, ...query } = req.query;
        if (from || to) {
          query.date = {};
          from && (query.date['$gte'] = new Date(from));
          to && (query.date['$lte'] = new Date(to));
        }
        const [result, { total_page, total }] = await companyScheduleService.findWithPagination({
          page,
          limit,
          select,
          sort,
          query: { ...query, permission_group_id }
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
        const { _id: permission_group_id } = req.company_staff;
        const { id } = req.params;
        const { select } = req.query;
        const result = await companyScheduleService.findOne(
          { _id: id, permission_group_id },
          select
        );
        return new BaseResponse({ statusCode: 200, data: result }).return(res);
      } catch (error) {
        next(error);
      }
    },
    async update(req, res, next) {
      try {
        const { user_id, company_id } = req.company_staff;
        const { schedule } = req.body;
        const sunday = moment.utc().startOf('day').day(7).toDate();
        const nextMonday = new Date(sunday.getTime() + 1 * 24 * 60 * 60 * 1000);
        const nextSunday = new Date(sunday.getTime() + 7 * 24 * 60 * 60 * 1000);
        const result = await withSession(async (session) => {
          const activeStaff = await permissionGroupService.findOneActive(
            { user_id, company_id },
            null,
            {
              populate: [
                { path: 'company', match: { staff_register_schedule: true } },
                {
                  path: 'user',
                  match: { status: { $ne: 'disabled' } }
                }
              ],
              session
            }
          );
          if (!activeStaff) {
            throw new BaseError({
              statusCode: 400,
              error: errorCode.client,
              errors: {
                staff: errorCode['client.staffNotActive']
              }
            });
          }
          const [disabledSchedule, existedSchedule, companySettings] = await Promise.all([
            companyScheduleService.updateMany(
              {
                permission_group_id: activeStaff._id,
                date: { $gt: sunday },
                status: { $ne: ScheduleStatuses.ManagerDisabled }
              },
              { status: ScheduleStatuses.Disabled },
              { session }
            ),
            companyScheduleService.findOne({
              permission_group_id: activeStaff._id,
              date: { $gte: nextMonday, $lte: nextSunday },
              status: ScheduleStatuses.Active,
              add_by: AddScheduleRoles.Manager
            }),
            companySettingService.get(company_id)
          ]);
          if (!activeStaff.user || !activeStaff.company) {
            throw new BaseError({
              statusCode: 400,
              error: errorCode.client,
              errors: {
                staff: errorCode['client.staffNotActive']
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
          if (existedSchedule) {
            throw new BaseError({
              statusCode: 400,
              error: errorCode.client,
              errors: {
                schedule: errorCode['client.scheduleExisted']
              }
            });
          }
          const workSchedules = companyScheduleService.getSchedule({
            schedule,
            permissionGroup: activeStaff,
            settings: companySettings
          });
          const result = await Promise.map(workSchedules, async (schedule) => {
            const query = {
              permission_group_id: schedule.permission_group_id,
              company_id: schedule.company_id,
              date: schedule.date,
              user_id: activeStaff.user_id,
              store_id: activeStaff.store_id
            };
            return await companyScheduleService.findOneAndUpdate(
              {
                ...query,
                status: { $ne: ScheduleStatuses.ManagerDisabled }
              },
              {
                ...query,
                work_shifts: schedule.work_shifts,
                status: ScheduleStatuses.Active,
                add_by: AddScheduleRoles.Staff
              },
              { upsert: true, new: true, setDefaultsOnInsert: true, session }
            );
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
    async updateStatus(req, res, next) {
      try {
        const { company_id, user_id } = req.company_staff;
        const { id } = req.params;
        const { status } = req.body;
        const sunday = moment.utc().startOf('day').day(7).toDate();
        const result = await withSession(async (session) => {
          const activeStaff = await permissionGroupService.findOneActive(
            { user_id, company_id },
            null,
            {
              populate: [
                { path: 'company', match: { staff_register_schedule: true } },
                {
                  path: 'user',
                  match: { status: { $ne: 'disabled' } }
                }
              ],
              session
            }
          );
          if (!activeStaff || !activeStaff.company || !activeStaff.user) {
            throw new BaseError({
              statusCode: 400,
              error: errorCode.client,
              errors: {
                staff: errorCode['client.staffNotActive']
              }
            });
          }
          const [companySettings, workSchedule] = await Promise.all([
            companySettingService.get(company_id),
            companyScheduleService.findEnsure({
              _id: id,
              permission_group_id: activeStaff._id,
              status: { $ne: ScheduleStatuses.ManagerDisabled },
              date: { $gt: sunday },
              options: { session }
            })
          ]);
          if (!companySettings || !companySettings.weekly_work_shifts) {
            throw new BaseError({
              statusCode: 400,
              error: errorCode.client,
              errors: {
                settings: errorCode['client.noScheduleSettingExists']
              }
            });
          }
          if (status === ScheduleStatuses.Active) {
            const existedSchedule = await companyScheduleService.findOne(
              {
                _id: { $ne: id },
                status: ScheduleStatuses.Active,
                company_id: activeStaff.company_id,
                permission_group_id: workSchedule.permission_group_id,
                date: workSchedule.date
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
              date: workSchedule.date,
              object: companySettings
            });
            const isValidWorkShifts = workScheduleService.checkValidWorkShifts({
              workShifts: workSchedule.work_shifts,
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
          }
          workSchedule.status = status;
          const result = await workSchedule.save({ session });
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
  }
};
