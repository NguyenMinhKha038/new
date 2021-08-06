import configService from '../../commons/config/config.service';
import companyHistoryService from '../company-history/company-history.service';
import companyService from '../company/company.service';
import companyMoneyFlowService from '../money-flow/company-money-flow.service';
import notificationService from '../notification/notification.service';
import productStoringService from '../product-storing/product-storing.service';
import productService from '../product/product.service';
import revenueService from '../revenue/revenue.service';
import logisticsService from './logistics.service';
import { currencyFormat, transactionHelper } from '../../commons/utils';
import orderService from '../order/order.service';
import companyHistoryModel from '../company-history/company-history.model';

export default {
  /**
   *
   *
   * @param {{order: SOrder, fee: number}}
   */
  async handleDelivery({ order, fee }) {
    //* diff of real transport fee and calculated
    let _fee = 0,
      company_transport_fee = 0,
      additional_transport_fee = 0;
    let _company;
    const [companyLimit, company] = await Promise.all([
      configService.get('company_limit'),
      companyService.findOne({ _id: order.company_id })
    ]);

    const balanceLimit = companyLimit.find((v) => v.level === company.level);
    const maxNegativeWallet = balanceLimit ? balanceLimit.negative_balance : 0;
    await transactionHelper.withSession(async (session) => {
      order = await orderService.findOne({ _id: order._id }, null, { session });
      company_transport_fee = order.calculated_transport_fee - order.transport_fee;
      additional_transport_fee =
        fee - order.calculated_transport_fee - (order.additional_transport_fee || 0);
      console.log({ company_transport_fee, additional_transport_fee });
      console.log(order.actual_transport_fee === fee);
      if (order.actual_transport_fee === fee) return;
      if (company_transport_fee && !order.is_company_paid_transport_fee) {
        _fee += company_transport_fee;
        [_company] = await Promise.all([
          companyService.updateWallet(
            { _id: order.company_id },
            { wallet: -company_transport_fee, maxNegativeWallet: -maxNegativeWallet }
          )(session),
          companyMoneyFlowService.update(
            order.company_id,
            {
              total_transport_fee: company_transport_fee,
              total_loss: company_transport_fee
            },
            { session }
          )
        ]);
        await companyHistoryService.create(
          {
            company_id: order.company_id,
            new_balance: _company.wallet,
            onModel: 's_order',
            transaction_id: order._id,
            type: 'pay_transport_fee',
            value: company_transport_fee
          },
          { session }
        );
        order.is_company_paid_transport_fee = true;
      }
      if (additional_transport_fee > 0) {
        _fee += additional_transport_fee;
        [_company] = await Promise.all([
          companyService.updateWallet(
            { _id: order.company_id },
            { wallet: -additional_transport_fee, maxNegativeWallet: -maxNegativeWallet }
          )(session),
          companyMoneyFlowService.update(
            order.company_id,
            {
              total_transport_fee: additional_transport_fee,
              total_loss: additional_transport_fee
            },
            { session }
          )
        ]);
        await companyHistoryModel.findOneAndUpdate(
          { company_id: order.company_id, transaction_id: order._id, type: 'pay_transport_fee' },
          {
            new_balance: _company.wallet,
            $inc: {
              value: additional_transport_fee
            }
          },
          { session, upsert: true }
        );
      }
      order.actual_transport_fee = fee;
      order.company_transport_fee = company_transport_fee;
      order.additional_transport_fee = fee - order.calculated_transport_fee;
      await order.save();
    });
    companyService.checkUpdateLimit(_company);
    revenueService.update(
      { company_id: order.company_id, store_id: order.store_id },
      {
        total_transport_fee: _fee
      }
    );
    _fee > 0 &&
      notificationService.createAndSend({
        company_id: order.company_id,
        message: `Thanh toán phí vận chuyển cho đơn hàng ${
          order.code
        } với số tiền là ${currencyFormat(_fee, 'vi-VN')}`,
        title: 'Thanh toán phí vận chuyển',
        object_id: order._id,
        onModel: 's_order',
        type: 'company_pay_transport_fee',
        user_id: company.user_id
      });
  },
  /**
   *
   *
   * @param {{order: SOrder, fee: number}}
   */
  async handleReturn({ order, fee }) {
    let _company;
    const return_fee = fee;
    const [companyLimit, company] = await Promise.all([
      configService.get('company_limit'),
      companyService.findOne({ _id: order.company_id })
    ]);

    const balanceLimit = companyLimit.find((v) => v.level === company.level);
    const maxNegativeWallet = balanceLimit ? balanceLimit.negative_balance : 0;
    await transactionHelper.withSession(async (session) => {
      order = await orderService.findOne({ _id: order._id }, null, { session });
      if (order.is_company_paid_return_fee) return;
      [_company] = await Promise.all([
        companyService.updateWallet(
          { _id: order.company_id },
          { wallet: -return_fee, maxNegativeWallet: -maxNegativeWallet }
        )(session),
        companyMoneyFlowService.update(
          order.company_id,
          {
            total_transport_fee: return_fee,
            total_loss: return_fee
          },
          { session }
        )
      ]);
      await companyHistoryService.create(
        {
          company_id: order.company_id,
          new_balance: _company.wallet,
          onModel: 's_order',
          transaction_id: order._id,
          type: 'pay_transport_fee',
          value: return_fee
        },
        { session }
      );
      order.return_transport_fee = return_fee;
      order.is_company_paid_return_fee = true;
      await order.save();
    });
    companyService.checkUpdateLimit(_company);
    revenueService.update(
      { company_id: order.company_id, store_id: order.store_id },
      {
        total_transport_fee: return_fee
      }
    );
    notificationService.createAndSend({
      company_id: order.company_id,
      message: `Thanh toán phí vận chuyển phát sinh do trả hàng cho đơn hàng ${
        order.code
      } với số tiền là ${currencyFormat(return_fee, 'vi-VN')}`,
      title: 'Thanh toán phí vận chuyển',
      object_id: order._id,
      onModel: 's_order',
      type: 'company_pay_transport_fee',
      user_id: company.user_id
    });
  },
  async switch(company_id, state) {
    const providers = await configService.get('logistics_providers');
    if (state === false) {
      productService.updateMany({ company_id }, { transportable: false });
      productStoringService.updateMany({ company_id }, { transportable: false });
    }
    providers.forEach((provider, i) => {
      logisticsService.updateOne(
        { company_id, provider: provider.provider },
        { status: state ? 'active' : 'disabled', is_default: !!state && i === 0 },
        { upsert: true, setDefaultsOnInsert: true }
      );
    });
  }
};
