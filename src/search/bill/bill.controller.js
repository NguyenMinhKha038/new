import { userService } from '../../commons/user';
import { BaseError, BaseResponse, errorCode, transactionHelper } from '../../commons/utils';
import billingGateway from '../billing-gateway';
import statisticService from '../statistic/statistic.service';
import userHistoryService from '../user-history/user-history.service';
import userMoneyFlowService from '../user-money-follow/user-money-flow.service';
import billService from './bill.service';

export default {
  user: {
    async queryBill(req, res, next) {
      try {
        const { type, customer_code, publisher } = req.query;
        const service_code = `BILL_${type}`;
        const { bills } = await billService.checkout({ service_code, customer_code, publisher });
        return new BaseResponse({ statusCode: 200, data: bills }).return(res);
      } catch (error) {
        next(error);
      }
    },
    async payBill(req, res, next) {
      try {
        const { type, customer_code, publisher } = req.body;
        const user = req.user;
        const service_code = `BILL_${type}`;
        const { bills, selectedPublisher } = await billService.checkout({
          service_code,
          customer_code,
          publisher
        });
        if (!bills.billDetail) {
          throw new BaseError({
            statusCode: 400,
            error: errorCode.client,
            errors: { bills: errorCode['client.billIsEmpty'] }
          });
        }
        const { total, payment_fee, original_total } = bills;
        if (user.wallet.total < total)
          throw new BaseError({
            statusCode: 403,
            error: errorCode.client,
            errors: { wallet: errorCode['client.MoneyNotEnough'] }
          });
        const { bonus_available, s_prepaid } = userService.calculateWallet(user, total);
        const mc_request_id = billingGateway.vimo.generateRequestId();
        let data, _user, _bill;
        await transactionHelper.withSession(async (session) => {
          [_user, data] = await Promise.all([
            userService.updateWallet(user._id, {
              'wallet.bonus_available': -bonus_available,
              'wallet.s_prepaid': -s_prepaid,
              'wallet.total': -total
            })(session),
            billService.create(
              {
                user_id: user.id,
                total,
                type,
                publisher,
                publisher_name: selectedPublisher.display_name,
                code: mc_request_id,
                payment_fee,
                original_total,
                bill_payment: bills.billDetail,
                customer_code,
                payment_method: 'WALLET',
                customer_data: bills.customerInfo
              },
              { session }
            )
          ]);
          await Promise.all([
            userHistoryService.create(
              {
                user_id: user._id,
                new_balance: _user.wallet.total,
                onModel: 's_bill',
                value: -total,
                type: 'pay_bill',
                transaction_id: data._id
              },
              { session }
            ),
            userMoneyFlowService.update(
              user._id,
              { total_pay_bill: total, total_loss: total },
              { session }
            )
          ]);
          _bill = await billingGateway.vimo.payBill({
            bill_payment: bills.billDetail,
            customer_code,
            publisher,
            service_code,
            mc_request_id
          });
        });
        billService.update({ _id: data._id }, { external_transaction_id: _bill.transaction_id });
        statisticService.update({ total_pay_bill: total });
        return new BaseResponse({ statusCode: 200, data }).return(res);
      } catch (error) {
        next(error);
      }
    }
  },
  getById: (role) => async (req, res, next) => {
    try {
      const { id } = req.params;
      const user = req.user;
      const query = { _id: id };
      role === 'user' && (query.user_id = user.id);
      const data = await billService.findOne(query);
      return new BaseResponse({ statusCode: 200, data }).return(res);
    } catch (error) {
      next(error);
    }
  },
  get: (role) => async (req, res, next) => {
    try {
      const user = req.user;
      const { limit, page, select, sort, ...query } = req.query;
      role === 'user' && (query.user_id = user.id);
      const [bill, count] = await Promise.all([
        billService.find({
          limit,
          page,
          select,
          sort,
          ...query
        }),
        limit && billService.count({ ...query })
      ]);
      const total_page = limit && Math.ceil(count / limit);
      return new BaseResponse({ statusCode: 200, data: bill })
        .addMeta({ total_page, total: count })
        .return(res);
    } catch (error) {
      next(error);
    }
  }
};
