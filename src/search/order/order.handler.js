import { Promise } from 'bluebird';
import { userService } from '../../commons/user';
import userModel from '../../commons/user/user.model';
import walletHandler from '../../commons/user/wallet.handler';
import { logger, transactionHelper, BaseError, errorCode } from '../../commons/utils';
import companyHistoryService from '../company-history/company-history.service';
import companyService from '../company/company.service';
import companyMoneyFlowService from '../money-flow/company-money-flow.service';
import productStoringHandler from '../product-storing/product-storing.handler';
import productStoringHandlerV2 from '../product-storing/v2/product-storing.handler';
import productStoringService from '../product-storing/product-storing.service';
import productStoringServiceV2 from '../product-storing/v2/product-storing.service';
import { Types as HistoryTypes } from '../product-stock-history/v2/product-stock-history.config';
import productService from '../product/product.service';
import revenueService from '../revenue/revenue.service';
import storeService from '../store/store.service';
import userHistoryService from '../user-history/user-history.service';
import userMoneyFlowService from '../user-money-follow/user-money-flow.service';
import { OrderFinalStatuses, CanceledReasons, RejectedReasons } from './order.config';
import orderModel from './order.model';
import orderService from './order.service';
import companyModel from '../company/company.model';
import paymentTransactionService from '../payment_transactions/payment-transaction.service';
import _ from 'lodash';
import baseLogistics from '../logistics/provider/base-logistics';
import logisticsHandler from '../logistics/logistics.handler';
import { configService } from '../../commons/config';
import categoryService from '../category/category.service';
import { promotionCodeServiceV2 } from '../promotion-code/v2/promotion-code.service';
import behaviorService from '../behavior/behavior.service';
import { Types as BehaviorTypes } from '../behavior/behavior.config';
import buyerService from '../buyer/buyer.service';
import promotionService from '../promotion/promotion.service';
const ShoppingTypes = BehaviorTypes.Shopping;

