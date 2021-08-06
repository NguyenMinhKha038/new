/* eslint-disable no-case-declarations */
import { logger, BaseError, errorCode } from '../../commons/utils';
// import transactionModel from "./transfer.model";
import transactionModel from './deposit-withdraw.model';
import companyService from '../company/company.service';
import companyLimitService from '../company/company-limit.service';
import revenueService from '../revenue/revenue.service';
import { userService } from '../../commons/user';
import statisticService from '../statistic/statistic.service';
import notificationService from '../notification/notification.service';
import companyMoneyFlowService from '../money-flow/company-money-flow.service';
import { configService } from '../../commons/config';
import userMoneyFlowService from '../user-money-follow/user-money-flow.service';
import userHistoryService from '../user-history/user-history.service';
import { currencyFormat } from '../../commons/utils/currencyFormat';

async function create(data) {
  try {
    return await transactionModel.create(data);
  } catch (err) {
    logger.error(err);
    throw new BaseError({
      statusCode: 500,
      error: 'cannot create transactions',
      errors: err
    });
  }
}

async function find({ query = {}, limit, skip, sort, populate, options = {} }) {
  try {
    return await transactionModel
      .find(query, options)
      .populate(populate)
      .limit(limit)
      .skip(skip)
      .sort(sort);
  } catch (err) {
    logger.error(err);
    throw new BaseError({
      statusCode: 500,
      error: 'cannot find transactions',
      errors: err
    });
  }
}

async function findOne(query, populate) {
  try {
    if (!populate) return await transactionModel.findOne(query);
    return await transactionModel.findOne(query).populate(populate);
  } catch (err) {
    logger.error(err);
    throw new BaseError({
      statusCode: 500,
      error: 'cannot find transactions',
      errors: err
    });
  }
}

async function rawFindOne(query, select, options) {
  try {
    return await transactionModel.findOne(query, select, options);
  } catch (err) {
    logger.error(err);
    throw new BaseError({
      statusCode: 500,
      error: 'cannot find transactions',
      errors: err
    });
  }
}

// async function findO(query, select, options) {}
/**
 *
 * @param {string} id
 * @param {any} select
 * @param {import('mongoose').QueryFindBaseOptions} options
 */
async function findById(id, select, options) {
  try {
    return await transactionModel.findById(id, select, options);
  } catch (err) {
    logger.error(err);
    throw new BaseError({
      statusCode: 500,
      error: 'cannot find transactions',
      errors: err
    });
  }
}

async function findOneAndUpdate(query, update) {
  try {
    return await transactionModel.findOneAndUpdate(query, update, {
      new: true
    });
  } catch (err) {
    logger.error(err);
    throw new BaseError({
      statusCode: 500,
      error: 'cannot update transactions',
      errors: err
    });
  }
}

async function findByIdAndUpdate(id, update) {
  try {
    return await transactionModel.findByIdAndUpdate(id, update, { new: true });
  } catch (err) {
    logger.error(err);
    throw new BaseError({
      statusCode: 500,
      error: 'cannot update transactions',
      errors: err
    });
  }
}

async function findByOneAndDelete(query) {
  try {
    return await transactionModel.findOneAndDelete(query, { new: true });
  } catch (err) {
    logger.error(err);
    throw new BaseError({
      statusCode: 500,
      error: 'cannot delete transactions',
      errors: err
    });
  }
}

async function count(query) {
  try {
    return await transactionModel.countDocuments(query);
  } catch (err) {
    logger.error(err);
    throw new BaseError({
      statusCode: 500,
      error: 'cannot count transactions',
      errors: err
    });
  }
}

async function statistics(query, sort = 'date') {
  const pipeline = [
    {
      $match: query
    },
    {
      $group: {
        _id: {
          $dateToString: {
            date: '$createdAt',
            format: '%Y-%m-%d'
          }
        },
        date: { $first: '$createdAt' },
        values: { $push: '$value' },
        total_new_balance: { $sum: '$new_balance' },
        companies: { $addToSet: '$company_id' },
        count: { $sum: 1 }
      }
    },
    {
      $addFields: {
        total: {
          $sum: '$values'
        },
        min: {
          $min: '$values'
        },
        max: {
          $max: '$values'
        },
        avg: {
          $avg: '$values'
        }
      }
    },
    {
      $sort: { [sort]: -1 }
    }
  ];
  return await transactionModel.aggregate(pipeline);
}

