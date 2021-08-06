import workScheduleService from './work-schedule.service';
import moment from 'moment';
import mallService from '../mall/mall.service';
import mallStaffService from '../staff/staff.service';
import { ScheduleStatuses, AddScheduleRoles } from './work-schedule.config';
import {
  BaseError,
  errorCode,
  BaseResponse,
  withSession,
  withSafety
} from '../../../commons/utils';
import { Promise } from 'bluebird';
import { MallStatuses } from '../mall/mall.config';
import staffService from '../staff/staff.service';
import { MallStaffStatuses } from '../staff/staff.config';
import staffCheckInService from '../staff-check-in/staff-check-in.service';
import { CheckInStatuses } from '../staff-check-in/staff-check-in.config';
import notificationService from '../../notification/notification.service';
import mallActivityService from '../mall-activity/mall-activity.service';
import { mallActions } from '../mall-activity/mall-activity.config';
import _ from 'lodash';

export default {
  admin: {
    async get(req, res, next) {
      try {
        const { limit, page, select, sort, from, to, ...query } = req.query;
        if (from || to) {
          query.date = {};
          from && (query.date['$gte'] = new Date(from));
          to && (query.date['$lte'] = new Date(to));
        }
        const [result, { total_page, total }] = await workScheduleService.findWithPagination({
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
        const result = await workScheduleService.findOne({ _id: id }, select);
        return new BaseResponse({ statusCode: 200, data: result }).return(res);
      } catch (error) {
        next(error);
      }
    }
  },
  mall: {
    async get(req, res, next) {
      try {
        const { _id: mall_id } = req.mall;
        const { limit, page, select, sort, from, to, ...query } = req.query;
        if (from || to) {
          query.date = {};
          from && (query.date['$gte'] = new Date(from));
          to && (query.date['$lte'] = new Date(to));
        }
        await mallService.findEnsure({
          _id: mall_id,
          status: MallStatuses.Active
        });
        const [result, { total_page, total }] = await workScheduleService.findWithPagination({
          page,
          limit,
          select,
          sort,
          query: { ...query, mall_id }
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
          status: MallStatuses.Active
        });
        const result = await workScheduleService.findOne({ _id: id, mall_id }, select);
        return new BaseResponse({ statusCode: 200, data: result }).return(res);
      } catch (error) {
        next(error);
      }
    },
    async updateStatus(req, res, next) {
      try {
        const { _id: mall_id } = req.mall;
        const { id } = req.params;
        const { status } = req.body;
        const result = await withSession(async (session) => {
          const mall = await mallService.findEnsure(
            {
              _id: mall_id,
              status: MallStatuses.Active
            },
            null,
            { session }
          );
          const workSchedule = await workScheduleService.findEnsure({
            _id: id,
            mall_id: mall._id,
            options: {
              populate: [
                {
                  path: 'staff',
                  match: { status: MallStaffStatuses.Active },
                  populate: {
                    path: 'user',
                    status: { $ne: 'disabled' }
                  }
                }
              ],
              session
            }
          });
          if (!workSchedule.staff || !workSchedule.staff.user) {
            throw new BaseError({
              statusCode: 400,
              error: errorCode.client,
              errors: {
                staff: errorCode['client.staffNotExists']
              }
            });
          }
          if (status === ScheduleStatuses.Active) {
            const existedSchedule = await workScheduleService.findOne(
              {
                _id: { $ne: id },
                status: ScheduleStatuses.Active,
                mall_id: mall._id,
                staff_id: workSchedule.staff_id,
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
              object: mall
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
          const updateStatus =
            status === ScheduleStatuses.Active
              ? ScheduleStatuses.Active
              : ScheduleStatuses.ManagerDisabled;
          const [result, checkIns] = await Promise.all([
            workSchedule.save({ session }),
            staffCheckInService.updateMany(
              {
                staff_id: workSchedule.staff_id,
                mall_id: workSchedule.mall_id,
                date: workSchedule.date
              },
              { status: updateStatus },
              { session }
            )
          ]);
          notificationService.createAndSend({
            user_id: workSchedule.staff.user_id,
            staff_id: workSchedule.staff_id,
            type: 'schedule_be_changed',
            title: `Trạng thái lịch làm việc đã thay đổi.`,
            message: `Lịch làm việc của bạn vào ngày ${workSchedule.date} đã bị thay đổi trạng thái bởi quản lí, hãy vào kiểm tra nhé !`,
            object_id: result._id,
            onModel: 's_work_schedule'
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
        const { _id: mall_id } = req.mall;
        const { staff_id, schedule, details } = req.body;
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
          const staff = await staffService.findEnsure({
            _id: staff_id,
            status: MallStaffStatuses.Active,
            options: {
              populate: [
                {
                  path: 'user',
                  match: { status: { $ne: 'disabled' } }
                },
                {
                  path: 'mall',
                  match: { status: MallStatuses.Active, _id: mall_id }
                }
              ],
              session
            }
          });
          if (!staff.user || !staff.mall) {
            throw new BaseError({
              statusCode: 400,
              error: errorCode.client,
              errors: {
                user: errorCode['client.notActive']
              }
            });
          }
          let result = [];
          if (!schedule) {
            await Promise.map(details, async ({ date, work_shifts }) => {
              const formatDate = moment.utc(date).startOf('day').toDate();
              const existedSchedule = await workScheduleService.findOne(
                {
                  staff_id,
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
                object: staff.mall
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
              const [data] = await workScheduleService.create(
                [
                  {
                    staff_id,
                    work_shifts,
                    mall_id: staff.mall_id,
                    date: formatDate,
                    add_by: AddScheduleRoles.Manager
                  }
                ],
                { session }
              );
              await staffCheckInService.createCheckIns([data], session);
              result.push(data);
            });
          }
          if (schedule) {
            const sunday = moment.utc().startOf('day').day(7).toDate();
            await workScheduleService.updateMany(
              { staff_id: staff._id, date: { $gt: sunday } },
              { status: ScheduleStatuses.ManagerDisabled },
              { session }
            );

            const [disabledSchedule, workSchedules] = await Promise.all([
              workScheduleService.find(
                {
                  staff_id,
                  date: { $gt: sunday }
                },
                null,
                { session }
              ),
              workScheduleService.getSchedule({
                schedule,
                staff: staff
              })
            ]);
            result = await Promise.map(workSchedules, async (schedule) => {
              const query = {
                staff_id: schedule.staff_id,
                mall_id: schedule.mall_id,
                date: schedule.date
              };
              return await workScheduleService.findOneAndUpdate(
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

            const nextMonday = new Date(sunday.getTime() + 1 * 24 * 60 * 60 * 1000);
            const nextSunday = new Date(sunday.getTime() + 7 * 24 * 60 * 60 * 1000);
            await Promise.all([
              staffCheckInService.updateMany(
                {
                  mall_id: staff.mall_id,
                  staff_id: staff._id,
                  date: { $gte: nextMonday, $lte: nextSunday }
                },
                { status: CheckInStatuses.Disabled },
                { session }
              ),
              staffCheckInService.activateCheckIns(result, session)
            ]);
          }
          const activity = await withSafety(() => {
            return mallActivityService.implicitCreate(mallActions.createSchedule)(req, {
              object_ids: result.map((item) => item._id)
            });
          });
          notificationService.createAndSend({
            user_id: staff.user_id,
            staff_id: staff_id,
            type: 'schedule_be_created',
            title: 'Lịch làm việc đã được tạo.',
            message: `Lịch làm việc của bạn vào tuần sau đã được tạo bởi quản lí, hãy vào kiểm tra nhé !`,
            object_id: activity._id,
            onModel: 's_mall_activity'
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
        const { _id: mall_id } = req.mall;
        const { staff_id, update } = req.body;
        const result = await withSession(async (session) => {
          const staff = await staffService.findEnsure({
            _id: staff_id,
            status: MallStaffStatuses.Active,
            options: {
              populate: [
                {
                  path: 'user',
                  match: { status: { $ne: 'disabled' } }
                },
                {
                  path: 'mall',
                  match: { status: MallStatuses.Active, _id: mall_id }
                }
              ],
              session
            }
          });
          const mall = staff.mall;
          if (!staff.user || !staff.mall) {
            throw new BaseError({
              statusCode: 400,
              error: errorCode.client,
              errors: {
                user: errorCode['client.notActive']
              }
            });
          }

          const createSchedules = [];
          let result = [];
          await Promise.map(update, async ({ id, work_shifts, date }) => {
            if (id) {
              const schedule = await workScheduleService.findEnsure({
                _id: id,
                staff_id,
                options: {
                  session
                }
              });
              if (!work_shifts.length) {
                schedule.status = ScheduleStatuses.ManagerDisabled;
                schedule.work_shifts = work_shifts;
                const [savedSchedule] = await Promise.all([
                  result.push(await schedule.save({ session })),
                  staffCheckInService.findOneAndUpdate(
                    {
                      work_schedule_id: schedule._id
                    },
                    { status: CheckInStatuses.ManagerDisabled, work_shifts },
                    { session }
                  )
                ]);
                result.push(savedSchedule);
                return;
              }
              const baseWorkShifts = workScheduleService.getBaseWorkShifts({
                date: schedule.date,
                object: mall
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
              await Promise.all([
                staffCheckInService.updateMany(
                  {
                    staff_id: schedule.staff_id,
                    mall_id: schedule.mall_id,
                    date: schedule.date
                  },
                  { status: CheckInStatuses.ManagerDisabled },
                  { session }
                ),
                staffCheckInService.activateCheckIns(result, session)
              ]);
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
              const existedSchedule = await workScheduleService.findOne(
                {
                  staff_id,
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
                object: mall
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
              const data = {
                staff_id,
                work_shifts,
                date: formatDate,
                add_by: AddScheduleRoles.Manager,
                user_id: staff.user_id,
                mall_id: staff.mall_id
              };
              createSchedules.push(data);
            }
          });
          if (createSchedules.length) {
            const schedules = await workScheduleService.create(createSchedules, { session });
            const checkIns = await staffCheckInService.createCheckIns(schedules, session);
            result = [...result, ...schedules];
          }
          notificationService.createAndSend({
            user_id: staff.user_id,
            staff_id: staff._id,
            type: 'schedule_be_changed',
            title: 'Lịch làm việc đã thay đổi.',
            message: `Lịch làm việc của bạn đã được thay đổi bởi quản lí, hãy vào kiểm tra nhé !`,
            object_id: result[0]._id,
            onModel: 's_work_schedule'
          });
          return result;
        });
        withSafety(() => {
          mallActivityService.implicitCreate(mallActions.updateSchedule)(req, {
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
    }
  },
  staff: {
    async get(req, res, next) {
      try {
        const { staff_id } = req.mall;
        const { limit, page, select, sort, from, to, ...query } = req.query;
        if (from || to) {
          query.date = {};
          from && (query.date['$gte'] = new Date(from));
          to && (query.date['$lte'] = new Date(to));
        }
        const [result, { total_page, total }] = await workScheduleService.findWithPagination({
          page,
          limit,
          select,
          sort,
          query: { ...query, staff_id }
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
        const { staff_id } = req.mall;
        const { id } = req.params;
        const { select } = req.query;
        const result = await workScheduleService.findOne({ _id: id, staff_id }, select);
        return new BaseResponse({ statusCode: 200, data: result }).return(res);
      } catch (error) {
        next(error);
      }
    },
    async update(req, res, next) {
      try {
        const { staff_id } = req.mall;
        const { schedule } = req.body;
        const sunday = moment.utc().startOf('day').day(7).toDate();
        const nextMonday = new Date(sunday.getTime() + 1 * 24 * 60 * 60 * 1000);
        const nextSunday = new Date(sunday.getTime() + 7 * 24 * 60 * 60 * 1000);
        const result = await withSession(async (session) => {
          const [activeStaff, disabledSchedule, existedSchedule] = await Promise.all([
            mallStaffService.findEnsure({
              _id: staff_id,
              status: MallStatuses.Active,
              options: {
                populate: [
                  {
                    path: 'mall',
                    match: { status: MallStatuses.Active, staff_register_schedule: true }
                  },
                  { path: 'user', match: { status: { $ne: 'disabled' } } }
                ],
                session
              }
            }),
            workScheduleService.updateMany(
              {
                staff_id,
                date: { $gt: sunday },
                status: { $ne: ScheduleStatuses.ManagerDisabled }
              },
              { status: ScheduleStatuses.Disabled },
              { session }
            ),
            workScheduleService.findOne({
              staff_id,
              date: { $gte: nextMonday, $lte: nextSunday },
              status: ScheduleStatuses.Active,
              add_by: AddScheduleRoles.Manager
            })
          ]);
          if (!activeStaff.mall || !activeStaff.user) {
            throw new BaseError({
              statusCode: 400,
              error: errorCode.client,
              errors: {
                mall: errorCode['client.mallNotExists']
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
          const workSchedules = workScheduleService.getSchedule({
            schedule,
            staff: activeStaff
          });
          const result = await Promise.map(workSchedules, async (schedule) => {
            const query = {
              staff_id: schedule.staff_id,
              mall_id: schedule.mall_id,
              date: schedule.date
            };
            return await workScheduleService.findOneAndUpdate(
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
          await Promise.all([
            staffCheckInService.updateMany(
              {
                mall_id: activeStaff.mall_id,
                staff_id: activeStaff._id,
                date: { $gte: nextMonday, $lte: nextSunday },
                status: { $ne: ScheduleStatuses.ManagerDisabled }
              },
              { status: CheckInStatuses.Disabled },
              { session }
            ),
            staffCheckInService.activateCheckIns(result, session)
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
        const { staff_id } = req.mall;
        const { id } = req.params;
        const { status } = req.body;
        const sunday = moment.utc().startOf('day').day(7).toDate();
        const result = await withSession(async (session) => {
          const [activeStaff, workSchedule] = await Promise.all([
            mallStaffService.findEnsure({
              _id: staff_id,
              status: MallStaffStatuses.Active,
              options: {
                populate: [
                  { path: 'mall', match: { status: MallStatuses.Active } },
                  { path: 'user', match: { status: { $ne: 'disabled' } } }
                ],
                session
              }
            }),
            workScheduleService.findEnsure({
              _id: id,
              staff_id,
              status: { $ne: ScheduleStatuses.ManagerDisabled },
              date: { $gt: sunday },
              options: { session }
            })
          ]);
          if (!activeStaff.mall || !activeStaff.user) {
            throw new BaseError({
              statusCode: 400,
              error: errorCode.client,
              errors: {
                mall: errorCode['client.mallNotExists']
              }
            });
          }
          if (status === ScheduleStatuses.Active) {
            const existedSchedule = await workScheduleService.findOne(
              {
                _id: { $ne: id },
                status: ScheduleStatuses.Active,
                mall_id: activeStaff.mall_id,
                staff_id: workSchedule.staff_id,
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
              object: activeStaff.mall
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
          const updateStatus =
            status === ScheduleStatuses.Active
              ? ScheduleStatuses.Active
              : ScheduleStatuses.Disabled;
          const [result, checkIns] = await Promise.all([
            workSchedule.save({ session }),
            staffCheckInService.updateMany(
              {
                staff_id: workSchedule.staff_id,
                mall_id: workSchedule.mall_id,
                date: workSchedule.date,
                status: { $ne: CheckInStatuses.ManagerDisabled }
              },
              { status: updateStatus },
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
    }
  }
};
