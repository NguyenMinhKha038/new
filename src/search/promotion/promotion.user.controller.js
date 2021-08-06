import promotionValidate from './promotion.validate';
import over from '../../commons/over_function';
import { BaseResponse } from '../../commons/utils';
import _ from 'lodash';
import promotionService from './promotion.service';

async function find(req, res, next) {
  try {
    let { sort, limit, page, product_id, reference } = req.validate;
    let skip = page ? limit * (page - 1) : 0;
    let currentDate = new Date();

    req.validate = {
      ...req.validate,
      starts_at: { $lt: currentDate },
      expires_at: { $gt: currentDate }
    };

    let populate = product_id
      ? [
          {
            path: 'product_storing_ids',
            match: { product_id },
            option: { $exists: true }
          }
        ]
      : [{ path: 'none-path' }];

    req.validate = _.omit(req.validate, ['limit', 'page', 'sort', 'product_id']);
    const query = req.validate;
    const total = await promotionService.count(query);
    const totalPage = limit ? Math.ceil(total / limit) : 1;

    if (reference) {
      const refTextList = reference.split(' ');
      const populate = [];
      refTextList.forEach((text) => {
        if (text === 'product') {
          populate.push({ path: 'products.product', select: 'name thumbnail price' });
          return;
        }
        populate.push({ path: text, select: 'name' });
      });
      query.populate = populate;
    }

    let promotionsList = await promotionService.find({
      query,
      limit,
      skip,
      sort,
      populate
    });
    promotionsList = promotionsList.map((promotion) => {
      return promotion;
    });
    return res.send(
      new BaseResponse({ statusCode: 200, data: promotionsList }).addMeta({
        totalPage,
        total
      })
    );
  } catch (err) {
    return next(err);
  }
}

async function findById(req, res, next) {
  let { error, value } = promotionValidate.user.idValidate(req.params);
  if (error) return next(over.getJoiError(error));
  try {
    let promotion = await promotionpromotionService.findById(value.id);
    return res.send(new BaseResponse({ statusCode: 200, data: promotion }));
  } catch (err) {
    return next(err);
  }
}

// user who is owner of company

// async function createPromotionCode

export default {
  find,
  findById
};
