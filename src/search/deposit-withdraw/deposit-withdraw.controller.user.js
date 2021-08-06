import { userService } from '../../commons/user';
import transactionService from './deposit-withdraw.service';
import { BaseResponse, errorCode, BaseError, getDate, withSafety } from '../../commons/utils';
import _ from 'lodash';
import companyService from '../company/company.service';
import { configService } from '../../commons/config';
import transactionCountService from '../transaction-count/transaction-count.service';
import companyHistoryService from '../company-history/company-history.service';
import userHistoryService from '../user-history/user-history.service';
import { getTransactionCode } from '../../commons/utils/transaction-code';
import vnpay from '../payment-gateway/vnpay';
import userBankService from '../user-banks/user-bank.service';
import adminBankService from '../admin-bank/admin-bank.service';
import companyBankService from '../company-banks/companyBank.service';
// import depositWithdrawService from "./deposit-withdraw.service";
import adminActivityService from '../../commons/admin-activity/admin-activity.service';
import companyActivityService from '../company-activity/company-activity.service';
import { CompanyActions } from '../company-activity/company-activity.config';

async function create(req, res, next) {
  try {
    const { id } = req.user;
    let user = req.user;
    let { value, type, code, user_bank_id, admin_bank_id } = req.validate;

    let refund = 0;
    let withdrawFee = 0;

    const currentBalance = user.wallet.total;
    let new_balance = currentBalance;
    if (type === 'withdraw') {
      if (user.status !== 'approve-kyc') {
        return next(
          new BaseError({
            statusCode: 400,
            error: errorCode.authorization,
            errors: {
              kyc: errorCode['auth.notApproved']
            }
          }).addMeta({ message: ' kyc is not approved' })
        );
      }

      const withdrawConfig = await configService.findByKey('withdraw');
      const { fee, max_per_day, min } = withdrawConfig;
      withdrawFee = fee;
      // check money enough
      if (value > user.wallet.bonus_available || value + fee > user.wallet.total) {
        return next(
          new BaseError({
            statusCode: 400,
            error: errorCode.client,
            errors: {
              value: errorCode['client.MoneyNotEnough']
            }
          }).addMeta({ message: 'available money is not enough' })
        );
      }
      //check out of limit per day
      const withdrawCount = await transactionCountService.findOne({
        user_id: req.user.id,
        date: getDate()
      });
      if (withdrawCount && withdrawCount.withdraw + value > max_per_day) {
        return next(
          new BaseError({
            statusCode: 400,
            error: errorCode.client,
            errors: { value: errorCode['client.overLimitPerDay'] }
          }).addMeta({ message: 'money is over limit per day' })
        );
      }
      //check min money
      if (value < min) {
        return next(
          new BaseError({
            statusCode: 400,
            error: errorCode.client,
            errors: { value: errorCode['client.minMoney'] }
          }).addMeta({ message: 'value is less than min' })
        );
      }

      const userBank = await userBankService.findOne({
        query: { user_id: req.user.id, _id: user_bank_id }
      });
      if (!userBank) {
        return next(
          new BaseError({
            statusCode: 400,
            error: errorCode.client,
            errors: { user_bank_id: errorCode['client.user-bank.notFound'] }
          }).addMeta({ message: 'user bank not found' })
        );
      }

      let sPrepaidSubtract = fee;
      let bonusAvailableSubtract = value;
      if (user.wallet.s_prepaid < fee) {
        sPrepaidSubtract = user.wallet.s_prepaid;
        bonusAvailableSubtract = value + (fee - sPrepaidSubtract);
      }
      await userService.transact(
        userService.updateWallet(user._id, {
          'wallet.s_prepaid': -sPrepaidSubtract,
          'wallet.total': -value - fee,
          'wallet.fee': fee,
          'wallet.bonus_available': -bonusAvailableSubtract,
          'wallet.withdrawal': value
        })
      );
      transactionCountService.update(
        { user_id: req.user.id, date: getDate() },
        { withdraw: value }
      );
      // value = value * -1;
      code = getTransactionCode(user.phone);
      new_balance = new_balance - value - fee;
      // value = -value;
    } else if (type === 'deposit') {
      if (!code) code = getTransactionCode(user.phone);
      const adminBank = await adminBankService.findById(admin_bank_id);
      if (!adminBank) {
        return next(
          new BaseError({
            statusCode: 400,
            error: errorCode.client,
            errors: { admin_bank_id: errorCode['client.admin-bank.notFound'] }
          }).addMeta({ message: 'admin bank not found' })
        );
      }
      const depositConfig = await configService.findByKey('deposit');
      if (!depositConfig) {
        return next(
          new BaseError({
            statusCode: 400,
            error: errorCode.client,
            errors: { value: errorCode['client.cartNotExist'] }
          }).addMeta({ message: 'card money not existed' })
        );
      }
      const valueItem = depositConfig.value.find((item) => item.value === value);
      if (!valueItem) {
        return next(
          new BaseError({
            statusCode: 400,
            error: errorCode.client,
            errors: { value: errorCode['client.valueNotAvailable'] }
          }).addMeta({ message: 'value is not available' })
        );
      }
      refund = valueItem ? valueItem.refund : 0;
      new_balance = new_balance + value + refund;
    }
    if (new_balance < 0) {
      return next(
        new BaseError({
          statusCode: 400,
          error: errorCode.client,
          errors: {
            value: errorCode['client.MoneyNotEnough']
          }
        })
      );
    }
    let data = {
      ...req.validate,
      code,
      old_balance: currentBalance,
      new_balance,
      user_id: id,
      refund,
      fee: withdrawFee
    };

    let response = await transactionService.create(data);
    if (type === 'deposit') {
      if (value >= 500000) {
        let level = value >= 2000000 ? 3 : value >= 1000000 ? 2 : 1;
        userService.updateOne({ _id: id }, { level });
      }
    }
    userHistoryService.create({
      user_id: user._id,
      onModel: 's_deposit_withdraw',
      value: value,
      transaction_id: response._id,
      type
    });
    return res.send(new BaseResponse({ statusCode: 201, data: response }));
  } catch (err) {
    return next(err);
  }
}

