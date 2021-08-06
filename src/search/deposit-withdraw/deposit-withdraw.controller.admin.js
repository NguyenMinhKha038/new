import transactionService from './deposit-withdraw.service';
import { BaseResponse, BaseError, errorCode, currencyFormat } from '../../commons/utils';
import _ from 'lodash';
import { adminService } from '../../commons/admin';
import hashingCompare from '../../commons/utils/hashing-compare';
import depositWithdrawService from './deposit-withdraw.service';
import { userService } from '../../commons/user';
import { configService } from '../../commons/config';
import userHistoryService from '../user-history/user-history.service';
import statisticService from '../statistic/statistic.service';
import companyService from '../company/company.service';
import userMoneyFlowService from '../user-money-follow/user-money-flow.service';
import companyLimitService from '../company/company-limit.service';
import revenueService from '../revenue/revenue.service';
import companyHistoryService from '../company-history/company-history.service';
import companyMoneyFlowService from '../money-flow/company-money-flow.service';
import { getTransactionCode } from '../../commons/utils/transaction-code';
import adminBankService from '../admin-bank/admin-bank.service';
import notificationService from '../notification/notification.service';
import adminActivityService from '../../commons/admin-activity/admin-activity.service';

async function find(req, res, next) {
  try {
    let { limit, page, sort, start_time, end_time, ...query } = req.validate;
    if (start_time && end_time) {
      query.createdAt = {
        $lte: new Date(end_time),
        $gte: new Date(start_time)
      };
    }
    let skip = limit ? limit * (page - 1) : 0;
    const total = await transactionService.count(query);
    let totalPage = limit ? Math.ceil(total / limit) : 1;

    let populate = [{ path: 'cashier_id', select: 'name phone' }];
    const { type } = query;
    if (type) {
      if (type === 'deposit') {
        populate = populate.concat([
          { path: 'user_id', select: 'name phone' },
          { path: 'admin_bank_id' }
        ]);
      } else if (type === 'deposit_company') {
        populate = populate.concat([
          { path: 'user_id', select: 'name phone' },
          { path: 'company_id', select: 'name status phone_number' },
          { path: 'admin_bank_id' }
        ]);
      } else if (type === 'withdraw') {
        populate = populate.concat([
          { path: 'user_id', select: 'name phone' },
          { path: 'user_bank_id' }
        ]);
      } else if (type === 'withdraw_company') {
        populate = populate.concat([
          { path: 'user_id', select: 'name phone' },
          { path: 'company_id', select: 'name status phone_number' },
          { path: 'company_bank_id' }
        ]);
      }
    }
    let records = await transactionService.find({
      query,
      limit,
      skip,
      sort,
      populate
    });
    return res.send(
      new BaseResponse({ statusCode: 200, data: records }).addMeta({
        totalPage,
        total
      })
    );
  } catch (err) {
    return next(err);
  }
}

async function findById(req, res, next) {
  try {
    let { id } = req.validate;
    let populate = [
      { path: 'user_id', select: 'name phone' },
      { path: 'company_id', select: 'name status phone_number' },
      { path: 'company_bank_id' },
      { path: 'admin_bank_id' },
      { path: 'cashier_id', select: 'name' },
      { path: 'user_bank_id' }
    ];
    let response = await transactionService.findById(id, {}, { populate });
    return res.send(new BaseResponse({ statusCode: 200, data: response }));
  } catch (err) {
    return next(err);
  }
}

async function confirmTransaction(req, res, next) {
  try {
    const { id, status } = req.validate;
    let transaction = await transactionService.findById(id);
    if (transaction && transaction.status === 'pending') {
      let response = await transactionService.confirmTransaction({
        transaction,
        status,
        amount: transaction.value,
        cashier_id: req.admin.id
      });

      // Create admin activities
      adminActivityService.create({
        admin_id: req.admin.id,
        on_model: 's_deposit_withdraw',
        object_id: response._id,
        updated_fields: ['status'],
        type: 'update',
        snapshot: response,
        resource: req.originalUrl
      });

      return res.send(new BaseResponse({ statusCode: 201, data: response }));
    } else {
      return next(
        new BaseError({
          statusCode: 400,
          error: errorCode.client,
          errors: {
            id:
              transaction.status === 'success'
                ? errorCode['client.transactionHasBeenApproved']
                : errorCode['client.transactionNotExist']
          }
        })
      );
    }
  } catch (err) {
    return next(err);
  }
}

