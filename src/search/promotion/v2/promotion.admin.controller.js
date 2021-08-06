// const { BaseError } = require('../../../commons/utils');
// const { default: promotionService } = require('../promotion.service');
import { BaseResponse } from '../../../commons/utils';
import { promotionCodeServiceV2 } from '../../promotion-code/v2/promotion-code.service';
import promotionService from '../promotion.service';
import { promotionHandlerV2 } from './promotion.handler';

const getById = async (req, res, next) => {
  try {
    const { id } = req.validate;
    const promotion = await promotionService.findById(
      id,
      {},
      {
        populate: [
          // { path: 'products.product', select: 'name price' },
          { path: 'store', select: 'name address' },
          { path: 'company', select: 'name logo' }
        ]
      }
    );
    if (!promotion) {
      return new BaseError({
        statusCode: 400,
        error: errorCode.client,
        errors: { promotion_id: errorCode['client.promotion.notFound'] }
      }).return(res);
    }

    const responsePromotion = promotion.toObject();

    const { products, _id: promotion_id } = responsePromotion;
    const promotionCodeList = await promotionCodeServiceV2.find({ promotion_id });
    const productList = promotionHandlerV2.statisticUsingPromotionCode(products, promotionCodeList);
    responsePromotion.products = productList;
    return new BaseResponse({ statusCode: 200, data: responsePromotion }).return(res);
  } catch (error) {
    return next(error);
  }
};

export const promotionAdminControllerV2 = {
  getById
};