async function updateImage(req, res, next) {
  try {
    const { id, image, type } = req.validate;
    // if (type === 'company') {
    //   const company = await companyService.findByUserId(req.user.id);
    //   if(!company){
    //     return res.se
    //   }
    // }
    let transaction = await transactionService.findOneAndUpdate(
      { _id: id, user_id: req.user.id },
      { bill_image: image }
    );
    return res.send(
      new BaseResponse({
        statusCode: 201,
        data: transaction
      })
    );
  } catch (err) {
    return next(err);
  }
}

//company
async function depositCompany(req, res, next) {
  try {
    const { value, type, company_bank_id, admin_bank_id } = req.validate;
    let code = req.validate.code;

    let user = req.user;
    const company = req.company;

    if (!company || !user) {
      return next(
        new BaseError({
          statusCode: 400,
          error: errorCode.authorization,
          errors: {
            companyOrUser: errorCode['autho.notexisted']
          }
        }).addMeta({ message: 'company or user is not exist' })
      );
    }
    if (company.status !== 'approved' && company.status !== 'suspend') {
      return next(
        new BaseError({
          statusCode: 400,
          error: errorCode.client,
          errors: { company: errorCode['client.companyNotApproved'] }
        }).addMeta({ message: 'company is not approved' })
      );
    }
    let fee = 0;
    let old_balance = company.wallet;
    let new_balance = company.wallet + value;

    if (type === 'withdraw_company') {
      if (user.status !== 'approve-kyc') {
        return next(
          new BaseError({
            statusCode: 400,
            error: errorCode.client,
            errors: errorCode['client.userNotApproveKyc']
          }).addMeta({ message: 'user has not approved kyc yet' })
        );
      }

      const companyBank = await companyBankService.findOne({
        query: { _id: company_bank_id, user_id: req.user.id, company_id: company._id }
      });

      if (!companyBank) {
        return next(
          new BaseError({
            statusCode: 400,
            error: errorCode.client,
            errors: { company_bank_id: errorCode['client.company-bank.notFound'] }
          }).addMeta({ message: 'company bank not found' })
        );
      }

      const withdrawConfig = await configService.findByKey('withdraw_company');
      fee = withdrawConfig.fee;
      const amount = value + fee;
      old_balance = company.wallet;
      new_balance = company.wallet - amount;
      const totalUseful = company.wallet - amount - company.balance_limit;
      let total = totalUseful;

      //check if money enough
      if (total < 0 || new_balance < 0) {
        return next(
          new BaseError({
            statusCode: 400,
            error: errorCode.client,
            errors: {
              value: errorCode['client.MoneyNotEnough']
            }
          }).addMeta({ message: 'money is not enough' })
        );
      }
      // check over limit per day
      const withdrawCount = await transactionCountService.findOne({
        company_id: company._id,
        date: getDate()
      });
      if (withdrawCount && withdrawCount.withdraw + value > withdrawConfig.max_per_day) {
        return next(
          new BaseError({
            statusCode: 400,
            error: errorCode.client,
            errors: { value: errorCode['client.overLimitPerDay'] }
          }).addMeta({ message: 'money is over limit per day' })
        );
      }
      //check min value
      if (value < withdrawConfig.min) {
        return next(
          new BaseError({
            statusCode: 400,
            error: errorCode.client,
            errors: { value: errorCode['client.minMoney'] }
          }).addMeta({ message: 'value is less than min' })
        );
      }

      await companyService.transact(
        companyService.updateWallet(
          { _id: company._id },
          {
            wallet: -(value + fee),
            total_withdraw: value
          }
        )
      );
      transactionCountService.update(
        { company_id: company._id, user_id: req.user.id },
        { withdraw: value }
      );
      code = getTransactionCode(user.phone);
    } else if (type === 'deposit_company') {
      const adminBank = await adminBankService.findById(admin_bank_id);
      if (!adminBank) {
        return next(
          new BaseError({
            statusCode: 400,
            error: errorCode.client,
            errors: { admin_bank_id: errorCode['client.admin-bank.notFound'] }
          }).addMeta({ message: 'admin bank not found' })
        );
      }
    }

    if (!code) {
      code = getTransactionCode(user.phone);
    }
    let data = {
      ...req.validate,
      type,
      old_balance,
      new_balance,
      user_id: req.user.id,
      company_id: company._id,
      fee: type === 'withdraw_company' ? fee : 0,
      code
    };
    let response = await transactionService.create(data);
    companyHistoryService.create({
      user_id: user._id,
      type: type === 'deposit_company' ? 'deposit' : 'withdraw',
      company_id: company._id,
      new_balance,
      transaction_id: response._id,
      value,
      onModel: 's_deposit_withdraw'
    });
    withSafety(() => {
      companyActivityService.implicitCreate(CompanyActions[type.replace('_company', '')])(req, {
        object_id: response._id
      });
    });
    return res.send(new BaseResponse({ statusCode: 200, data: response }));
  } catch (err) {
    return next(err);
  }
}