async function createTransaction(req, res, next) {
  try {
    let { user_id, company_id, type, value, admin_bank_id, ...data } = req.validate;
    const adminBank = await adminBankService.findById(admin_bank_id);
    if (!adminBank) {
      return next(
        new BaseError({
          statusCode: 400,
          error: errorCode.client,
          errors: { admin_bank_id: errorCode['client.admin-bank.notFound'] }
        }).addMeta({ message: 'bank not found' })
      );
    }
    const appCurrency = process.env.APP_CURRENCY;
    if (type === 'deposit') {
      const user = await userService.findById(user_id);
      if (!user) {
        return next(
          new BaseError({
            statusCode: 400,
            error: errorCode.client,
            errors: { user_id: errorCode['client.userNotFound'] }
          }).addMeta({ message: 'user not found' })
        );
      }
      let refund = 0;
      let fee = 0;
      let deposit = 0;
      let withdraw = 0;
      let old_balance = user.wallet.total;
      let new_balance = old_balance;
      // if (type === 'deposit') {
      const depositConfig = await configService.findByKey('deposit');
      const depositConfigValue = depositConfig.value;
      const valueDeposit = depositConfigValue.find((item) => item.value === value);
      if (valueDeposit) {
        refund = valueDeposit.refund;
      }

      new_balance = new_balance + refund + value;
      deposit = value;
      // }
      // else if (type === "withdraw") {
      //   const withdrawConfig = await configService.findByKey("withdrawal_fee");
      //   const fee = withdrawConfig.value;
      //   new_balance = new_balance - value - fee;
      //   withdraw = value;
      // }
      data = {
        ...data,
        admin_bank_id,
        type,
        value,
        fee,
        refund,
        user_id,
        cashier_id: req.admin.id,
        old_balance,
        new_balance,
        status: 'success',
        code: getTransactionCode(user.phone)
      };
      const response = await transactionService.create(data);
      await userService.transact(
        userService.updateWallet(user_id, {
          'wallet.total': type === 'deposit' ? value + refund : value * -1 - fee,
          'wallet.deposit': deposit,
          'wallet.withdrawal': withdraw,
          'wallet.refund': refund,
          'wallet.bonus_available': refund,
          'wallet.fee': fee,
          'wallet.s_prepaid': type === 'deposit' ? value : value * -1 - fee
        })
      );
      // userHistoryService.create({
      //   user_id,
      //   onModel: 's_deposit_withdraw',
      //   transaction_id: response._id,
      //   type: type === 'deposit' ? 'refund' : 'fee',
      //   value: type === 'withdraw' ? refund : fee
      // });
      userHistoryService.create({
        user_id,
        onModel: 's_deposit_withdraw',
        transaction_id: response._id,
        type,
        value,
        new_balance
      });
      userMoneyFlowService.update(user_id, {
        total_deposit: deposit,
        total_gain: deposit,
        total_loss: withdraw,
        total_withdrawal_fee: fee,
        total_refund: refund,
        total_withdraw: withdraw
      });
      statisticService.update({
        total_deposit_user: deposit,
        total_withdrawal: withdraw,
        total_withdrawal_fee: fee,
        total_refund: refund
      });
      notificationService.createAndSend({
        user_id: user._id,
        type: 'user_deposit_success',
        title: `Mua ${appCurrency} thành công`,
        message: `${currencyFormat(
          value,
          'vi-VN',
          appCurrency
        )} đã được chuyển vào tài khoản của bạn`,
        object_id: response._id
      });

      // Create admin activities
      adminActivityService.create({
        admin_id: req.admin.id,
        on_model: 's_deposit_withdraw',
        object_id: response._id,
        updated_fields: response,
        type: 'insert',
        snapshot: response,
        resource: req.originalUrl
      });

      return res.send(new BaseResponse({ statusCode: 200, data: response }));
    } else if (type === 'deposit_company') {
      const company = await companyService.findById(company_id, '+wallet');
      if (!company) {
        return next(
          new BaseError({
            statusCode: 400,
            error: errorCode.client,
            errors: { company_id: errorCode['client.companyNotExist'] }
          }).addMeta({ message: 'company not found' })
        );
      }
      let fee = 0;
      let deposit = 0;
      let withdraw = 0;
      let walletUpdate = 0;
      let old_balance = company.wallet;
      let new_balance = old_balance;
      if (type === 'deposit_company') {
        new_balance = new_balance + value;
        deposit = value;
        walletUpdate = value;
      }
      // else if (type === "withdraw_company") {
      //   const withdrawFee = await configService.findByKey("withdrawal_fee");
      //   fee = withdrawFee.value;
      //   withdrawFee = value;
      //   new_balance = new_balance - value - fee;
      //   walletUpdate = value * -1;
      // }
      console.log('COMPANY ', company);
      data = {
        ...data,
        fee,
        old_balance,
        new_balance,
        cashier_id: req.admin.id,
        user_id: company.user_id,
        admin_bank_id,
        company_id,
        type,
        value,
        status: 'success',
        code: getTransactionCode(company.tax_code)
      };
      const response = await transactionService.create(data);
      // await companyService.transact([
      //   companyService.updateWallet(
      //     { _id: company_id },
      //     {
      //       wallet: walletUpdate - fee,
      //       total_withdraw: withdraw
      //     }
      //   )
      // ]);
      await companyService.transact(
        companyService.updateWallet(
          { _id: company_id },
          { wallet: walletUpdate - fee, total_withdraw: withdraw }
        )
      );
      companyService.changeCount(company_id, {
        total_deposit: deposit,
        total_withdrawal: withdraw
      });
      revenueService.update(
        { company_id },
        {
          total_deposit: deposit,
          total_withdraw: withdraw,
          total_withdrawal_fee: fee
        }
      );
      companyHistoryService.create({
        user_id: company.user_id,
        company_id: company_id,
        type: type === 'deposit_company' ? 'deposit' : 'withdraw',
        new_balance,
        transaction_id: response._id,
        value,
        onModel: 's_deposit_withdraw'
      });
      companyMoneyFlowService.update(company_id, {
        total_deposit: deposit,
        total_withdrawal_fee: fee,
        total_withdraw: withdraw,
        total_gain: deposit,
        total_loss: withdraw
      });
      notificationService.createAndSend({
        user_id: company.user_id,
        company_id: company._id,
        type: 'company_deposit_success',
        title: `Mua ${appCurrency} thành công`,
        message: `${currencyFormat(
          value,
          'vi-VN',
          appCurrency
        )} đã được chuyển vào tài khoản doanh nghiệp của bạn`,
        object_id: response._id
      });

      // Create admin activities
      adminActivityService.create({
        admin_id: req.admin.id,
        on_model: 's_deposit_withdraw',
        object_id: response._id,
        updated_fields: response,
        type: 'insert',
        snapshot: response,
        resource: req.originalUrl
      });

      return res.send(new BaseResponse({ statusCode: 200, data: response }));
    }
    return next(
      new BaseError({
        statusCode: 400,
        error: errorCode.client,
        errors: { type: errorCode['any.invalid'] }
      }).addMeta({ message: 'type not found' })
    );
  } catch (err) {
    return next(err);
  }
}

