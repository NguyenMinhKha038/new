/* eslint-disable prettier/prettier */
// const { default: promotionCodeModel } = require('../promotion-code.model');
import { BaseError, errorCode, logger } from '../../../commons/utils';
import { withSession } from '../../../commons/utils/transaction-helper';
import companyLimitService from '../../company/company-limit.service';
import promotionService from '../../promotion/promotion.service';
import promotionCodeModel from '../promotion-code.model';

const getPromotionCodeV2 = ({
  product_id,
  apply_count,
  promotion_code_id,
  store_id,
  company_id,
  model_id
}) => async (session) => {
  try {
    let promotion = null;
    let prevPromotionCode = null;

    if (promotion_code_id) {
      console.log({ _id: promotion_code_id, store_id, product_id, company_id, model_id });
      prevPromotionCode = await promotionCodeModel.findOne(
        { _id: promotion_code_id, store_id, product_id, company_id, model_id },
        {},
        { session }
      );
      if (!prevPromotionCode) {
        throw new BaseError({
          statusCode: 400,
          error: errorCode.client,
          errors: { promotion_code_id: errorCode['client.promotion-code.notFound'] }
        }).addMeta({ message: 'promotion code id not found' });
      }
      promotion = await promotionService.findActiveV2(
        { _id: prevPromotionCode.promotion_id },
        {},
        { session }
      );
      if (!promotion) {
        prevPromotionCode = null;
      }
    }

    if (!promotion_code_id || !prevPromotionCode) {
      promotion = await promotionService.findActiveV2(
        {
          store_id,
          company_id,
          product_ids: product_id
        },
        {},
        { session }
      );
      if (!promotion) {
        throw new BaseError({
          statusCode: 400,
          error: errorCode.client,
          errors: { promotion: errorCode['client.promotion.notFound'] }
        }).addMeta({ message: 'promotion is not found' });
      }
    }

    const productPromotion = promotion.products.find(
      (product) => product.product_id.toString() === product_id.toString()
    );
    if (!productPromotion) {
      throw new BaseError({
        statusCode: 400,
        error: errorCode.client,
        errors: {
          product: errorCode['client.promotion.productNotFound']
        }
      });
    }
    const validModelPromotion = productPromotion.models.find(
      (model) => model.model_id.toString() === model_id.toString()
    );
    if (!validModelPromotion) {
      throw new BaseError({
        statusCode: 400,
        error: errorCode.client,
        errors: {
          model: errorCode['client.invalidProductModel']
        }
      });
    }
    const { unlimited, remain } = validModelPromotion;
    if (!unlimited) {
      const { promotionCode, prevApplyCount } = await getLimitedPromotionCode({
        model_id,
        apply_count,
        product_id,
        promotion,
        // promotion_code_id,
        promotion_code: prevPromotionCode,
        remain
      })(session);
      const response = {
        ...promotionCode.toObject(),
        validModelPromotion,
        promotion,
        prevApplyCount
      };
      return response;
    }

    if (unlimited) {
      const { promotionCode } = await getUnlimitedPromotionCode({
        // promotion_code_id,
        promotion_code: prevPromotionCode,
        promotion,
        apply_count,
        product_id,
        model_id
      })(session);
      const response = { ...promotionCode.toObject(), validModelPromotion, promotion };
      return response;
    }
  } catch (err) {
    throw err;
  }
};

const getUnlimitedPromotionCode = ({
  promotion_code,
  promotion,
  apply_count,
  product_id,
  model_id
}) => async (session) => {
  let promotionCode = null;
  if (promotion_code) {
    // console.log('PROMOTION CODE', promotion_code);
    promotion_code.apply_count = apply_count;
    await promotion_code.save();
    // promotion_code.update({ apply_count }, { session });
    promotionCode = promotion_code;
  }
  if (!promotion_code) {
    let code = createPromotionCode(promotion);
    [promotionCode] = await promotionCodeModel.create(
      [
        {
          promotion_id: promotion._id,
          company_id: promotion.company_id,
          store_id: promotion.store_id,
          product_id,
          model_id,
          code,
          status: 'active',
          apply_count
        }
      ],
      { session }
    );
  }
  return { promotionCode };
};

