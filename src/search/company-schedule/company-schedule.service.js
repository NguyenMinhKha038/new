import companyScheduleModel from './company-schedule.model';
import extendService from '../../commons/utils/extend-service';
import { mergeObject, BaseError, errorCode } from '../../commons/utils';
import { DayOfWeek, ScheduleStatuses } from './company-schedule.config';
import moment from 'moment';
import workScheduleService from '../sum-mall/work-schedule/work-schedule.service';

export default {
  ...extendService(companyScheduleModel),
  async findEnsure({ select, options = {}, ...query }) {
    const schedule = await companyScheduleModel.findOne(mergeObject({}, query), select, options);
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
  getSchedule({ schedule, permissionGroup, settings }) {
    const weeklyWorkShifts = settings.weekly_work_shifts;
    let schedules = [];
    for (const key in schedule) {
      workScheduleService.checkActiveWorkShifts({ key, schedule, weeklyWorkShifts });
      const date = moment
        .utc()
        .startOf('day')
        .day(7 + (key === 'sunday' ? 7 : DayOfWeek[key]))
        .toDate();
      schedules.push({
        date,
        work_shifts: schedule[key],
        permission_group_id: permissionGroup._id,
        company_id: permissionGroup.company_id,
        status: ScheduleStatuses.Active
      });
    }
    return schedules;
  }
};