async function confirmTransaction({ transaction, amount, status, cashier_id }) {
  try {
    const {
      company_id,
      user_id,
      value,
      refund,
      type,
      _id: transaction_id,
      payment_type,
      fee = 0
    } = transaction;
    if (payment_type === 'vnpay') {
      throw new BaseError({
        statusCode: 400,
        error: errorCode.client,
        errors: { payment_type: errorCode['client.typeNotAllow'] }
      }).addMeta({ message: 'transaction cannot confirm' });
    }
    if (amount && amount !== value) {
      throw new BaseError({
        statusCode: 400,
        error: errorCode.client,
        errors: { amount: errorCode['client.wrongInput'] }
      }).addMeta({ message: 'amount is not match' });
    }
    if (transaction.company_id) {
      const response = await confirmCompanyTransaction(company_id, {
        type,
        transaction_id: transaction._id,
        status: status,
        value,
        cashier_id,
        fee
      });
      return response;
    } else if (transaction.user_id) {
      const response = confirmUserTransaction(user_id, {
        type,
        transaction_id,
        status: status,
        refundValue: refund,
        cashier_id,
        value,
        fee
      });
      return response;
    } else {
      throw new BaseError({
        statusCode: 400,
        error: errorCode.client,
        errors: { _id: errorCode['any.notAvailable'] }
      }).addMeta({ message: 'transaction is not found' });
    }
  } catch (err) {
    logger.error(err);
    throw new BaseError({ statusCode: 500, error: 'cannot confirm transaction', errors: err });
  }
}

/**
 *
 * @param {string} user_id
 * @param {DepWithConfirm} param1
 */
async function confirmUserTransaction(
  user_id,
  { type, transaction_id, status, refundValue, value, cashier_id, vnp_data, payment_type, fee }
) {
  const appCurrency = process.env.APP_CURRENCY;
  if (status === 'success') {
    if (!vnp_data) vnp_data = {};
    const user = await userService.findById(user_id);
    // let fee = 0;
    let message = '';

    let currentBalance = user.wallet.total;
    const old_balance = currentBalance;
    let new_balance = currentBalance;
    if (type === 'deposit') {
      // fee = 0;
      await userService.transact(
        userService.updateWallet(user_id, {
          'wallet.total': value + refundValue,
          'wallet.refund': refundValue,
          'wallet.bonus_available': refundValue,
          'wallet.s_prepaid': value,
          'wallet.deposit': value
        })
      );
      statisticService.update({ total_deposit_user: value });
      userMoneyFlowService.update(user_id, {
        total_deposit: value,
        total_gain: value,
        total_refund: refundValue
      });
      userHistoryService.create({
        user_id: user_id,
        onModel: 's_deposit_withdraw',
        transaction_id: transaction_id,
        type: 'refund',
        value: refundValue
      });
      message = currencyFormat(value, 'vi-VN', appCurrency) + ' đã được nạp vào tài khoản';
      new_balance = currentBalance + value + refundValue;
    } else if (type === 'withdraw') {
      // const withdrawConfig = await configService.findByKey('withdraw');
      // fee = withdrawConfig.fee;
      // value = value * -1;
      statisticService.update({
        total_withdrawal: value,
        total_withdrawal_fee: fee
      });
      userMoneyFlowService.update(user_id, {
        total_withdraw: value,
        total_loss: value,
        total_withdrawal_fee: fee
      });
      userHistoryService.create({
        user_id: user_id,
        onModel: 's_deposit_withdraw',
        transaction_id: transaction_id,
        type: 'fee',
        value: fee
      });
      message = currencyFormat(value) + ' đã được chuyển vào tài khoản ngân hàng của bạn';
      new_balance = currentBalance - value - fee;
    }

    let res = await transactionModel.findByIdAndUpdate(
      transaction_id,
      {
        status: status,
        old_balance,
        new_balance,
        cashier_id,
        fee,
        confirm_at: new Date().toISOString(),
        ...vnp_data
      },
      { new: true }
    );
    notificationService.createAndSend({
      user_id: user_id,
      type: type === 'deposit' ? 'user_deposit_success' : 'user_withdraw_success',
      title: `${type === 'deposit' ? `Mua ${appCurrency}` : 'Rút tiền'} thành công`,
      message,
      object_id: transaction_id
    });
    return res;
  } else if (status === 'canceled') {
    if (type === 'withdraw') {
      // const { value, fee } = transaction;
      await userService.transact(
        userService.updateWallet(user_id, {
          'wallet.total': value + fee,
          'wallet.withdrawal': -value,
          'wallet.bonus_available': value,
          'wallet.fee': -fee,
          'wallet.s_prepaid': fee
        })
      );
      notificationService.createAndSend({
        user_id: user_id,
        type: 'user_withdraw_error',
        title: 'Rút tiền thất bại',
        message:
          'Có vẻ đã có sự cố , Số tiền ' + currencyFormat(value) + ' bạn yêu cầu rút đã bị từ chối',
        object_id: transaction_id
      });
    } else if (type === 'deposit') {
      notificationService.createAndSend({
        user_id: user_id,
        type: 'user_deposit_error',
        title: `Mua ${appCurrency} thất bại`,
        message:
          'Có vẻ đã có sự cố, ' +
          currencyFormat(value, 'vi-VN', appCurrency) +
          ' bạn nạp vào tài khoản đã bị từ chối',
        object_id: transaction_id
      });
    }

    let response = await transactionModel.findByIdAndUpdate(
      transaction_id,
      {
        status,
        cashier_id,
        confirm_at: new Date().toISOString()
      },
      { new: true }
    );
    return response;
  }
}
/**
 *
 * @param {string} company_id
 * @param {DepWithConfirm} param1
 */