async function confirmBySms(req, res, next) {
  try {
    const { username, password, message, phone } = req.body;

    let admin = await adminService.findOne({ user_name: username });
    if (!admin) {
      return new BaseError({
        statusCode: 400,
        error: errorCode.client,
        errors: { user_name: errorCode['client.userNotFound'] }
      }).addMeta({ message: 'admin is not found' });
    }
    let comparingPassword = await hashingCompare.compareHashCode(password, admin.password);
    if (!comparingPassword) {
      return next(
        new BaseError({
          statusCode: 400,
          error: errorCode.authorization,
          errors: {
            password: errorCode['autho.notMatch']
          }
        }).addMeta({ message: 'admin wrong user name or password' })
      );
    }
    const reg = /.*(\+[0-9,]*).*(0[0-9]{9}-[a-zA-Z0-9]*).*/i;
    const result = message.match(reg);

    if (result.length > 2) {
      const amountString = result[1];
      const fullCode = result[2];
      const amount = parseFloat(amountString.replace(/,/g, ''));
      let transaction = await depositWithdrawService.findOne(
        { code: fullCode, value: amount, status: 'pending' },
        { path: 'user_id' }
      );
      if (transaction) {
        let response = await depositWithdrawService.confirmTransaction({
          transaction,
          amount,
          status: 'success',
          cashier_id: admin._id
        });
        return res.send(
          new BaseResponse({
            statusCode: 200,
            data: {
              ...response
            }
          })
        );
      } else {
        return next(
          new BaseError({
            statusCode: 400,
            error: errorCode.client,
            errors: {
              message: errorCode['client.transactionNotExist']
            }
          })
        );
      }
    } else {
      res.send(
        new BaseResponse({
          statusCode: 400
        })
      );
    }
  } catch (err) {
    res.send(new BaseResponse({ statusCode: 500 }));
  }
}

async function statistic(req, res, next) {
  try {
    const { start_time, end_time, limit, sort, ...query } = req.validate;
    if (start_time && end_time) {
      query.createdAt = {
        $gte: start_time,
        $lte: end_time
      };
    }
    let response = await transactionService.statistics(query, sort);
    return res.send(new BaseResponse({ statusCode: 200, data: response }));
  } catch (err) {
    return next(err);
  }
}

export default {
  find,
  findById,
  confirmTransaction,
  confirmBySms,
  statistic,
  createTransaction
};
