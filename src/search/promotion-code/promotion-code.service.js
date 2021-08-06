import { logger, BaseError, errorCode, mergeObject } from '../../commons/utils';
import promotionCodeModel from './promotion-code.model';
import promotionAuth from './promotion-code.auth';
import promotionService from '../promotion/promotion.service';
import productStoringService from '../product-storing/product-storing.service';
import promotionModel from '../promotion/promotion.model';
async function create(data) {
  try {
    return await promotionCodeModel.create(data);
  } catch (err) {
    logger.error(err);
    throw new BaseError({
      statusCode: 500,
      error: "can't create promotion code",
      errors: err
    });
  }
}

async function find({
  limit = 0,
  skip = 0,
  sort = {},
  populate = { path: 'no_path' },
  select,
  options,
  ...query
}) {
  try {
    return await promotionCodeModel.find(query, select, {
      limit,
      skip,
      sort,
      populate,
      ...options
    });
  } catch (err) {
    logger.error(err);
    throw new BaseError({
      statusCode: 500,
      error: "can't find promotion code",
      errors: err
    });
  }
}

async function findById(id, populate = [{ path: 'none-path' }]) {
  try {
    return await promotionCodeModel.findById(id).populate(populate);
  } catch (err) {
    logger.error(err);
    throw new BaseError({
      statusCode: 500,
      error: "can't find promotion code",
      errors: err
    });
  }
}

async function findOne(query, populate = [{ path: 'none-path' }]) {
  try {
    return await promotionCodeModel.findOne(query).populate(populate);
  } catch (err) {
    logger.error(err);
    throw new BaseError({
      statusCode: 500,
      error: "can't find promotion code",
      errors: err
    });
  }
}
const findActive = async (code) => {
  const promotionCode = await promotionCodeModel.findOne(
    mergeObject({ code, status: 'active' }),
    null,
    {
      populate: {
        path: 'promotion_id',
        match: { status: 'active' }
      }
    }
  );
  if (!promotionCode || !promotionCode.promotion_id) return null;
  const { start_at, expire_at } = promotionCode.promotion_id;
  try {
    promotionAuth.isUsable(start_at, expire_at);
    if (!promotionCode.promotion_id.unlimit && promotionCode.times_used <= 0)
      throw new BaseError({
        statusCode: 400,
        error: errorCode.client,
        errors: { promotion_code: errorCode['client.codeIsMaxUsed'] }
      });
    return promotionCode;
  } catch (error) {
    return null;
  }
};

async function findOneAndUpdate(query, update, options = {}) {
  try {
    return await promotionCodeModel.findOneAndUpdate(query, update, options);
  } catch (err) {
    logger.error(err);
    throw new BaseError({
      statusCode: 500,
      error: "can't update promotion code",
      errors: err
    });
  }
}
async function updatePopulate({ query, update, options = {} }) {
  try {
    return await promotionCodeModel.findOneAndUpdate(query, update, { ...options, new: true });
  } catch (err) {
    logger.error(err);
    throw new BaseError({
      statusCode: 500,
      error: "can't update promotion code",
      errors: err
    });
  }
}
async function findOneAndDelete(query) {
  try {
    return await promotionCodeModel.findOneAndDelete(query);
  } catch (err) {
    logger.error(err);
    throw new BaseError({
      statusCode: 500,
      error: "can't delete promotion code",
      errors: err
    });
  }
}

async function count(query) {
  try {
    return await promotionCodeModel.countDocuments(query);
  } catch (err) {
    logger.error(err);
    throw new BaseError({
      statusCode: 500,
      error: "can't count promotion codes",
      errors: err
    });
  }
}

async function transact(action) {
  const session = await promotionCodeModel.startSession();
  await session.startTransaction();
  try {
    let code = await action(session);
    await session.commitTransaction();
    await session.endSession();
    return code;
  } catch (error) {
    await session.abortTransaction();
    await session.endSession();
    throw error;
  }
}

const getPromotionCode = (promotion) => async (session) => {
  try {
    if (!promotion.unlimit) {
      promotion = await promotionModel
        .findOneAndUpdate({ _id: promotion._id }, { $inc: { remain: -1 } }, { new: true })
        .session(session);

      if (promotion.remain < 0) {
        throw new BaseError({ statusCode: 400, error: 'cannot get', errors: {} });
      }
      if (promotion.remain === 0) {
        productStoringService.updateByPromotion(promotion.company_id, promotion);
      }
    }
    let code = createPromotionCode(promotion);
    return await promotionCodeModel.create({
      promotion_id: promotion._id,
      company_id: promotion.company_id,
      code,
      status: 'active'
    });
  } catch (err) {
    logger.error(err);
  }
};

async function autoGet({ product_id, promotion }) {
  try {
    promotion =
      promotion ||
      (await promotionService.findActive({
        product_ids: { $in: product_id }
      }));
    if (promotion) {
      return await transact(getPromotionCode(promotion));
    }
    return {};
  } catch (err) {
    logger.error(err);
    return {};
    // throw new BaseError({
    //   statusCode: 500,
    //   error: 'auto get error',
    //   errors: err
    // });
  }
}

function createPromotionCode(promotion) {
  if (promotion) {
    let currentTime = new Date().getTime();
    return promotion.code + '-' + currentTime.toString(36).toUpperCase();
  } else return null;
}

export default {
  create,
  find,
  findActive,
  findById,
  findOne,
  findOneAndUpdate,
  findOneAndDelete,
  count,
  autoGet,
  createPromotionCode,
  updatePopulate
};