export default {
  async handleComplete(
    { order, user, pay_required, pay_by_s_prepaid, updates = {}, user_type },
    options
  ) {
    const { session } = options;
    let _user, _company;
    const commission = order.total_refund / 10;
    const refund = order.total_refund - commission;
    // await transactionHelper.withSession(async (session) => {
    // });
    [order, user] = await Promise.all([
      orderModel.findOne({ _id: order._id }, null, { session }),
      user.is_buyer
        ? buyerService.findOne({ _id: user._id })
        : userModel.findOne({ _id: user._id }, null, { session })
    ]);
    logger.info('handelComplete %o', { order, user, pay_required, pay_by_s_prepaid });
    if (OrderFinalStatuses.includes(order.status)) return;
    Object.assign(order, updates);
    const payToCompany =
      pay_by_s_prepaid || (order.type === 'online' && !order.is_received_at_store);
    if (pay_required) {
      const { bonus_available, s_prepaid } = userService.calculateWallet(user, order.total);
      [_user, _company] = await transactionHelper.mapTransaction(
        userService.updateWallet(user._id, {
          'wallet.total': -order.total,
          'wallet.s_prepaid': -s_prepaid,
          'wallet.bonus_available': -bonus_available
        }),
        companyService.updateWallet(
          { _id: order.company_id },
          { wallet: order.total, refund_fund: -order.total_refund }
        )
      )(session);

      await Promise.all([
        userHistoryService.create(
          {
            user_id: user.id,
            company_id: order.company_id,
            type: userHistoryService.type.pay_order,
            transaction_id: order._id,
            value: -order.total,
            new_balance: _user.wallet.total
          },
          { session }
        ),
        userMoneyFlowService.update(
          user.id,
          {
            total_pay: order.total,
            total_loss: order.total
          },
          { session }
        ),
        companyMoneyFlowService.update(
          order.company_id,
          {
            total_refund: order.total_refund,
            total_loss: order.total_refund,
            total_pay: order.total,
            total_gain: order.total
          },
          { session }
        )
      ]);
    } else {
      //* By CASH Or Paid
      //* refund

      [_company] = await transactionHelper.mapTransaction(
        companyService.updateWallet(
          { _id: order.company_id },
          {
            refund_fund: -order.total_refund,
            ...(payToCompany ? { wallet: order.total } : {})
          }
        ),
        (session) =>
          companyMoneyFlowService.update(
            order.company_id,
            {
              total_refund: order.total_refund,
              total_loss: order.total_refund,
              ...(payToCompany ? { total_pay: order.total, total_gain: order.total } : {})
            },
            { session }
          )
      )(session);
    }
    //* handling bonus
    await Promise.all([
      payToCompany &&
        (await companyHistoryService.create(
          {
            user_id: user.id,
            company_id: order.company_id,
            type: companyHistoryService.type.user_pay_order,
            transaction_id: order._id,
            value: order.total,
            new_balance: _company.wallet
          },
          { session }
        )),
      user_type === 'user' &&
        walletHandler.handleRefund({
          user,
          refund,
          object: order,
          type: 'order',
          session,
          user_type
        }),
      user_type === 'user' &&
        walletHandler.handleCommission({
          user,
          commission,
          ref_id: user.ref_id,
          object: order,
          type: 'order',
          session
        }),
      order.save()
    ]);
    await this.handleServiceFee({ order, user_type }, { session });
    //* revenue
    revenueService.update(
      {
        company_id: order.company_id,
        store_id: order.store_id
      },
      {
        total: order.total,
        total_pay: pay_by_s_prepaid ? order.total : 0,
        total_buyer: 1,
        total_discount: order.total_discount,
        total_refund: order.total_refund,
        total_transport_fee: order.actual_transport_fee || order.transport_fee || 0,
        total_service_fee: order.total_service_fee || 0
      }
    );
    order.products.forEach((product) => {
      revenueService.updateByCategory(
        {
          company_id: order.company_id,
          company_category_id: product.company_category_id,
          type_category_id: product.type_category_id,
          sub_category_id: product.sub_category_id
        },
        { total: order.total, total_pay: pay_by_s_prepaid ? order.total : 0 }
      );
      product.promotion_id &&
        promotionService.updateStatistic(
          product.promotion_id,
          product.total_discount,
          product.total_refund,
          product.total,
          product.applied_promotion_quantity
        );
    });
    //* update Sold
    if (!order.without_product)
      order.products.forEach((product) => {
        productStoringService.update({ _id: product._id }, { $inc: { sold: product.quantity } });
        productService.changeCount(product.id, { sold_count: product.quantity });
        productStoringServiceV2.updateSoldCount({
          productStoringId: product.product_storing_id,
          modelId: product.model_id,
          quantity: product.quantity
        });
      });
    //* checkUpdate
    companyService.changeCount(order.company_id, {
      total_revenue: order.total,
      total_pay: pay_by_s_prepaid ? order.total : 0,
      total_discount: order.total_discount,
      total_refund: order.total_refund
    });
    storeService.changeCount(order.store_id, {
      total_revenue: order.total,
      total_pay: pay_by_s_prepaid ? order.total : 0,
      total_discount: order.total_discount,
      total_refund: order.total_refund
    });
    companyService.checkUpdateLimit(_company);
    // TODO markUsed global promotion
    const promotionCodeIds = order.products.reduce(
      (prev, curt) => (curt.promotion_code_id ? [...prev, curt.promotion_code_id] : prev),
      []
    );
    promotionCodeServiceV2.markUsed(promotionCodeIds);

    // Create user behavior --
    if (order.type === 'offline' && user_type === 'user')
      storeService.findOne({ _id: order.store_id }).then((store) => {
        const _location = store.location;
        let latitude = undefined;
        let longitude = undefined;
        if (_location && _location.type === 'Point' && Array.isArray(_location.coordinates)) {
          [longitude, latitude] = _location.coordinates;
        }
        const dataToCreate = order.products.map((product) => ({
          user_id: order.user_id,
          type: ShoppingTypes.Buy_Offline,
          type_category_id: product.type_category_id,
          company_category_id: product.company_category_id,
          sub_category_id: product.sub_category_id,
          company_id: order.company_id,
          store_id: store._id,
          product_id: product.id,
          order_id: order._id,
          location: { ...store.address, latitude, longitude }
        }));
        behaviorService.createMultiShoppingBehavior(dataToCreate);
      });
  },
  async handleCancel({ order, user, staff, updates }, options) {
    const { session } = options;
    let _user, _company;
    // await transactionHelper.withSession(async (session) => {
    // });

    order = await orderModel.findOne({ _id: order._id }, null, { session });
    logger.info('handleCancel %o', { order, user });
    if (OrderFinalStatuses.includes(order.status)) return;
    Object.assign(order, updates);
    const commission = order.total_refund / 10;
    const refund = order.total_refund - commission;
    const isRestoreRefund =
      (order.type === 'online' && order.is_confirmed) || order.type === 'offline';
    if (order.is_paid) {
      [_user, _company] = await transactionHelper.mapTransaction(
        userService.updateWallet(order.user_id, {
          'wallet.total': order.total,
          'wallet.bonus_available': order.total
        }),
        isRestoreRefund &&
          companyService.updateWallet(
            { _id: order.company_id },
            {
              refund_fund: -order.total_refund,
              wallet: order.total_refund
            }
          ),
        (session) =>
          userMoneyFlowService.update(
            order.user_id,
            {
              total_pay_back: order.total,
              total_gain: order.total
            },
            { session }
          )
      )(session);
    } else {
      [_company] = await transactionHelper.mapTransaction(
        isRestoreRefund &&
          companyService.updateWallet(
            { _id: order.company_id },
            {
              refund_fund: -order.total_refund,
              wallet: order.total_refund
            }
          )
      )(session);
    }

    //* user history and save order
    await Promise.all([
      order.is_paid &&
        userHistoryService.create(
          {
            user_id: user.id,
            company_id: order.company_id,
            onModel: 's_order',
            transaction_id: order.id,
            type: userHistoryService.type.return_canceled_order,
            value: -order.total,
            new_balance: _user.wallet.total
          },
          { session }
        ),
      order.save({ session })
    ]);
    companyService.checkUpdateLimit(_company);

    await Promise.mapSeries(order.products, async (product) => {
      // TODO: * not update stock if lost/damage
      //* update stock
      // productStoringHandler.updateStock({
      //   fromId: product._id,
      //   fromDeltaQuantity: product.quantity,
      //   performedUser: { _id: staff ? staff.id : user.id },
      //   user: { _id: order.user_id },
      //   type: 'refund'
      // });
      await Promise.all([
        productStoringHandlerV2.updateStockAndCreateHistory(
          {
            productStoringId: product._id,
            stock: product.quantity,
            model_stock: { stock: product.quantity, model_id: product.model_id },
            accompanied_stock: {
              accompanied_products: product.accompanied_products,
              action: 'remove_product'
            }
          },
          {
            type: HistoryTypes.Refund,
            transactionId: order._id,
            onModel: 's_order',
            performedUser: user || staff
          },
          { session }
        ),
        // Restore promotion_code

        product.promotion_code_id &&
          promotionCodeServiceV2.autoGetV2(
            {
              company_id: product.company_id,
              store_id: product.store_id,
              product_id: product.id,
              apply_count: 0,
              promotion_code_id: product.promotion_code_id,
              model_id: product.model_id
            },
            { session }
          )
      ]);
    });

    // Create user behavior --
    if (user)
      storeService.findOne({ _id: order.store_id }).then((store) => {
        const _location = store.location;
        let latitude = undefined;
        let longitude = undefined;
        if (_location && _location.type === 'Point' && Array.isArray(_location.coordinates)) {
          [longitude, latitude] = _location.coordinates;
        }
        const dataToCreate = order.products.map((product) => ({
          user_id: order.user_id,
          type: ShoppingTypes.Cancel_Order,
          reason_canceled: updates.reason_canceled,
          reason_rejected: updates.reason_rejected,
          type_category_id: product.type_category_id,
          company_category_id: product.company_category_id,
          sub_category_id: product.sub_category_id,
          company_id: order.company_id,
          store_id: store._id,
          product_id: product.id,
          order_id: order._id,
          location: { ...store.address, latitude, longitude }
        }));
        behaviorService.createMultiShoppingBehavior(dataToCreate);
      });
    return order;
  },
  /**
   *
   *
   * @param {{order: SOrder}} params
   * @returns {Promise<SOrder>}
   */
  async handleTransportFee({ order }) {
    if (order.type === 'offline') return;
    if (order.is_received_at_store) return;
    const orderFee = await baseLogistics[order.logistics_provider].getOrderFee(order);
    switch (order.logistics_provider) {
      case 'ghn': {
        const transportFee = orderFee.detail.main_service;
        const returnFee = orderFee.detail.return;
        if (transportFee !== order.actual_transport_fee) {
          await logisticsHandler.handleDelivery({ order, fee: transportFee });
        }
        if (returnFee && order.is_company_paid_return_fee) {
          await logisticsHandler.handleReturn({ order, fee: returnFee });
        }
        break;
      }

      default:
        break;
    }
  },
  async handleServiceFee({ order, user_type }, options) {
    const { session } = options;
    let [companyLimit, company] = await Promise.all([
      configService.get('company_limit'),
      companyService.findOne({ _id: order.company_id })
    ]);
    const companyCategory = await categoryService.findOne({ _id: company.category_id });
    const balanceLimit = companyLimit.find((v) => v.level === company.level);
    const maxNegativeWallet = balanceLimit ? balanceLimit.negative_balance : 0;
    if (!companyCategory) {
      logger.error('category_type not found');
      throw new BaseError({
        statusCode: 500,
        errors: {
          type_company: errorCode['server.typeCompanyNotFound']
        }
      });
    }
    let fee = Math.round(order.total * (companyCategory.fee_rate || 0.03));
    if (user_type === 'buyer') {
      fee *= 0.6;
      await Promise.all([
        companyService.updateWallet(
          { _id: order.company_id },
          { wallet: order.total_refund, refund_fund: -order.total_refund }
        )(session),
        companyHistoryService.create(
          {
            company_id: order.company_id,
            new_balance: company.wallet,
            type: companyHistoryService.type.refund_order,
            transaction_id: order._id,
            value: order.total_refund
          },
          { session }
        )
      ]);
    }
    // await transactionHelper.withSession(async (session) => {
    // });

    order = await orderModel.findOne({ _id: order._id }).session(session);
    if (order.is_company_paid_service_fee) return;
    [company] = await transactionHelper.mapTransaction(
      companyService.updateWallet(
        { _id: order.company_id },
        { wallet: -fee, maxNegativeWallet: -maxNegativeWallet }
      )
    )(session);
    //* company history
    await companyHistoryService.create(
      {
        company_id: order.company_id,
        type: companyHistoryService.type.pay_service_fee,
        transaction_id: order._id,
        new_balance: company.wallet,
        value: -fee
      },
      { session }
    );
    await companyMoneyFlowService.update(
      order.company_id,
      {
        total_service_fee: fee,
        total_loss: fee
      },
      { session }
    );
    order.total_service_fee = fee;
    order.is_company_paid_service_fee = true;
    await order.save();
    revenueService.update({ company_id: order.company_id }, { total_service_fee: fee });
    companyService.checkUpdateLimit(company);
  },
  async handlePrePay({ cached_order, user, updates = {} }, options) {
    logger.info('handlePrepay: ...start');
    const { session } = options;
    let _user, _company, order;
    const commission = cached_order.total_refund / 10;
    const refund = cached_order.total_refund - commission;
    const { note, ..._updates } = updates;
    const orderData = {
      ..._.omit(cached_order.toObject(), ['_id', 'id', 'expiresAt', 'is_confirmed']),
      ..._updates
    };
    if (note) {
      orderData.note = orderData.note ? orderData.note + '\n' + note : note;
    }

    [order, _user, _company] = await Promise.all([
      orderService.createOffline(orderData, { session }),
      userModel.findOne({ _id: user._id }, null, { session }),
      companyModel.findOne({ _id: cached_order.company_id }, 'wallet', { session })
    ]);

    const paymentMethod = order.payment_method || 'CASH';
    const { bonus_available, s_prepaid } = userService.calculateWallet(_user, order.total);
    // For case: paymentMethod === WALLET
    if (paymentMethod === 'WALLET') {
      // Update:
      // user: { -order.total from wallet }
      _user = await userService.updateWallet(_user._id, {
        'wallet.total': -order.total,
        'wallet.s_prepaid': -s_prepaid,
        'wallet.bonus_available': -bonus_available
      })(session);

      await Promise.all([
        // company: create history (user_pay_order)
        companyHistoryService.create(
          {
            user_id: _user.id,
            company_id: _company.id,
            type: companyHistoryService.type.user_pay_order,
            transaction_id: order._id,
            value: order.total,
            new_balance: _company.wallet + order.total
          },
          { session }
        ),
        // user: update money flow
        userMoneyFlowService.update(
          user.id,
          {
            total_loss: order.total,
            total_pay: order.total
          },
          { session }
        ),
        // user: create history (pay_order)
        userHistoryService.create(
          {
            user_id: _user.id,
            company_id: _company.id,
            type: userHistoryService.type.pay_order,
            transaction_id: order._id,
            value: -order.total,
            new_balance: _user.wallet.total
          },
          { session }
        )
      ]);
    }

    // For case: paymentMethod !== WALLET
    // Do nothing

    // Create payment transaction of user
    const paymentData = {
      order_id: order.id,
      user_id: _user.id,
      company_id: order.company_id,
      store_id: order.store_id,
      total_refund: order.total_refund,
      commission,
      total: order.total,
      s_prepaid,
      bonus_available
    };
    const paymentTransaction = await paymentTransactionService.create(paymentData, { session });
    logger.info('handlePrePay finished: %o', { paymentTransaction, order });
    return { paymentTransaction, order };
  },
  async handleCompanyConfirm({ order, user, performed_by, updates = {} }, options) {
    const { session } = options;
    let _user, _company;
    const commission = order.total_refund / 10;
    const refund = order.total_refund - commission;

    [order, _user] = await Promise.all([
      orderModel.findOneAndUpdate({ _id: order._id }, updates).session(session),
      userModel.findOne({ _id: user._id }, null, { session })
    ]);

    // Update
    // company: { refund_fund: + order.total_refund }
    _company = await companyService.updateWallet(
      { _id: order.company_id },
      { wallet: -order.total_refund, refund_fund: order.total_refund }
    )(session);

    const newBalance =
      order.is_paid && order.payment_method === 'WALLET'
        ? _company.wallet + order.total
        : _company.wallet;
    await Promise.all([
      // Create company history (refund_order)
      companyHistoryService.create(
        {
          user_id: _user.id,
          company_id: order.company_id,
          type: companyHistoryService.type.refund_order,
          transaction_id: order._id,
          value: -order.total_refund,
          new_balance: newBalance
        },
        { session }
      ),
      // Update company money flow
      order.payment_type === 'prepaid' &&
        companyMoneyFlowService.update(
          _company.id,
          {
            total_loss: order.total_refund,
            total_refund: order.total_refund
          },
          { session }
        )
    ]);
    // * update stock
    order.products.forEach((product) => {
      productStoringHandler.updateStock({
        fromId: product._id,
        fromDeltaQuantity: -product.quantity,
        performedUser: { _id: performed_by.id || performed_by._id, ...performed_by },
        user: { _id: order.user_id },
        type: 'sell'
      });
    });

    return { order };
  },
  async handleCompletePrepay({ order, user, updates = {} }, options) {
    const { session } = options;
    let _user, _company, _order;
    const commission = order.total_refund / 10;
    const refund = order.total_refund - commission;

    [_order, _user] = await Promise.all([
      orderModel.findOneAndUpdate({ _id: order._id }, updates).session(session),
      userModel.findOne({ _id: user._id }, null, { session })
    ]);
    const paymentMethod = _order.payment_method;

    // Fetch payment transaction
    const paymentTransaction = await paymentTransactionService.findOneAndUpdate(
      {
        user_id: _user.id,
        order_id: _order.id,
        is_confirmed: false
      },
      { is_confirmed: true },
      { session, new: true }
    );
    logger.info('handleCompletePrepay: %o', { paymentTransaction });

    // Total based on payment_method
    const totalToUpdate = paymentMethod === 'WALLET' ? paymentTransaction.total : 0;

    // Update company's wallet
    _company = await companyService.updateWallet(
      { _id: _order.company_id },
      {
        refund_fund: -paymentTransaction.total_refund,
        wallet: totalToUpdate
      }
    )(session);

    await Promise.all([
      // Update company money flow
      companyMoneyFlowService.update(
        _company.id,
        {
          total_gain: totalToUpdate,
          total_pay: totalToUpdate
        },
        { session }
      ),
      walletHandler.handleRefund({
        user: _user,
        refund: paymentTransaction.refund,
        object: _order,
        type: 'order',
        session
      }),
      walletHandler.handleCommission({
        user: _user,
        commission: paymentTransaction.commission,
        ref_id: user.ref_id,
        object: _order,
        type: 'order',
        session
      })
    ]);
    await this.handleServiceFee({ order }, { session });

    // Handle revenue
    revenueService.update(
      {
        company_id: _company._id,
        store_id: _order.store_id
      },
      {
        total: _order.total,
        total_pay: totalToUpdate,
        total_buyer: 1,
        total_discount: _order.total_discount,
        total_refund: _order.total_refund,
        total_transport_fee: _order.actual_transport_fee || order.transport_fee || 0,
        total_service_fee: _order.total_service_fee || 0
      }
    );
    _order.products.forEach((product) => {
      revenueService.updateByCategory(
        {
          company_id: _company._id,
          company_category_id: product.company_category_id,
          type_category_id: product.type_category_id,
          sub_category_id: product.sub_category_id
        },
        { total: _order.total, total_pay: totalToUpdate }
      );
    });

    // Update Sold
    if (!_order.without_product)
      _order.products.forEach((product) => {
        productStoringService.update({ _id: product._id }, { $inc: { sold: product.quantity } });
        productService.changeCount(product.id, { sold_count: product.quantity });
      });

    // checkUpdate
    companyService.checkUpdateLimit(_company);
    const promotionCodeIds = order.products.reduce(
      (prev, curt) => (curt.promotion_code_id ? [...prev, curt.promotion_code_id] : prev),
      []
    );
    promotionCodeServiceV2.markUsed(promotionCodeIds);
    companyService.changeCount(_order.company_id, {
      total_revenue: _order.total,
      total_pay: totalToUpdate,
      total_discount: _order.total_discount,
      total_refund: _order.total_refund
    });
    storeService.changeCount(_order.store_id, {
      total_revenue: _order.total,
      total_pay: totalToUpdate,
      total_discount: _order.total_discount,
      total_refund: _order.total_refund
    });

    // Create user behavior --
    storeService.findOne({ _id: _order.store_id }).then((store) => {
      const _location = store.location;
      let latitude = undefined;
      let longitude = undefined;
      if (_location && _location.type === 'Point' && Array.isArray(_location.coordinates)) {
        [longitude, latitude] = _location.coordinates;
      }
      const dataToCreate = _order.products.map((product) => ({
        user_id: _order.user_id,
        type: ShoppingTypes.Buy_Offline,
        type_category_id: product.type_category_id,
        company_category_id: product.company_category_id,
        sub_category_id: product.sub_category_id,
        company_id: _order.company_id,
        store_id: store._id,
        product_id: product.id,
        order_id: _order._id,
        location: { ...store.address, latitude, longitude }
      }));
      behaviorService.createMultiShoppingBehavior(dataToCreate);
    });

    return { order: _order };
  },
  async handleCancelPrepay({ order, user, performed_by, updates = {} }, options) {
    const { session } = options;
    let _user, _company, _order;
    const commission = order.total_refund / 10;
    const refund = order.total_refund - commission;

    [_order, _user] = await Promise.all([
      orderModel.findOneAndUpdate({ _id: order._id }, updates).session(session),
      userModel.findOne({ _id: user._id }, null, { session })
    ]);

    // Fetch payment transaction
    const paymentTransaction = await paymentTransactionService.findOneAndUpdate(
      {
        user_id: _user.id,
        order_id: order.id,
        is_confirmed: false
      },
      { is_confirmed: true },
      { session }
    );

    const paymentMethod = _order.payment_method;
    const totalToUpdate = paymentMethod === 'WALLET' ? paymentTransaction.total : 0;

    // For case: paymentMethod === WALLET
    // if (paymentMethod === 'WALLET') {
    // const { bonus_available, s_prepaid } = userService.calculateWallet(_user, _order.total);
    // Update wallets of user and company

    [_company, _user] = await Promise.all([
      // Update company's wallet
      companyService.updateWallet(
        { _id: _order.company_id },
        {
          refund_fund: -paymentTransaction.total_refund,
          wallet:
            paymentTransaction.total_refund -
            (paymentMethod === 'CASH' ? paymentTransaction.total : 0)
        }
      )(session),
      // Update user's wallet
      userService.updateWallet(
        _order.user_id,
        paymentMethod === 'WALLET'
          ? {
              'wallet.total': paymentTransaction.total,
              'wallet.bonus_available': paymentTransaction.bonus_available,
              'wallet.s_prepaid': paymentTransaction.s_prepaid
            }
          : {
              'wallet.total': paymentTransaction.total,
              'wallet.s_prepaid': paymentTransaction.total
            }
      )(session)
    ]);

    await Promise.all([
      // Create company history (cancel_order)
      companyHistoryService.create(
        {
          user_id: _user.id,
          company_id: _order.company_id,
          type: companyHistoryService.type.cancel_order,
          transaction_id: _order._id,
          value: paymentTransaction.total_refund - paymentTransaction.total,
          new_balance: _company.wallet
        },
        { session }
      ),
      // Update company money flow
      companyMoneyFlowService.update(
        _company.id,
        {
          total_gain: paymentTransaction.total_refund
        },
        { session }
      ),
      // Create user history (return_canceled_order)
      userHistoryService.create(
        {
          user_id: _user.id,
          company_id: _order.company_id,
          type: userHistoryService.type.return_canceled_order,
          transaction_id: _order._id,
          value: paymentTransaction.total,
          new_balance: _user.wallet.total
        },
        { session }
      ),
      // Update user money flow
      userMoneyFlowService.update(
        user.id,
        {
          total_gain: paymentTransaction.total,
          total_pay_back: paymentTransaction.total
        },
        { session }
      )
    ]);
    // }

    companyService.checkUpdateLimit(_company);
    //* update stock
    order.products.forEach((product) => {
      productStoringHandler.updateStock({
        fromId: product._id,
        fromDeltaQuantity: product.quantity,
        performedUser: { _id: performed_by.id || performed_by._id, ...performed_by },
        user: { _id: order.user_id },
        type: 'refund'
      });

      // Restore promotion_code
      if (product.promotion_code_id)
        promotionCodeServiceV2.autoGetV2(
          {
            company_id: product.company_id,
            store_id: product.store_id,
            product_id: product.id,
            apply_count: 0,
            promotion_code_id: product.promotion_code_id,
            model_id: product.model_id
          },
          {}
        );
    });

    // Create user behavior --
    if (user)
      storeService.findOne({ _id: order.store_id }).then((store) => {
        const _location = store.location;
        let latitude = undefined;
        let longitude = undefined;
        if (_location && _location.type === 'Point' && Array.isArray(_location.coordinates)) {
          [longitude, latitude] = _location.coordinates;
        }
        const dataToCreate = _order.products.map((product) => ({
          user_id: _order.user_id,
          type: ShoppingTypes.Cancel_Order,
          reason_canceled: updates.reason_canceled,
          reason_rejected: updates.reason_rejected,
          type_category_id: product.type_category_id,
          company_category_id: product.company_category_id,
          sub_category_id: product.sub_category_id,
          company_id: _order.company_id,
          store_id: store._id,
          product_id: product.id,
          order_id: _order._id,
          location: { ...store.address, latitude, longitude }
        }));
        behaviorService.createMultiShoppingBehavior(dataToCreate);
      });
  }
};
