import moment from 'moment';
import configService from '../../commons/config/config.service';
import { userService } from '../../commons/user';
import walletHandler from '../../commons/user/wallet.handler';
import { BaseError, BaseResponse, errorCode, transactionHelper } from '../../commons/utils';
import statisticService from '../statistic/statistic.service';
import userHistoryService from '../user-history/user-history.service';
import userMoneyFlowService from '../user-money-follow/user-money-flow.service';
import topupHandler from './topup.handler';
import topupService from './topup.service';
import roundNumber from '../../commons/utils/round-number';

export default {
  user: {
    async checkout(req, res, next) {
      try {
        let { publisher, amount, combo, type } = req.body;
        const topUpConfig = await configService.get('topup');
        const isActiveAmount = topUpConfig.amounts.find((item) => item.amounts === amount)
          .is_active;
        const isActiveAmountPublisher = topUpConfig.amounts.find((item) => item.amounts === amount)
          .publishers_status[publisher];
        if (!isActiveAmount || !isActiveAmountPublisher) {
          throw new BaseError({
            statusCode: 400,
            error: errorCode.client,
            errors: {
              publishers_status: errorCode['client.publisherIsInactive']
            }
          });
        }
        let total = 0,
          months;
        if (combo !== 'basic') {
          const selectedCombo = topUpConfig.combos.find((_combo) => _combo.name === combo);
          total = selectedCombo.months * amount;
          months = selectedCombo.months;
        } else {
          total = amount;
        }
        const refund_rate = topUpConfig.refund_rate[type][combo][publisher][amount];
        const true_refund_rate = roundNumber((refund_rate * 9) / 10, 4);
        const refund = roundNumber(refund_rate * total);
        const true_refund = roundNumber(true_refund_rate * total);
        const commission = roundNumber(refund - true_refund);
        return new BaseResponse({
          statusCode: 200,
          data: { total, refund, refund_rate, true_refund, true_refund_rate }
        }).return(res);
      } catch (error) {
        next(error);
      }
    },
    async pay(req, res, next) {
      try {
        let { publisher, amount, combo, receiver, type } = req.body;
        const user = req.user;
        const topUpConfig = await configService.get('topup');
        const isActiveAmount = topUpConfig.amounts.find((item) => item.amounts === amount)
          .is_active;
        const isActiveAmountPublisher = topUpConfig.amounts.find((item) => item.amounts === amount)
          .publishers_status[publisher];
        if (!isActiveAmount || !isActiveAmountPublisher) {
          throw new BaseError({
            statusCode: 400,
            error: errorCode.client,
            errors: {
              publishers_status: errorCode['client.amountIsInactive']
            }
          });
        }
        const topupType = combo !== 'basic' ? 'combo' : 'topup';
        let total = 0,
          months;
        if (combo !== 'basic') {
          const selectedCombo = topUpConfig.combos.find((_combo) => _combo.name === combo);
          total = selectedCombo.months * amount;
          months = selectedCombo.months;
        } else {
          total = amount;
        }
        const refund_rate = topUpConfig.refund_rate[type][combo][publisher][amount];
        const true_refund_rate = roundNumber((refund_rate * 9) / 10, 4);
        const refund = roundNumber(refund_rate * total);
        const true_refund = roundNumber(true_refund_rate * total);
        const commission = roundNumber(refund - true_refund);
        if (user.wallet.total < total)
          throw new BaseError({
            statusCode: 403,
            error: errorCode.client,
            errors: { money: errorCode['client.MoneyNotEnough'] }
          });
        const { bonus_available, s_prepaid } = userService.calculateWallet(user, total);
        let data, _user;
        await transactionHelper.withSession(async (session) => {
          [_user, data] = await Promise.all([
            userService.updateWallet(user._id, {
              'wallet.s_prepaid': -s_prepaid,
              'wallet.bonus_available': -bonus_available,
              'wallet.total': -total
            })(session),
            topupService[topupType].create(
              {
                amount,
                publisher,
                status: 'pending',
                type,
                total: amount * (months || 1),
                user_id: user._id,
                ...(topupType === 'combo'
                  ? {
                      combo,
                      months,
                      remain_months: months,
                      next_date: moment().startOf('d').add(30, 'd').toDate()
                    }
                  : {}),
                receiver,
                refund_rate,
                total_refund: refund
              },
              { session }
            )
          ]);
          /*start*/
          await Promise.all([
            userHistoryService.create(
              {
                new_balance: _user.wallet.total,
                onModel: topupType === 'combo' ? 's_topup_combo' : 's_topup',
                transaction_id: data._id,
                type: 'pay_topup',
                user_id: user._id,
                value: total
              },
              { session }
            ),
            userMoneyFlowService.update(
              user._id,
              { total_pay_topup: total, total_loss: total },
              { session }
            )
          ]);
          await topupHandler[topupType].handleTopUp({ [topupType]: data }, { session });
          await Promise.all([
            walletHandler.handleRefund({
              user,
              refund: true_refund,
              object: data,
              type: 'topup',
              onModel: topupType === 'combo' ? 's_topup_combo' : 's_topup',
              session: session
            })
          ]),
            walletHandler.handleCommission({
              user,
              ref_id: user.ref_id,
              commission,
              object: data,
              type: 'topup',
              onModel: topupType === 'combo' ? 's_topup_combo' : 's_topup',
              session: session
            });
        });
        statisticService.update({
          total_pay_topup: total,
          total_pay_topup_combo: topupType === 'combo' ? total : 0
        });
        /*end*/

        return new BaseResponse({ statusCode: 200, data }).return(res);
      } catch (error) {
        next(error);
      }
    }
  },
  admin: {
    manualPay: async (req, res, next) => {
      const { id } = req.params;
      const combo = await topupService.combo.findOne({ _id: id });
      await topupHandler.combo.handleTopUp(combo);
      return new BaseResponse({ statusCode: 200, data: combo }).return(res);
    }
  },

  /**
   *
   *
   * @param {'user'|'admin'} role
   * @param {'topup'|'combo'} type
   * @returns
   */
  get: (role, type) => async (req, res, next) => {
    try {
      const user = req.user;
      const { limit, page, select, sort, start_time, end_time, populate, ...query } = req.query;
      role === 'user' && (query.user_id = user.id);
      if (start_time || end_time) {
        query.createdAt = { $gt: start_time, $lt: end_time };
      }
      const [bill, count] = await Promise.all([
        topupService[type].find({
          limit,
          page,
          select,
          sort,
          populate,
          ...query
        }),
        limit && topupService[type].count({ ...query })
      ]);
      const total_page = limit && Math.ceil(count / limit);
      return new BaseResponse({ statusCode: 200, data: bill })
        .addMeta({ total_page, total: count })
        .return(res);
    } catch (error) {
      next(error);
    }
  },
  /**
   *
   *
   * @param {'user'|'admin'} role
   * @param {'topup'|'combo'} type
   * @returns
   */
  getById: (role, type) => async (req, res, next) => {
    try {
      const { id } = req.params;
      const { populate } = req.query;
      const user = req.user;
      const query = { _id: id };
      role === 'user' && (query.user_id = user.id);
      const data = await topupService[type].findOne(query, null, { populate });
      return new BaseResponse({ statusCode: 200, data }).return(res);
    } catch (error) {
      next(error);
    }
  }
};
