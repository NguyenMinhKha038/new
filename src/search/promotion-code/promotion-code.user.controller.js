import promotionCodeService from './promotion-code.service';
import { BaseResponse, BaseError, errorCode } from '../../commons/utils';
import promotionService from '../promotion/promotion.service';
import userService from '../../commons/user/user.service';
import _ from 'lodash';
import promotionCodeAuth from './promotion-code.auth';
import productStoringService from '../product-storing/product-storing.service';

async function create(req, res, next) {
  try {
    const user_id = req.user.id;
    let { promotion_id } = req.validate;

    let promotionCode = await promotionCodeService.findOne({
      user_id,
      promotion_id
    });

    if ((promotionCode && promotionCode.times_used == 0) || !promotionCode) {
      let promotion = await promotionService.findById(promotion_id);
      let isUsable = promotion
        ? promotionCodeAuth.isUsable(promotion.start_at, promotion.expire_at)
        : false;

      if (isUsable && (promotion.remain > 0 || promotion.remain === -1)) {
        let code = promotionCodeService.createPromotionCode(promotion);
        let value = {
          ...req.validate,
          code,
          user_id,
          times_used: promotion.max_uses
        };

        Promise.all([
          promotionCodeService.create(value),
          promotionService.findOneAndUpdate(
            {
              _id: promotion_id
            },
            {
              value_convert: promotion.value_convert + 1,
              remain: promotion.remain === -1 ? promotion.remain : promotion.remain - 1
            }
          )
        ]).then((response) => {
          return res.send(new BaseResponse({ statusCode: 201, data: response[0] }));
        });
      } else {
        return next(
          new BaseError({
            statusCode: 400,
            error: errorCode.action,
            errors: {}
          }).addMeta({ message: 'promotionCode.outOfQuantity' })
        );
      }
    } else {
      return next(
        new BaseError({
          statusCode: 400,
          error: errorCode.authorization,
          errors: {}
        }).addMeta({ message: 'autho.existed' })
      );
    }
  } catch (err) {
    return next(err);
  }
}

async function find(req, res, next) {
  try {
    let value = req.validate;
    let { limit, page, sort } = value;
    // let limit = req.query.limit ? parseInt(req.query.limit) : 0;
    let skip = page ? limit * (page - 1) : 0;

    let populationCondition = {};
    if (value.status) {
      let status = value.status;
      let condition = {};
      let currentDate = new Date();
      if (status === 'active') {
        condition = {
          times_used: { $gt: 0 }
        };
        populationCondition = {
          ...populationCondition,
          starts_at: { $lt: currentDate },
          expires_at: { $gt: currentDate }
        };
      } else if (status === 'used') {
        condition = {
          times_used: 0
        };
      } else if (status === 'expired') {
        populationCondition = {
          ...populationCondition,
          expires_at: { $lt: currentDate }
        };
      }
      value = { ...value, ...condition };
    }

    value = _.omit(value, ['status', 'limit', 'page', 'sort']);
    let totalPage = req.query.limit ? Math.ceil((await promotionCodeService.count({})) / limit) : 1;

    value = { ...value, user_id: req.user.id };
    let populate = [
      {
        path: 'promotion_id',
        match: { ...populationCondition },
        option: { $exist: true }
      }
    ];

    let promotionCodeList = await promotionCodeService.find({
      ...value,
      limit,
      skip,
      sort,
      populate
    });
    promotionCodeList = promotionCodeList.filter((promotionCode) => promotionCode.promotion_id);

    return res.send(
      new BaseResponse({ statusCode: 200, data: promotionCodeList }).addMeta({
        totalPage
      })
    );
  } catch (err) {
    return next(err);
  }
}

async function findById(req, res, next) {
  try {
    // let value = req.validate;
    let populate = [{ path: 'promotion_id' }];
    let promotionCode = await promotionCodeService.findById(req.validate.id, populate);

    if (promotionCode && promotionCode.user_id._id.toString() == req.user.id) {
      return res.send(new BaseResponse({ statusCode: 200, data: promotionCode }));
    }
    return next(
      new BaseError({
        statusCode: 400,
        error: errorCode.authorization,
        errors: {}
      }).addMeta({
        message: 'user not allow',
        errorCode: errorCode['permission.notAllow']
      })
    );
  } catch (err) {
    return next(err);
  }
}

async function userUsed(req, res, next) {
  // return value refund, not update wallet of user hereeeeeeeeeeeeeeeee.
  try {
    let value = req.validate;
    let { product_id, store_id } = value;
    let promotionPopulate = [
      {
        path: 'promotion_id',
        match: {
          start_at: { $lte: new Date() },
          expire_at: { $gte: new Date() }
        }
      }
    ];
    let promotionCode = await promotionCodeService.findOne({ code: value.code }, promotionPopulate);

    if (promotionCode && promotionCode.user_id) {
      let populate = { path: 'product_id' };
      let product = await productStoringService.findOne({
        query: { product_id, store_id },
        populate
      });
      if (product) {
        Promise.all([
          promotionCodeService.findOneAndUpdate(
            { code: value.code },
            { times_used: promotionCode.times_used - 1, date_used: new Date() }
          ),
          userService.findOneAndUpdate(
            { _id: promotionCode.user_id._id },
            {
              $set: {
                'wallet.refund': promotion.refund * product.product_id.price
              }
            }
          )
        ])
          .then((result) => {
            // let user = await userService.findById(promotionCode.user_id._id);
            return res.send(new BaseResponse({ statusCode: 200, data: result[1] }));
          })
          .catch((error) => {
            return next(error);
          });
        return res.send(new BaseResponse({ statusCode: 200, data }));
      } else {
        return next(
          new BaseError({
            statusCode: 400,
            error: errorCode.client,
            errors: {}
          }).addMeta({ message: 'product not available' })
        );
      }
    } else {
      return next(
        new BaseError({
          statusCode: 500,
          error: errorCode.server,
          errors: {}
        }).addMeta({ message: errorCode['server.userEmpty'] })
      );
    }
  } catch (err) {
    return next(err);
  }
}

// async function
export default {
  create,
  find,
  findById,
  userUsed
};
