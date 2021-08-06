import { BaseResponse, BaseError } from '../../commons/utils';
import promotionCodeService from './promotion-code.service';
import promotionService from '../promotion/promotion.service';
import companyService from '../company/company.service';
import _ from 'lodash';

async function find(req, res, next) {
  try {
    let value = req.validate;
    let { limit, page, sort } = value;

    let skip = page && limit ? limit * (value.page - 1) : 0;
    let company = await companyService.findOne({ user_id: req.user.id });
    if (!company)
      throw new BaseError({
        statusCode: 400,
        error: errorCode.client,
        errors: { company_id: errorCode['client.companyNotExist'] }
      });
    let companyId = company ? company._id : null;
    let promotion = await promotionService.findOne({ company_id: companyId });

    if (promotion) value.promotion_id = promotion._id;
    else value.promotion_id = null;

    value = _.omit(value, ['limit', 'page', 'sort']);
    let totalPage = page ? Math.ceil((await promotionCodeService.count(value)) / limit) : 1;

    let promotionCodeList = await promotionCodeService.find({
      ...value,
      limit,
      skip,
      sort
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
    let promotionCode = req.promotionCode;
    return res.send(new BaseResponse({ statusCode: 200, data: promotionCode }));
  } catch (err) {
    return next(err);
  }
}

async function findAndDelete(req, res, next) {
  try {
    let value = req.validate;
    await promotionCodeService.findAndDelete(value.id);
    return res.send(new BaseResponse({ statusCode: 200 }));
  } catch (err) {
    return next(err);
  }
}

export default {
  find,
  findById,
  findAndDelete
};
