import moment from 'moment';
import { userService } from '../../../commons/user';
import { BaseError, BaseResponse, errorCode, withSafety } from '../../../commons/utils';
import { MallStatuses } from '../mall/mall.config';
import mallService from '../mall/mall.service';
import { MallStaffStatuses } from '../staff/staff.config';
import { ScheduleStatuses } from '../work-schedule/work-schedule.config';
import workScheduleService from '../work-schedule/work-schedule.service';
import { CheckInRoles, CheckInStatuses } from './staff-check-in.config';
import staffCheckInService from './staff-check-in.service';
import mallActivityService from '../mall-activity/mall-activity.service';
import { mallActions } from '../mall-activity/mall-activity.config';

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
        const [result, { total_page, total }] = await staffCheckInService.findWithPagination({
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
        const result = await staffCheckInService.findOne({ _id: id }, select);
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
        const [result, { total_page, total }] = await staffCheckInService.findWithPagination({
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
        const result = await staffCheckInService.findOne({ _id: id, mall_id }, select);
        return new BaseResponse({ statusCode: 200, data: result }).return(res);
      } catch (error) {
        next(error);
      }
    },
    async checkIn(req, res, next) {
      try {
        const { _id: mall_id } = req.mall;
        const { check_in_id } = req.body;
        const checkIn = await staffCheckInService.findEnsure({
          _id: check_in_id,
          status: CheckInStatuses.Active,
          check_in: { $exists: false },
          options: {
            populate: [
              {
                path: 'work_schedule',
                match: { status: ScheduleStatuses.Active, date: { $lte: new Date() } }
              },
              { path: 'mall', match: { status: MallStatuses.Active, _id: mall_id } },
              {
                path: 'staff',
                match: { status: MallStaffStatuses.Active },
                populate: { path: 'user', match: { status: { $ne: 'disabled' } } }
              }
            ]
          }
        });
        const workSchedule = checkIn.work_schedule;
        const mall = checkIn.mall;
        const staff = checkIn.staff;
        if (!workSchedule || !mall || !staff || !staff.user) {
          throw new BaseError({
            statusCode: 400,
            error: errorCode.client,
            errors: {
              check_in: errorCode['client.notActive']
            }
          });
        }
        const isValidWorkShift = workScheduleService.checkValidWorkShifts({
          workShifts: [checkIn.work_shift],
          baseWorkShifts: workSchedule.work_shifts
        });
        if (!isValidWorkShift) {
          throw new BaseError({
            statusCode: 400,
            error: errorCode.client,
            errors: {
              work_shift: errorCode['client.invalidWorkShift']
            }
          });
        }
        checkIn.check_in = new Date();
        checkIn.check_in_by = CheckInRoles.Manager;
        checkIn.salary_per_hour = staff.salary_per_hour;
        const result = await checkIn.save();
        withSafety(() => {
          mallActivityService.implicitCreate(mallActions.checkInForStaff)(req, {
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
        const { status } = req.body;
        const update = req.body;
        const staffCheckIn = await staffCheckInService.findEnsure({
          _id: id,
          options: {
            populate: [
              {
                path: 'staff',
                match: {
                  status: MallStaffStatuses.Active
                },
                populate: {
                  path: 'user',
                  status: { $ne: 'disabled' }
                }
              },
              {
                path: 'mall',
                match: {
                  status: MallStatuses.Active,
                  _id: mall_id
                }
              },
              {
                path: 'work_schedule',
                match: {
                  status: ScheduleStatuses.Active
                }
              }
            ]
          }
        });
        const staff = staffCheckIn.staff;
        const mall = staffCheckIn.mall;
        const workSchedule = staffCheckIn.work_schedule;
        if (!staff || !mall || !workSchedule || !staff.user) {
          throw new BaseError({
            statusCode: 400,
            error: errorCode.client,
            errors: {
              check_in: errorCode['client.notActive']
            }
          });
        }
        if (status === CheckInStatuses.Active) {
          const existedCheckIn = await staffCheckInService.findOne({
            _id: { $ne: id },
            staff_id: staff._id,
            mall_id: mall._id,
            date: staffCheckIn.date,
            work_shift: staffCheckIn.work_shift,
            status: CheckInStatuses.Active
          });
          if (existedCheckIn) {
            throw new BaseError({
              statusCode: 400,
              error: errorCode.client,
              errors: {
                check_in: errorCode['client.checkInExisted']
              }
            });
          }
          const isValidWorkShift = workScheduleService.checkValidWorkShifts({
            workShifts: [staffCheckIn.work_shift],
            baseWorkShifts: workSchedule.work_shifts
          });
          if (!isValidWorkShift) {
            throw new BaseError({
              statusCode: 400,
              error: errorCode.client,
              errors: {
                work_shift: errorCode['client.invalidWorkShift']
              }
            });
          }
        }
        const result = await staffCheckInService.findOneAndUpdate(
          { _id: id },
          { ...update, check_in_by: CheckInRoles.Manager },
          {
            new: true
          }
        );
        return new BaseResponse({
          statusCode: 200,
          data: result
        }).return(res);
      } catch (error) {
        next(error);
      }
    },
    async checkout(req, res, next) {
      try {
        const { _id: mall_id } = req.mall;
        const { id } = req.params;
        const staffCheckIn = await staffCheckInService.findEnsure({
          _id: id,
          mall_id,
          is_finish: false,
          check_in: { $exists: true },
          status: CheckInStatuses.Active,
          options: {
            populate: [
              {
                path: 'staff',
                match: {
                  status: MallStaffStatuses.Active
                },
                populate: { path: 'user', match: { status: { $ne: 'disabled' } } }
              },
              { path: 'mall', match: { status: MallStatuses.Active, _id: mall_id } },
              {
                path: 'work_schedule',
                match: { status: ScheduleStatuses.Active, date: { $lte: new Date() } }
              }
            ]
          }
        });
        const staff = staffCheckIn.staff;
        const mall = staffCheckIn.mall;
        const schedule = staffCheckIn.work_schedule;
        if (!mall || !staff || !staff.user || !schedule) {
          throw new BaseError({
            statusCode: 400,
            error: errorCode.client,
            errors: {
              user: errorCode['client.notActive']
            }
          });
        }
        const isValidWorkShift = workScheduleService.checkValidWorkShifts({
          workShifts: [staffCheckIn.work_shift],
          baseWorkShifts: schedule.work_shifts
        });
        if (!isValidWorkShift) {
          throw new BaseError({
            statusCode: 400,
            error: errorCode.client,
            errors: {
              work_shift: errorCode['client.invalidWorkShift']
            }
          });
        }
        staffCheckIn.check_out = new Date();
        staffCheckIn.is_finish = true;
        const result = await staffCheckIn.save();
        withSafety(() => {
          mallActivityService.implicitCreate(mallActions.checkOutForStaff)(req, {
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
        const [result, { total_page, total }] = await staffCheckInService.findWithPagination({
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
        const result = await staffCheckInService.findOne({ _id: id, staff_id }, select);
        return new BaseResponse({ statusCode: 200, data: result }).return(res);
      } catch (error) {
        next(error);
      }
    },
    async checkIn(req, res, next) {
      try {
        const { staff_id } = req.mall;
        const { check_in_id } = req.body;
        const formatDate = moment.utc(new Date()).startOf('day').toDate();
        const staffCheckIn = await staffCheckInService.findEnsure({
          _id: check_in_id,
          staff_id,
          status: CheckInStatuses.Active,
          is_finish: false,
          check_in: { $exists: false },
          date: formatDate,
          options: {
            populate: [
              {
                path: 'work_schedule',
                match: { status: ScheduleStatuses.Active, date: { $lte: new Date() } }
              },
              { path: 'mall', match: { status: MallStatuses.Active } },
              {
                path: 'staff',
                match: { status: MallStaffStatuses.Active },
                populate: {
                  path: 'user',
                  match: { status: { $ne: 'disabled' } }
                }
              }
            ]
          }
        });
        const mall = staffCheckIn.mall;
        const workSchedule = staffCheckIn.work_schedule;
        const staff = staffCheckIn.staff;
        if (!mall || !staff || !workSchedule || !staff.user) {
          throw new BaseError({
            statusCode: 400,
            error: errorCode.client,
            errors: {
              mall: errorCode['client.notActive']
            }
          });
        }
        const isValidWorkShift = workScheduleService.checkValidWorkShifts({
          workShifts: [staffCheckIn.work_shift],
          baseWorkShifts: workSchedule.work_shifts
        });
        if (!isValidWorkShift) {
          throw new BaseError({
            statusCode: 400,
            error: errorCode.client,
            errors: {
              work_shift: errorCode['client.invalidWorkShift']
            }
          });
        }
        staffCheckIn.check_in = new Date();
        staffCheckIn.check_in_by = CheckInRoles.Staff;
        staffCheckIn.salary_per_hour = staff.salary_per_hour;
        const result = await staffCheckIn.save();
        return new BaseResponse({
          statusCode: 200,
          data: result
        }).return(res);
      } catch (error) {
        next(error);
      }
    },
    async checkout(req, res, next) {
      try {
        const { staff_id } = req.mall;
        const { id } = req.params;
        const formatDate = moment.utc(new Date()).startOf('day').toDate();
        const staffCheckIn = await staffCheckInService.findEnsure({
          _id: id,
          staff_id,
          date: formatDate,
          is_finish: false,
          check_in: { $exists: true },
          status: CheckInStatuses.Active,
          options: {
            populate: [
              {
                path: 'staff',
                match: {
                  status: MallStaffStatuses.Active
                },
                populate: { path: 'user', match: { status: { $ne: 'disabled' } } }
              },
              { path: 'mall', match: { status: MallStatuses.Active } },
              { path: 'work_schedule', match: { status: ScheduleStatuses.Active } }
            ]
          }
        });
        const staff = staffCheckIn.staff;
        const mall = staffCheckIn.mall;
        const schedule = staffCheckIn.work_schedule;
        if (!mall || !staff || !staff.user || !schedule) {
          throw new BaseError({
            statusCode: 400,
            error: errorCode.client,
            errors: {
              user: errorCode['client.notActive']
            }
          });
        }
        const isValidWorkShift = workScheduleService.checkValidWorkShifts({
          workShifts: [staffCheckIn.work_shift],
          baseWorkShifts: schedule.work_shifts
        });
        if (!isValidWorkShift) {
          throw new BaseError({
            statusCode: 400,
            error: errorCode.client,
            errors: {
              work_shift: errorCode['client.invalidWorkShift']
            }
          });
        }
        staffCheckIn.check_out = new Date();
        staffCheckIn.is_finish = true;
        const result = await staffCheckIn.save();
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
