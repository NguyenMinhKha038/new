import { Promise } from 'bluebird';
import moment from 'moment';
import { userService } from '../../commons/user';
import { logger, getDate } from '../../commons/utils';
import notificationService from '../notification/notification.service';
import orderService from '../order/order.service';
import luckyShoppingService from './lucky-shopping.service';
import productService from '../product/product.service';
import { configService } from '../../commons/config';
import fakeUserHandler from '../fake-user/fake-user.handler';
import fakeUserService from '../fake-user/fake-user.service';

export default {
  async init() {
    logger.info('Lucky shopping initializing...');
    const luckyUser = await userService.findOne({ is_lucky: true });
    if (!luckyUser) {
      await userService.create({
        is_lucky: true,
        phone: '+84962000000',
        name: 'Lucky Giver',
        password: 'iamluckygiver',
        verify: true,
        status: 'approve-kyc',
        token: 'MWtS1nGYZajNalBHDYUqfYlwo3lrvI51WlvdaczK',
        point: 0,
        login_type: 'basic'
      });
    }
    this.startCronJobAutoHandling();
    fakeUserHandler.init();
  },
  async startCronJobAutoHandling() {
    const cronJob = require('cron').CronJob;
    logger.info('cronjob auto handling unlucky shopping start!');
    new cronJob({
      cronTime: '30 0 * * *',
      runOnInit: true,
      onTick: async () => {
        try {
          await handlingYesterdayOrder();
          // await handlingNewDay();
        } catch (error) {
          logger.error(error);
        }
      },
      start: true
    });
  }
};

async function handlingYesterdayOrder() {
  const handlingDate = moment().startOf('d').subtract(0, 'day');
  logger.info('auto handling for date %s starting ....', handlingDate.format('DD-MM-YYYY'));
  const luckyShopping = await luckyShoppingService.findOne({
    date: handlingDate.toDate()
  });
  logger.info('luckyShopping %o', luckyShopping);
  if (!luckyShopping || luckyShopping.is_handled) return;
  /** @type {[]} */
  const luckyOrders = luckyShopping.products
    .filter((product) => !!product.winner_id)
    .map((product) => product.order_id.toString());
  const orders = await orderService.find({
    is_lucky: true,
    date: handlingDate.toDate()
  });
  const totalFakeUser = luckyShopping.products.reduce(
    (prev, curt) => prev + curt.number_prizes - curt.number_assignees,
    0
  );
  const unAssignedProducts = luckyShopping.products.filter(
    (product) => product.number_prizes > product.number_assignees
  );
  await Promise.each(unAssignedProducts, async (product) => {
    const fakeUsers = await fakeUserService.find({
      limit: product.number_prizes - product.number_assignees,
      is_used: false
    });
    product.winners.push(
      ...fakeUsers.map((user) => {
        user.is_used = true;
        user.save();
        return {
          winner_name: user.name,
          winner_phone_number: user.phone_number
        };
      })
    );
  });
  logger.info('luckyOrders %o', luckyOrders);
  await Promise.map(
    orders,
    async (order) => {
      if (!luckyOrders.includes(order._id.toString())) {
        order.status = 'company_canceled';
        order.reason_canceled = 'Tự động huỷ do không trúng thưởng.';
        notificationService.createAndSend({
          user_id: order.user_id,
          type: 'user_company_canceled_order',
          title: 'Đơn hàng của bạn đã được huỷ',
          message: `Rất tiếc bạn không phải là người may mắn trong chương trình mua sắm may mắn ngày ${handlingDate.format(
            'DD-MM-YYYY'
          )}`,
          object_id: order.id,
          onModel: 's_order'
        });
        return order.save();
      } else {
        notificationService.createAndSend({
          user_id: order.user_id,
          type: 'user_confirmed_order',
          title: 'Đơn hàng của bạn đã được xác nhận',
          message: `Chúc mừng bạn đã là người thắng cuộc trong chương trình mua sắm may mắn ngày ${handlingDate.format(
            'DD-MM-YYYY'
          )}. Bạn sẽ được liên hệ nhận thưởng trong vòng 24h`,
          object_id: order.id,
          onModel: 's_order'
        });
      }
    },
    { concurrency: 50 }
  );
  luckyShopping.is_handled = true;
  await luckyShopping.save();
}

async function handlingNewDay() {
  const config = await configService.get('lucky_shopping_hours');
  const luckyProducts = await productService.find({
    sale_dates: getDate(),
    is_lucky: true
  });
  const products = luckyProducts.map((product) => {
    product.sale_start_time = getDate().setHours(config.sale_start_hour);
    product.sale_end_time = getDate().setHours(config.sale_end_hour);
    product.save();
    return { product_id: product._id };
  });
  luckyShoppingService.updateByDate({ products });
}
