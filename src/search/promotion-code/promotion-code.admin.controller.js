import promotionCodeService from './promotion-code.service';
import { BaseResponse } from '../../commons/utils';
import _ from 'lodash';

async function find(req, res, next) {
  try {
    let { limit, page, sort, status } = req.validate;
    let skip = limit ? limit * (page - 1) : 0;
    let populateCondition = {};
    let query = _.omit(req.validate, ['limit', 'page', 'sort', 'status']);
    let current = new Date();
    if (status) {
      if (status === 'active') {
        populateCondition = {
          start_at: { $lte: current },
          expire_at: { $gte: current }
        };
      } else if (status === 'expired') {
        populateCondition = {
          expire_at: { $lt: current }
        };
      } else if (status === 'used') {
        query.times_used = 0;
      }
    }

    let populate = {
      path: 'promotion_id',
      match: { ...populateCondition },
      option: { $exists: true }
    };
    let totalPage = page ? Math.ceil((await promotionCodeService.count(query)) / limit) : 1;
    let promotionCodeList = await promotionCodeService.find({
      ...query,
      limit,
      skip,
      sort,
      populate
    });
    promotionCodeList = promotionCodeList.filter((element) => {
      return element.promotion_id;
    });
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
    let populate = [{ path: 'promotion_id' }, { path: 'user_id', select: ['name', 'email'] }];
    let promotionCode = await promotionCodeService.findById(req.validate.id, populate);
    return res.send(new BaseResponse({ statusCode: 200, data: promotionCode }));
  } catch (err) {
    return next(err);
  }
}

export default {
  find,
  findById
};
