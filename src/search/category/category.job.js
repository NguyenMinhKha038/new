import { Promise } from 'bluebird';
import { logger, getDate } from '../../commons/utils';
import categoryService from './category.service';
import productService from '../product/product.service';

const startCheckCategoryHasProductJob = async function () {
  const cronJob = require('cron').CronJob;
  logger.info('cronjob category has product start!');
  new cronJob({
    cronTime: '*/5 * * * *',
    runOnInit: true,
    onTick: async () => {
      try {
        const categories = await categoryService.find({
          type: [1, 2],
          has_product: { $ne: true }
        });

        for (let i = 0; i < categories.length; i++) {
          try {
            const product = await productService.findOne({
              status: 'approved',
              is_active_company: true,
              type_category_id: categories[i].type_category_id,
              ...(categories[i].type === 2
                ? {
                    company_category_id: categories[i].company_category_id
                  }
                : {})
            });
            if (product) {
              console.log(categories[i].name, product.name);
              categories[i].has_product = true;
              await categories[i].save();
            } else {
              // logger.info('category %s has no product', categories[i].name);
            }
          } catch (err) {}
        }
      } catch (err) {
        logger.error('Check category has products or not error %o', err);
      }
    },
    start: true
  });
};

export default { startCheckCategoryHasProductJob };
