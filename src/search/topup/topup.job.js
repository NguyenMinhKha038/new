import { Promise } from 'bluebird';
import { logger, getDate, withSession } from '../../commons/utils';
import topupHandler from './topup.handler';
import topupService from './topup.service';

const startTopupComboJob = async function () {
  const cronJob = require('cron').CronJob;
  logger.info('cronjob topup combo start!');
  new cronJob({
    cronTime: '31 0 * * *',
    // runOnInit: true,
    onTick: async () => {
      try {
        logger.info('handle topup combo for date %s', getDate());
        const combos = await topupService.combo.find({
          next_date: getDate(),
          status: 'handling'
        });
        logger.info('total %d combo will be handled', combos.length);
        await Promise.each(combos, async (combo) => {
          try {
            const topupCount = await topupService.topup.count({
              combo_id: combo._id,
              status: 'success'
            });
            if (topupCount >= combo.months) {
              combo.status = 'completed';
              combo.remain_months = 0;
              return await combo.save();
            }
            return withSession((session) => {
              return topupHandler.combo.handleTopUp({ combo }, { session });
            });
          } catch (error) {
            logger.error(error);
          }
        });
        logger.info('done topup combo');
      } catch (err) {
        logger.error('Handle topup combo error %o', err);
      }
    },
    start: true
  });
};

export default { startTopupComboJob };