async function companyFind(req, res, next) {
  try {
    let { user_id, limit, page, sort, start_time, end_time } = req.validate;
    if (user_id)
      return next(
        new BaseError({
          statusCode: 400,
          error: errorCode.validate,
          errors: { user_id: errorCode['any.invalid'] }
        })
      );

    let skip = limit ? limit * (page - 1) : 0;
    let query = _.omit(req.validate, ['limit', 'page', 'sort', 'start_time', 'end_time']);
    // let company = await companyService.findByUserId(req.user.id);
    const company = req.company;
    query.company_id = company._id;
    query.user_id = req.user.id;
    if (start_time && end_time) {
      start_time = new Date(start_time);
      end_time = new Date(end_time);
      query = {
        ...query,
        createdAt: {
          $gte: start_time,
          $lte: end_time
        }
      };
    }
    query = {
      ...query,
      $or: [{ payment_type: { $ne: 'vnpay' } }, { status: { $ne: 'pending' } }]
    };

    const total = await transactionService.count(query);
    let totalPage = limit ? Math.ceil(total / limit) : 1;

    let records = await transactionService.find({
      query,
      limit,
      skip,
      sort,
      populate: [{ path: 'company_bank_id' }, { path: 'admin_bank_id' }]
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

async function find(req, res, next) {
  try {
    let { user_id, limit, page, sort } = req.validate;
    if (user_id)
      return next(
        new BaseError({
          statusCode: 400,
          error: errorCode.validate,
          errors: { user_id: errorCode['any.invalid'] }
        })
      );

    let skip = limit ? limit * (page - 1) : 0;
    let query = _.omit(req.validate, ['limit', 'page', 'sort']);
    query.user_id = req.user.id;

    query = {
      ...query,
      $or: [{ payment_type: { $ne: 'vnpay' } }, { status: { $ne: 'pending' } }]
    };
    const count = await transactionService.count(query);
    let totalPage = limit ? Math.ceil(count / limit) : 1;
    let records = await transactionService.find({
      query,
      limit,
      skip,
      sort,
      populate: [{ path: 'admin_bank_id' }, { path: 'user_bank_id' }]
    });
    return res.send(
      new BaseResponse({ statusCode: 200, data: records }).addMeta({
        totalPage,
        total: count
      })
    );
  } catch (err) {
    return next(err);
  }
}

async function findById(req, res, next) {
  try {
    let { id } = req.validate;
    const options = {
      populate: [{ path: 'admin_bank_id' }, { path: 'user_bank_id' }, { path: 'company_bank_id' }]
    };
    let response = await transactionService.rawFindOne(
      { _id: id, user_id: req.user.id },
      {},
      options
    );
    return res.send(new BaseResponse({ statusCode: 200, data: response }));
  } catch (err) {
    return next(err);
  }
}

async function companyFindById(req, res, next) {
  try {
    const { id } = req.validate;
    const company = await companyService.findByUserId(req.user.id);
    if (!company) {
      return next(
        new BaseError({
          statusCode: 400,
          error: errorCode.client,
          errors: { user: errorCode['company.notAvailable'] }
        }).addMeta({ message: 'company is not available' })
      );
    }
    const options = {
      populate: [{ path: 'admin_bank_id' }, { path: 'user_bank_id' }, { path: 'company_bank_id' }]
    };
    const transaction = await transactionService.rawFindOne(
      {
        _id: id,
        user_id: req.user.id,
        company_id: company._id
      },
      {},
      options
    );
    return res.send(new BaseResponse({ statusCode: 200, data: transaction }));
  } catch (err) {
    return next(err);
  }
}

async function depositByVnPay(req, res, next) {
  try {
    /**
     * @type {{type: 'deposit'| 'deposit_company', value: string}}
     */

    const user = await userService.findById(req.user.id);

    const code = getTransactionCode(user.phone);
    const { type, value } = req.validate;
    const userIp = req.headers['x-forwarded-for'];

    const vnpCode = 'deposit.' + code + '.' + new Date().getTime().toString(36);
    const vnpUrl = vnpay.createPaymentUrl({
      amount: value,
      userIp,
      // orderType: type,
      orderDescription: type,
      code: vnpCode
    });

    let data = {
      value,
      type,
      code,
      user_id: user._id,
      payment_type: 'vnpay'
    };

    let [refund, current_balance, new_balance] = [0, 0, 0];
    let company = null;
    if (type === 'deposit') {
      const depositConfig = await configService.findByKey('deposit');
      if (!depositConfig) {
        return next(
          new BaseError({
            statusCode: 400,
            error: errorCode.client,
            errors: { value: errorCode['client.cartNotExist'] }
          }).addMeta({ message: 'card money not existed' })
        );
      }
      const valueItem = depositConfig.value.find((item) => item.value === value);
      current_balance = user.wallet.total;
      refund = valueItem ? valueItem.refund : 0;
      new_balance = current_balance + value + refund;
    } else if (type === 'deposit_company') {
      company = await companyService.findOne(
        { user_id: user._id },
        '+wallet +total_pay +total_withdraw'
      );
      if (company.status !== 'approved' && company.status !== 'suspend') {
        return next(
          new BaseError({
            statusCode: 400,
            error: errorCode.client,
            errors: { company: errorCode['client.companyNotApproved'] }
          }).addMeta({ message: 'company is not approved' })
        );
      }
      if (!company) {
        return next(
          new BaseError({
            statusCode: 400,
            error: errorCode.client,
            errors: { company: errorCode['client.companyNotApproved'] }
          }).addMeta({ message: 'company is not found or not approved' })
        );
      }
      current_balance = company.wallet;
      new_balance = current_balance + value + refund;
      data.company_id = company._id;
    }

    data = { ...data, refund, old_balance: current_balance, new_balance };
    const response = await transactionService.create(data);

    return res.send(new BaseResponse({ statusCode: 200, data: { vnpUrl, data: response } }));
  } catch (err) {
    return next(err);
  }
}

export default {
  create,
  find,
  findById,
  depositCompany,
  companyFind,
  updateImage,
  companyFindById,
  depositByVnPay
};
