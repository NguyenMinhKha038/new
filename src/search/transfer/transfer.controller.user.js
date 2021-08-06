import { userService } from '../../commons/user';
import { BaseError, errorCode, BaseResponse, getDate } from '../../commons/utils';
import transferService from './transfer.service';
import _ from 'lodash';
import historyService from '../user-history/user-history.service';
import statisticService from '../statistic/statistic.service';
import notificationService from '../notification/notification.service';
import userMoneyFlowService from '../user-money-follow/user-money-flow.service';
import { configService } from '../../commons/config';
import { getTransactionCode } from '../../commons/utils/transaction-code';
import { currencyFormat } from '../../commons/utils/currencyFormat';
import { withSession } from '../../commons/utils/transaction-helper';

async function transfer(req, res, next) {
  try {
    const { receiver_phone, value } = req.validate;

    const sender = req.user;
    const receiver = await userService.findOne({ phone: receiver_phone });
    if (!receiver) {
      return next(
        new BaseError({
          statusCode: 400,
          error: errorCode.client,
          errors: { receiver_phone: errorCode['client.wrongInput'] }
        }).addMeta({ message: 'user is not available or wrong phone number' })
      );
    }
    if (receiver._id.toString() === sender._id.toString()) {
      return next(
        new BaseError({
          statusCode: 400,
          error: errorCode.authorization,
          errors: { phone: errorCode['auth.yourself'] }
        }).addMeta({ message: 'cannot send money to yourself' })
      );
    }

    if (sender.wallet.total < value) {
      return next(
        new BaseError({
          statusCode: 400,
          error: errorCode.client,
          errors: { user: errorCode['client.MoneyNotEnough'] }
        }).addMeta({ message: 'user is not enough money' })
      );
    }

    const [transferTransactionList, transferConfig] = await Promise.all([
      transferService.find({ sender_id: req.user._id, date: getDate() }),
      configService.findByKey('transfer')
    ]);
    console.log('TRANSFER CONFIG', transferConfig);
    const totalToDayAmount = transferTransactionList.length
      ? transferTransactionList.reduce((prev, current) => prev + current.value, 0)
      : 0;
    const maxAmountPerDay = transferConfig ? transferConfig.max_per_day : 2e6;
    const minAmount = transferConfig ? transferConfig.min : 50000;

    if (value + totalToDayAmount > maxAmountPerDay) {
      return next(
        new BaseError({
          statusCode: 400,
          error: errorCode.client,
          errors: { value: errorCode['client.overLimitPerDay'] }
        }).addMeta({ message: 'value is over limit per day' })
      );
    }
    if (value < minAmount) {
      return next(
        new BaseError({
          statusCode: 400,
          error: errorCode.client,
          errors: { value: errorCode['client.minMoney'] }
        }).addMeta({ message: 'value is less than min' })
      );
    }

    let subtractSPrepaid = value;
    let subtractBonusAvailable = 0;
    if (sender.wallet.s_prepaid < value) {
      subtractSPrepaid = sender.wallet.s_prepaid;
      subtractBonusAvailable = value - subtractSPrepaid;
    }
    let response = null;
    await withSession(async (session) => {
      const { PIN, ...other } = req.validate;
      const transferData = {
        ...other,
        sender_id: req.user.id,
        receiver_id: receiver._id,
        sender_old_balance: sender.wallet.total,
        sender_new_balance: sender.wallet.total - value,
        receiver_old_balance: receiver.wallet.total,
        receiver_new_balance: receiver.wallet.total + value,
        code: getTransactionCode(sender.phone),
        status: 'success'
      };

      const [senderUser, receiverUser, [transferTransaction]] = await Promise.all([
        userService.updateWallet(req.user.id, {
          'wallet.total': value * -1,
          'wallet.s_prepaid': -subtractSPrepaid,
          'wallet.transfer': value,
          'wallet.bonus_available': -subtractBonusAvailable
        })(session),
        userService.updateWallet(receiver._id, {
          'wallet.total': value,
          'wallet.receive': value,
          'wallet.s_prepaid': value
        })(session),
        transferService.create([transferData], { session })
      ]);
      const appCurrency = process.env.APP_CURRENCY;
      await Promise.all([
        // transactionCountService.update({ user_id: sender._id }, { transfer: value }, { session }),
        historyService.create(
          {
            user_id: req.user._id,
            type: 'transfer_sender',
            transaction_id: transferTransaction._id,
            onModel: 's_transfers',
            value: value
          },
          { session }
        ),
        historyService.create(
          {
            user_id: receiver._id,
            type: 'transfer_receiver',
            transaction_id: transferTransaction._id,
            onModel: 's_transfers',
            value: value
          },
          { session }
        ),
        userMoneyFlowService.update(
          req.user._id,
          {
            total_loss: value,
            total_transfer: value
          },
          { session }
        ),
        userMoneyFlowService.update(
          receiver._id,
          {
            total_gain: value,
            total_receipt: value
          },
          { session }
        )
      ]);

      statisticService.update({ total_transfer: value });

      notificationService.createAndSend({
        user_id: transferData.receiver_id,
        type: 'user_receive_money',
        title: `Nhận ${appCurrency} thành công`,
        message: `Bạn đã nhận được ${currencyFormat(value, 'vi-VN', appCurrency)} từ ${
          req.user.name
        } `,
        object_id: transferTransaction._id
      });
      response = _.pick(transferTransaction, [
        'sender_old_balance',
        'sender_new_balance',
        'status',
        '_id',
        'value',
        'sender_id',
        'receiver_id',
        'code',
        'createdAt',
        'updatedAt'
      ]);
    });
    return res.send(new BaseResponse({ statusCode: 201, data: response }));
  } catch (err) {
    return next(err);
  }
}

async function find(req, res, next) {
  try {
    let { limit, page, sort, type, ...query } = req.validate;

    let skip = limit ? limit * (page - 1) : 0;
    let populate = {};
    let select = '';
    if (type === 'sender') {
      query.sender_id = req.user.id;
      populate = { path: 'receiver_id', select: 'name avatar' };
      select = '-sender_old_balance -sender_new_balance';
    } else if (type === 'receiver') {
      query.receiver_id = req.user.id;
      populate = { path: 'sender_id', select: 'name avatar' };
      select = '-receiver_old_balance -receiver_new_balance';
    }

    const total = await transferService.count(query);

    let totalPage = limit ? Math.ceil(total / limit) : 1;
    const records = await transferService.find(query, select, { limit, skip, sort, populate });
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
    let record = await transferService.findOne({
      _id: id,
      sender_id: req.user.id
    });
    return res.send(new BaseResponse({ statusCode: 200, data: record }));
  } catch (err) {
    return next(err);
  }
}

export default {
  transfer,
  find,
  findById
};
