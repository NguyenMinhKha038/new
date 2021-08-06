/* eslint-disable prettier/prettier */
import companyLimitService from '../company/company-limit.service';
import { logger } from '../../commons/utils';
import promotionService from './promotion.service';
import { Promise } from 'bluebird';
// import { Promise } from 'bluebird';
// import companyService from '../company/company.service';
import globalPromotionService from '../global-promotion/global-promotion.service';
import globalPromotionRegistrationService from '../global-promotion-registration/global-promotion-registration.service';

export const startCheckPromotion = async () => {
  // const companies = await companyService.find({});
  // Promise.map(companies, (company) => companyLimitService.update(company._id));
  const cronJob = require('cron').CronJob;
  logger.info('cronjob update promotion start!');
  new cronJob({
    cronTime: '*/1 * * * *',
    onTick: async () => {
      try {
        const handlingTime = new Date(new Date().setMilliseconds(0));
        console.log("now",new Date())
        logger.info('Update company by promotion changes %s', handlingTime);
        updateForPromotion(handlingTime);
        updateForGlobalPromotion(handlingTime);
        checkApplyStatusPromotion(handlingTime);
        checkApplyStatusGlobalPromotion(handlingTime);
      } catch (error) {
        logger.error(error);
        console.log(error);
      }
    },
    start: true
  });
};

async function updateForPromotion(handlingTime) {
  try {
    //* update when promotion will expire
    const expiringPromotions = await promotionService.find({
      query: {
        expire_at: {
          $lte: new Date(+handlingTime + 10 * 60 * 1000),
          $gte: handlingTime
        },
        status: 'active',
        start_at: { $lte: handlingTime }
      }
    });
    logger.info('number of expiringPromotions %d', expiringPromotions.length);
    expiringPromotions.forEach((promotion) => {
      setTimeout(async () => {
        await companyLimitService.update(promotion.company_id);
        await promotionService.updateById(promotion._id, { apply_status: false }); //update apply_status
      }, new Date(promotion.expire_at) - handlingTime + 1000);
    });
    //* update when promotion will start
    const startingPromotions = await promotionService.find({
      query: {
        start_at: {
          $gte: handlingTime,
          $lte: new Date(+handlingTime + 10 * 60 * 1000)
        },
        status: 'active'
      }
    });
    logger.info('number of startingPromotions %d', startingPromotions.length);
    startingPromotions.forEach((promotion) => {
      setTimeout(async () => {
        await promotionService.sendNotification(promotion);
        await companyLimitService.update(promotion.company_id);
        await promotionService.updateById(promotion._id, { apply_status: true });
      }, new Date(promotion.start_at) - handlingTime + 1000);
    });
  } catch (error) {
    logger.error(error);
    throw error;
  }
}
async function updateForGlobalPromotion(handlingTime) {
  try {
    //* update when global promotion expire
    const expiringGlobalPromotionRegistrations = await globalPromotionRegistrationService.find({
      query: {
        start_at: {
          $lte: handlingTime
        },
        status: 'active',
        expire_at: {
          $lte: new Date(+handlingTime + 10 * 60 * 1000),
          $gte: handlingTime
        },
        global_promotion_status: 'active'
      },
      options: {
        populate: 'global_promotion'
      }
    });
    logger.info(
      'number of expiringGlobalPromotion %d',
      expiringGlobalPromotionRegistrations.length
    );
    expiringGlobalPromotionRegistrations.forEach((globalPromotionRegistration) => {
      setTimeout(async () => {
        await companyLimitService.update(globalPromotionRegistration.company_id);
        await globalPromotionService.updateById(globalPromotionRegistration.global_promotion._id, {
          apply_status: false
        });
      }, new Date(globalPromotionRegistration.expire_at) - handlingTime + 1000);
    });

    //* update when global promotion start
    const startingGlobalPromotionRegistrations = await globalPromotionRegistrationService.find({
      query: {
        start_at: {
          $gte: handlingTime,
          $lte: new Date(+handlingTime + 10 * 60 * 1000)
        },
        status: 'active',
        global_promotion_status: 'active'
      },
      options: { populate: { path: 'global_promotion' } }
    });
    logger.info('number of startGlobalPromotion %d', startingGlobalPromotionRegistrations.length);
    startingGlobalPromotionRegistrations.forEach(async (globalPromotionRegistration) => {
      setTimeout(async () => {
        await companyLimitService.update(globalPromotionRegistration.company_id);
        await globalPromotionService.updateById(globalPromotionRegistration.global_promotion._id, {
          apply_status: true
        });
      }, new Date(globalPromotionRegistration.start_at) - handlingTime + 1000);
    });
  } catch (err) {
    logger.error(err);
    throw err;
  }
}

async function checkApplyStatusPromotion(handlingTime) {
  try {
    const startingPromotions = await promotionService.find({
      query: {
        status: 'active',
        start_at: {
          $gte: new Date(+handlingTime - 100 * 60 * 1000),
          $lte: new Date(+handlingTime)
        },
        expire_at: { $gte: new Date(+handlingTime) },
        apply_status: false
      }
    });
    const expiringPromotions = await promotionService.find({
      query: {
        expire_at: {
          $gte: new Date(+handlingTime - 100 * 60 * 1000),
          $lte: new Date(+handlingTime)
        },
        apply_status: true
      }
    });
    await Promise.all([
      await Promise.map(startingPromotions, async (promotion) => {
        await promotionService.updateById(promotion._id, { apply_status: true });
        await companyLimitService.update(promotion.company_id);
      }),
      await Promise.map(expiringPromotions, async (promotion) => {
        await promotionService.updateById(promotion._id, { apply_status: false });
        await companyLimitService.update(promotion.company_id);
      })
    ]);
  } catch (error) {
    logger.error(error);
  }
}
async function checkApplyStatusGlobalPromotion(handlingTime) {
  try {
    const startingPromotionRegistrations = await globalPromotionRegistrationService.find({
      query: {
        status: 'active',
        start_at: {
          $gte: new Date(+handlingTime - 100 * 60 * 1000),
          $lte: new Date(+handlingTime)
        },
        expire_at: { $gte: new Date(+handlingTime) },
        global_promotion_status: 'active'
      },
      options: {
        populate: { path: 'global_promotion', match: { apply_status: false } }
      }
    });
    const expiringPromotionRegistrations = await globalPromotionRegistrationService.find({
      query: {
        expire_at: {
          $gte: new Date(+handlingTime - 100 * 60 * 1000),
          $lte: new Date(+handlingTime)
        }
      },
      options: {
        populate: { path: 'global_promotion', match: { apply_status: true } }
      }
    });
    await Promise.all([
      await Promise.map(startingPromotionRegistrations, async (registration) => {
        if (registration.global_promotion) {
          await globalPromotionService.updateById(registration.global_promotion._id, {
            apply_status: true
          });
          await companyLimitService.update(registration.company_id);
        }
      }),
      await Promise.map(expiringPromotionRegistrations, async (registration) => {
        if (registration.global_promotion) {
          await globalPromotionService.updateById(registration.global_promotion._id, {
            apply_status: false
          });
          await companyLimitService.update(registration.company_id);
        }
      })
    ]);
  } catch (error) {
    logger.error(error);
  }
}
export default { startCheckPromotion };
