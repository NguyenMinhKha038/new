import promotionProductService from './promotionProduct.service';
import _ from 'lodash';
import { BaseResponse } from '../../commons/utils';
import companyService from '../company/company.service';

async function find(req, res, next) {
  try {
    let { limit, page, sort } = req.validate;
    let skip = page ? limit * (page - 1) : 0;

    let company = await companyService.findOne({ user_id: req.user.id });
    if (!company) {
      return next(
        new BaseError({
          statusCode: 400,
          error: errorCode.authorization,
          errors: {}
        }).addMeta({
          code: errorCode['company.notAvailable'],
          message: 'company is not available'
        })
      );
    }

    let populate = [
      { path: 'product_id', select: 'name' },
      { path: 'store_id', select: 'name' },
      { path: 'promotion_id' }
    ];
    let query = _.omit(req.validate, ['limit', 'page', 'sort']);
    query.company_id = company._id;
    let totalPage = limit ? Math.ceil((await promotionProductService.count(query)) / limit) : 1;
    let response = await promotionProductService.find({
      query,
      limit,
      skip,
      sort,
      populate
    });
    return res.send(
      new BaseResponse({ statusCode: 200, data: response }).addMeta({
        totalPage
      })
    );
  } catch (err) {
    return next(err);
  }
}

export default {
  find
};