async function confirmCompanyTransaction(
  company_id,
  { type, transaction_id, status, value, cashier_id, vnp_data, payment_type, fee }
) {
  let company = await companyService.findById(company_id, '+wallet');

  if (!company) {
    throw new BaseError({
      statusCode: 400,
      error: errorCode.client,
      errors: { company_id: errorCode['company.notAvailable'] }
    }).addMeta({ message: 'company is not found' });
  }

  const appCurrency = process.env.APP_CURRENCY;
  if (status === 'success') {
    if (!vnp_data) vnp_data = {};

    if (type === 'deposit_company') {
      let old_balance = company.wallet;
      let new_balance = old_balance + value;

      await companyService.transact(
        companyService.updateWallet({ _id: company_id }, { wallet: value })
      );
      let transactionRes = await transactionModel.findByIdAndUpdate(
        transaction_id,
        {
          status: status,
          old_balance,
          new_balance,
          cashier_id,
          confirm_at: new Date().toISOString(),
          ...vnp_data
        },
        { new: true }
      );
      companyService.changeCount(company_id, {
        total_deposit: value
      });
      revenueService.update({ company_id: company_id }, { total_deposit: value });
      companyMoneyFlowService.update(company_id, {
        total_deposit: value,
        total_gain: value
      });
      notificationService.createAndSend({
        company_id: company_id,
        user_id: company.user_id,
        type: 'company_deposit_success',
        title: `Mua ${appCurrency} thành công`,
        message:
          currencyFormat(value, 'vi-VN', appCurrency) +
          ' đã được chuyển vào tài khoản doanh nghiệp của bạn',
        object_id: transaction_id
      });
      return transactionRes;
    } else if (type === 'withdraw_company') {
      // const withdrawConfig = await configService.findByKey('withdraw_company');
      // const fee = withdrawConfig.fee;

      let old_balance = company.wallet;
      let new_balance = old_balance - value - fee;

      let transactionRes = await transactionModel.findByIdAndUpdate(
        transaction_id,
        {
          status: status,
          old_balance,
          new_balance,
          cashier_id,
          fee,
          confirm_at: new Date().toISOString()
        },
        { new: true }
      );

      await companyService.changeCount(company_id, {
        total_withdraw: value
      });
      revenueService.update(
        { company_id: company_id },
        { total_withdraw: value, total_withdrawal_fee: fee }
      );

      companyMoneyFlowService.update(company_id, {
        total_withdraw: value,
        total_withdrawal_fee: fee,
        total_loss: value + fee
      });

      notificationService.createAndSend({
        company_id: company_id,
        user_id: company.user_id,
        type: 'company_withdraw_success',
        title: 'Rút tiền thành công',
        message:
          currencyFormat(value) + ' đã được chuyển vào tài khoản ngân hàng doanh nghiệp của bạn',
        object_id: transaction_id
      });
      return transactionRes;
    }
  } else if (status === 'canceled') {
    if (type === 'withdraw_company') {
      const withdrawConfig = await configService.findByKey('withdraw_company');
      await companyService.transact(
        companyService.updateWallet(
          { _id: company_id },
          {
            wallet: value + withdrawConfig.fee,
            total_withdraw: -value
          }
        )
      );
      notificationService.createAndSend({
        company_id: company_id,
        user_id: company.user_id,
        type: 'company_withdraw_error',
        title: 'Rút tiền thất bại',
        message:
          'Có vẻ đã có sự cố , Số tiền ' + currencyFormat(value) + ' bạn yêu cầu rút đã bị từ chối',
        object_id: transaction_id
      });
    } else if (type === 'deposit_company') {
      notificationService.createAndSend({
        company_id: company_id,
        user_id: company.user_id,
        type: 'company_deposit_error',
        title: 'Nạp tiền thất bại',
        message:
          'Có vẻ đã có sự cố, ' +
          currencyFormat(value, 'vi-VN', appCurrency) +
          ' bạn nạp vào tài khoản đã bị từ chối',
        object_id: transaction_id
      });
    }
    let response = await transactionModel.findByIdAndUpdate(
      transaction_id,
      {
        status: status,
        cashier_id,
        confirm_at: new Date().toISOString()
      },
      { new: true }
    );
    return response;
  } else {
    throw new BaseError({
      statusCode: 400,
      error: errorCode.client,
      errors: { status: errorCode['any.invalid'] }
    }).addMeta({ message: 'status is not valid' });
  }
}

export default {
  create,
  find,
  findById,
  findOne,
  rawFindOne,
  findByOneAndDelete,
  findOneAndUpdate,
  findByIdAndUpdate,
  count,
  confirmTransaction,
  statistics,
  confirmCompanyTransaction,
  confirmUserTransaction
};
