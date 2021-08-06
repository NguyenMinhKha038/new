import paymentService from './payment.service';
import { BaseResponse, BaseError, errorCode } from '../../commons/utils';
import _ from 'lodash';
import { userService } from '../../commons/user';
import historyService from '../user-history/user-history.service';

async function payment(req, res, next) {
  try {
    let { value, type, card_type, PIN } = req.validate;
    let validate = req.validate;
    let user = await userService.findById(req.user.id);
    validate = {
      ...validate,
      user_id: req.user.id,
      status: 'success',
      old_balance: user.wallet.total + user.wallet.bonus_available,
      new_balance: user.wallet.total + user.wallet.bonus_available - value
    };

    // await userService.transact(userService.updateWallet(req.user.id,{'wallet.total':value*-1},PIN));
    // await userService.transact(userService.updateWallet(req.user.id,{'wallet.refund': value*}))
    let newRecord = await paymentService.create(validate);
    historyService.create({
      user_id: req.user.id,
      transaction_id: newRecord._id,
      type: 'payment',
      onModel: 's_payments'
    });
    return res.send(new BaseResponse({ statusCode: 201, data: newRecord }));
  } catch (err) {
    return next(err);
  }
}

async function find(req, res, next) {
  try {
    let { limit, page, sort, user_id } = req.validate;

    if (user_id) {
      return next(
        new BaseError({
          statusCode: 400,
          error: errorCode.validate,
          errors: { user_id: errorCode['any.invalid'] }
        })
      );
    }

    let skip = limit ? limit * (page - 1) : 0;
    let query = _.omit(req.validate, ['skip', 'page', 'sort']);
    query.user_id = req.user.id;

    let records = await paymentService.find({ query, limit, skip, sort });
    let totalPage = limit ? Math.ceil((await paymentService.count(query)) / limit) : 1;

    return res.send(
      new BaseResponse({ statusCode: 200, data: records }).addMeta({
        totalPage
      })
    );
  } catch (err) {
    return next(err);
  }
}

async function findOne(req, res, next) {
  try {
    let record = await paymentService.findOne({
      _id: req.validate.id,
      user_id: req.user.id
    });
    return res.send(new BaseResponse({ statusCode: 200, data: record }));
  } catch (err) {
    return next(err);
  }
}

export default {
  payment,
  find,
  findOne
};
