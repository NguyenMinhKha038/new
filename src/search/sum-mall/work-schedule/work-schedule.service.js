import workScheduleModel from './work-schedule.model';
import extendService from '../../../commons/utils/extend-service';
import { mergeObject, BaseError, errorCode } from '../../../commons/utils';
import { DayOfWeek, ScheduleStatuses } from './work-schedule.config';
import moment from 'moment';

export default {
  ...extendService(workScheduleModel),
  async findEnsure({ select, options = {}, ...query }) {
    const schedule = await workScheduleModel.findOne(mergeObject({}, query), select, options);
    if (!schedule) {
      throw new BaseError({
        statusCode: 400,
        error: errorCode.client,
        errors: {
          work_schedule: errorCode['client.scheduleNotExists']
        }
      });
    }
    return schedule;
  },
  checkValidWorkShifts({ workShifts, baseWorkShifts, hasStatus }) {
    for (const work_shift of workShifts) {
      const isValidWorkShift = baseWorkShifts.find((item) => {
        if (hasStatus) {
          return item.from === work_shift.from && item.to === work_shift.to && item.active;
        }
        return item.from === work_shift.from && item.to === work_shift.to;
      });
      if (!isValidWorkShift) {
        return false;
      }
    }
    return true;
  },
  // get schedule data of next week (with specify iso) by the weekly schedule (with weekday)
  getSchedule({ schedule, staff }) {
    const mall = staff.mall;
    const weeklyWorkShifts = mall.weekly_work_shifts;
    let schedules = [];
    for (const key in schedule) {
      this.checkActiveWorkShifts({ key, schedule, weeklyWorkShifts });
      const date = moment
        .utc()
        .startOf('day')
        .day(7 + (key === 'sunday' ? 7 : DayOfWeek[key]))
        .toDate();
      schedules.push({
        date,
        work_shifts: schedule[key],
        staff_id: staff._id,
        mall_id: staff.mall_id,
        status: ScheduleStatuses.Active
      });
    }
    return schedules;
  },
  // get work_shift of weekday by iso date
  getBaseWorkShifts({ date, object }) {
    const weekDay = new Date(date).getDay();
    const key = Object.keys(DayOfWeek).find((key) => DayOfWeek[key] === weekDay);
    const weekDayShift = object.weekly_work_shifts[key];
    if (!weekDayShift || !weekDayShift.active) {
      return;
    }
    return weekDayShift.work_shifts;
  },
  // check work_shift in mall/company is active
  checkActiveWorkShifts({ key, schedule, weeklyWorkShifts }) {
    if (!weeklyWorkShifts[key] || !weeklyWorkShifts[key].active) {
      throw new BaseError({
        statusCode: 400,
        error: errorCode.client,
        errors: {
          schedule: errorCode['client.inValidSchedule']
        }
      });
    }
    const isValidWorkShifts = this.checkValidWorkShifts({
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
};
