import { Router } from 'express';
import { mallRouter } from './mall/mall.router';
import { mallStaffRouter } from './staff/staff.router';
import { mallStoringRouter } from './mall-storing/mall-storing.router';
import { staffCheckInRouter } from './staff-check-in/staff-check-in.router';
import { mallStaffStatisticRouter } from './staff-statistic/staff-statistic.router';
import { workScheduleRouter } from './work-schedule/work-schedule.router';
import { mallActivityRouter } from './mall-activity/mall-activity.router';
const router = Router();

router.use('/mall', mallRouter);
router.use('/mall-storing', mallStoringRouter);
router.use('/staff', mallStaffRouter);
router.use('/staff-check-in', staffCheckInRouter);
router.use('/mall-staff-statistic', mallStaffStatisticRouter);
router.use('/work-schedule', workScheduleRouter);
router.use('/mall-activity', mallActivityRouter);

export { router as summallRouter };
