import userService from './user.service';
import userMoneyFlowService from '../../search/user-money-follow/user-money-flow.service';
import userHistoryService from '../../search/user-history/user-history.service';
import notificationService from '../../search/notification/notification.service';
import { logger, currencyFormat, transactionHelper } from '../utils';
import statisticService from '../../search/statistic/statistic.service';
import { delay } from 'bluebird';

export default {
  /**
   * @param {{ user: {}, ref_id: string, commission: number, object: {}, type:"topup"|"order", onModel: string, session}} param0
   */
  async handleCommission({ user, ref_id, commission, object = {}, type, onModel, session }) {
    if (!ref_id) return;
    try {
      let history;
      let model;
      switch (type) {
        case 'topup':
          model = 's_topup';
          break;
        case 'order':
          model = 's_order';
          break;
        default:
          break;
      }
      const [refUser] = await Promise.all([
        userService.updateWallet(ref_id, {
          'wallet.total': commission,
          'wallet.bonus_available': commission,
          'wallet.commission': commission
        })(session),
        userMoneyFlowService.update(
          ref_id,
          {
            total_commission: commission,
            total_gain: commission
          },
          { session }
        )
      ]);
      history = await userHistoryService.create(
        {
          user_id: ref_id,
          company_id: object.company_id,
          type: userHistoryService.type.commission,
          transaction_id: object._id,
          value: commission,
          new_balance: refUser.wallet.total,
          refed_id: user._id,
          onModel: onModel || model
        },
        { session }
      );
      statisticService.update({ total_commission: commission });
      if (history)
        notificationService.createAndSend({
          user_id: ref_id,
          type: 'user_receive_commission',
          title: 'Nhận được điểm thưởng',
          message: `Bạn đã nhận được ${currencyFormat(
            commission,
            'vi-VN',
            process.env.APP_CURRENCY
          )} điểm thưởng từ ${user.name}`,
          object_id: history._id,
          onModel: 's_history'
        });
    } catch (error) {
      logger.error('handle commission failed %o', error);
    }
  },
  async handleRefund({ user, refund, object = {}, type, onModel, session }) {
    try {
      let history, fromMessage, model;
      switch (type) {
        case 'order':
          model = 's_order';
          fromMessage = `từ đơn hàng ${object.code}`;
          break;
        case `topup`:
          model = 's_topup';
          fromMessage = `từ việc thanh toán nạp thẻ`;
          break;
        default:
          break;
      }
      const [_user] = await Promise.all([
        userService.updateWallet(user._id, {
          'wallet.refund': refund,
          'wallet.bonus_available': refund,
          'wallet.total': refund
        })(session),
        userMoneyFlowService.update(
          user.id,
          {
            total_refund: refund,
            total_gain: refund
          },
          { session }
        )
      ]);
      history = await userHistoryService.create(
        {
          user_id: user.id,
          company_id: object.company_id,
          type: userHistoryService.type.refund,
          transaction_id: object._id,
          value: refund,
          new_balance: _user.wallet.total,
          onModel: onModel || model
        },
        { session }
      );
      statisticService.update({ total_refund: refund });
      if (history)
        notificationService.createAndSend({
          user_id: user._id,
          type: 'user_receive_refund',
          title: 'Nhận được điểm hoàn',
          message: `Bạn đã nhận được ${currencyFormat(
            refund,
            'vi-VN',
            process.env.APP_CURRENCY
          )} ${fromMessage}`,
          object_id: history._id,
          onModel: 's_history'
        });
    } catch (error) {
      logger.error('handle refund failed %o', error);
    }
  }
};
