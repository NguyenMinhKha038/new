import { logger } from '../../../commons/utils';
import mallStaffService from '../staff/staff.service';
import { MallStaffStatuses } from '../staff/staff.config';
import { DayOfWeek, ScheduleStatuses } from './work-schedule.config';
import { MallStatuses } from '../mall/mall.config';
import workScheduleService from './work-schedule.service';
import staffCheckInService from '../staff-check-in/staff-check-in.service';
import { CheckInStatuses } from '../staff-check-in/staff-check-in.config';
import { Promise } from 'bluebird';
import moment from 'moment';

export const startAddSchedule = async () => {
  const cronJob = require('cron').CronJob;
  logger.info('cronjob add schedule start!');
  new cronJob({
    cronTime: '0 0 * * Mon',
    onTick: async () => {
      try {
        logger.info('Update work_schedule ');
        const mallStaffs = await mallStaffService.find({ status: MallStaffStatuses.Active }, null, {
          populate: [
            {
              path: 'mall',
              match: { status: MallStatuses.Active }
            },
            {
              path: 'user',
              match: { status: { $ne: 'disabled' } }
            }
          ]
        });
        mallStaffs.map(async (staff) => {
          if (!staff.mall || !staff.user) {
            return;
          }
          for (const key in staff.schedule) {
            const addingDay = key === 'sunday' ? 7 : DayOfWeek[key];
            const date = new Date(new Date().getTime() + (addingDay - 1) * 24 * 60 * 60 * 1000);
            const formatDate = moment.utc(date).startOf('day').toDate();
            let schedule;
            schedule = await workScheduleService.findOne({
              staff_id: staff._id,
              mall_id: staff.mall_id,
              date: formatDate,
              status: ScheduleStatuses.Active
            });
            if (!schedule) {
              schedule = await workScheduleService.create({
                staff_id: staff._id,
                mall_id: staff.mall_id,
                date: formatDate,
                work_shifts: staff.schedule[key]
              });
            }
            schedule &&
              (await Promise.map(staff.schedule[key], async (work_shift) => {
                const query = {
                  staff_id: staff._id,
                  mall_id: staff.mall_id,
                  date: formatDate,
                  work_shift,
                  work_schedule_id: schedule._id
                };
                const existedCheckIn = await staffCheckInService.findOne({
                  ...query,
                  status: CheckInStatuses.Active
                });
                if (!existedCheckIn) {
                  await staffCheckInService.create(query);
                }
              }));
          }
        });
      } catch (error) {
        logger.error(error);
      }
    },
    start: true
  });
};

export default { startAddSchedule };
