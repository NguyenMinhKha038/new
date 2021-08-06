import staffCheckInModel from './staff-check-in.model';
import extendService from '../../../commons/utils/extend-service';
import { mergeObject, BaseError, errorCode } from '../../../commons/utils';
import { CheckInStatuses } from './staff-check-in.config';
import { Promise } from 'bluebird';
import { ScheduleStatuses } from '../work-schedule/work-schedule.config';

export default {
  ...extendService(staffCheckInModel),
  async findEnsure({ select, options = {}, ...query }) {
    const staffCheckIn = await staffCheckInModel.findOne(mergeObject({}, query), select, options);
    if (!staffCheckIn) {
      throw new BaseError({
        statusCode: 400,
        error: errorCode.client,
        errors: {
          staff_check_in: errorCode['client.checkInNotExists']
        }
      });
    }
    return staffCheckIn;
  },
  // create check in when schedule is created
  async createCheckIns(schedules, session) {
    const staffCheckIns = [];
    for (const schedule of schedules) {
      for (const workShift of schedule.work_shifts) {
        staffCheckIns.push({
          date: schedule.date,
          mall_id: schedule.mall_id,
          staff_id: schedule.staff_id,
          work_shift: workShift,
          work_schedule_id: schedule._id
        });
      }
    }
    await this.create(staffCheckIns, { session });
  },
  // activate all registration check in
  async activateCheckIns(schedules, session) {
    for (const schedule of schedules) {
      await Promise.map(schedule.work_shifts, async (workShift) => {
        const query = {
          date: schedule.date,
          mall_id: schedule.mall_id,
          staff_id: schedule.staff_id,
          work_shift: workShift
        };
        await this.findOneAndUpdate(
          query,
          { ...query, status: CheckInStatuses.Active, work_schedule_id: schedule._id },
          { new: true, upsert: true, setDefaultsOnInsert: true, session }
        );
      });
    }
  }
};