const getLimitedPromotionCode = ({
  promotion_code,
  remain,
  apply_count,
  product_id,
  promotion,
  model_id
}) => async (session) => {
  let promotionCode = null;
  let subtractAmount = apply_count;
  let availableApplyCount = apply_count;
  let prevApplyCount = 0;
  if (promotion_code) {
    const prevPromotionCode = promotion_code;
    const { apply_count: prev_apply_count } = prevPromotionCode;
    prevApplyCount = prev_apply_count;
    if (prev_apply_count < apply_count) {
      if (remain <= 0) {
        // throw new BaseError({
        //   statusCode: 400,
        //   error: errorCode.client,
        //   errors: { total: errorCode['client.promotion-code.outOfStock'] }
        // }).addMeta({ message: 'promotion code is out of stock' });
        apply_count = prev_apply_count;
      }
      const delta = apply_count - prev_apply_count;
      console.log('deltaaa', delta);
      subtractAmount = delta;
      if (remain <= delta) {
        availableApplyCount = subtractAmount = remain;
        availableApplyCount = remain + prev_apply_count;
      }
    }
    if (prev_apply_count >= apply_count) {
      const delta = apply_count - prev_apply_count;
      subtractAmount = delta;
    }
    prevPromotionCode.apply_count = availableApplyCount;
    prevPromotionCode.save({ session });
    promotionCode = prevPromotionCode;
  }
  if (!promotion_code) {
    if (remain <= 0) {
      throw new BaseError({
        statusCode: 400,
        error: errorCode.client,
        errors: { total: errorCode['client.promotion-code.outOfStock'] }
      }).addMeta({ message: 'promotion code is out of stock' });
    }
    if (remain < subtractAmount) {
      subtractAmount = remain;
    }
    let code = createPromotionCode(promotion);
    [promotionCode] = await promotionCodeModel.create(
      [
        {
          promotion_id: promotion._id,
          company_id: promotion.company_id,
          store_id: promotion.store_id,
          product_id,
          model_id,
          code,
          status: 'active',
          apply_count: subtractAmount
        }
      ],
      { session }
    );
  }
  // promotion.products.id(product_id).remain -= subtractAmount;
  const productPromotion = promotion.products.find(
    (product) => product.product_id.toString() === product_id.toString()
  );
  const modelPromotion = productPromotion.models.find(
    (model) => model.model_id.toString() === model_id.toString()
  );
  modelPromotion.remain -= subtractAmount;
  await promotion.save();
  console.log('PROMOTION CODE', promotionCode);
  return { promotionCode, prevApplyCount };
};

async function autoGetV2(
  { product_id, store_id, company_id, apply_count, promotion_code_id, model_id },
  options = {}
) {
  try {
    const promotionCode = options.session
      ? await getPromotionCodeV2({
          store_id,
          product_id,
          apply_count,
          company_id,
          promotion_code_id,
          model_id
        })(options.session)
      : await withSession(async (session) => {
          return getPromotionCodeV2({
            store_id,
            product_id,
            apply_count,
            company_id,
            promotion_code_id,
            model_id
          })(session);
        });
    promotionCode &&
      checkStockOfProduct({
        promotion: promotionCode.promotion,
        product_id,
        model_id,
        isDecreaseApplyCount: promotionCode.apply_count < promotionCode.prevApplyCount
      });
    console.log('PROMOTION CODE', promotionCode);
    return promotionCode;
  } catch (err) {
    logger.error(err);
    return {};
  }
}

function createPromotionCode(promotion) {
  if (promotion) {
    let currentTime = new Date().getTime();
    return promotion.code + '-' + currentTime.toString(36).toUpperCase();
  } else return null;
}

function markUsed(promotionCodeIds, options) {
  return promotionCodeModel
    .updateMany({ _id: { $in: promotionCodeIds } }, { status: 'used' }, options)
    .exec();
}

async function checkStockOfProduct({ promotion, product_id, model_id, isDecreaseApplyCount }) {
  if (!promotion || !promotion.products) return;
  const productPromotion = promotion.products.id(product_id);
  const modelPromotion = productPromotion.models.find(
    (model) => model.model_id.toString() === model_id.toString()
  );
  if (isDecreaseApplyCount || modelPromotion.remain === 0)
    await companyLimitService.update(promotion.company_id);
}

async function checkActiveCode(promotion_code_id) {
  const promotionCode = await globalPromotionCodeService.findActive(promotion_code_id, {
    populate: {
      path: 'promotion'
    }
  });
  if (
    promotionCode &&
    promotionCode.promotion &&
    promotionCode.promotion.converter_status === 'active'
  ) {
    return true;
  }
  return false;
}

/**
 *
 * @param {import('mongoose').FilterQuery} query
 * @param {any} select
 * @param {import('mongoose').QueryFindOptions} options
 */
const find = async (query, select, options) => {
  return await promotionCodeModel.find(query, select, options);
};

export const promotionCodeServiceV2 = {
  autoGetV2,
  markUsed,
  find,
  checkActiveCode
};
