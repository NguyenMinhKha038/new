import Model from './promotion.model';
import { logger, BaseError } from '../../commons/utils';
import productService from '../product/product.service';
import companyLimitService from '../company/company-limit.service';
import notificationService from '../notification/notification.service';
import companyService from '../company/company.service';

async function create(data) {
  try {
    return await Model.create(data);
  } catch (err) {
    logger.error(err);
    throw new BaseError({
      statusCode: 500,
      error: "can't create promotion from search project",
      errors: err
    });
  }
}

async function find({ query, options = {}, limit, skip, sort = {}, populate, select }) {
  try {
    if (typeof select === 'string') {
      select = 'status ' + select;
    }
    return await Model.find(query, select, { populate, limit, skip, sort, ...options }).lean();
  } catch (err) {
    logger.error(err);
    throw new BaseError({
      statusCode: 500,
      error: "can't find promotion from search project",
      errors: err
    });
  }
}

async function mFind(...params) {
  return Model.find(...params);
}

async function rawFind(query, select, options) {
  try {
    if (typeof select === 'string') {
      select = 'status ' + select;
    }
    const action = Model.find(query, select, { ...options });
    const resList = await action;
    return resList;
  } catch (err) {
    logger.error(err);
    throw new BaseError({
      statusCode: 500,
      error: "can't find promotion from search project",
      errors: err
    });
  }
}
/**
 *
 * @param {string} id
 * @param {any} select
 * @param {import('mongoose').QueryFindBaseOptions} options
 */
async function findById(id, select, options) {
  try {
    return await Model.findById(id, select, options);
  } catch (err) {
    logger.error(err);
    throw new BaseError({
      statusCode: 500,
      error: "can't find promotion by id from search project",
      errors: err
    });
  }
}

/**
 *
 * @param {import('mongoose').FilterQuery} query
 * @param {any} select
 * @param {import('mongoose').QueryFindBaseOptions} options
 */
async function findOne(query, select, options) {
  try {
    return await Model.findOne(query, select, options);
  } catch (err) {
    logger.error(err);
    throw new BaseError({
      statusCode: 500,
      error: "can't find promotion from search project",
      errors: err
    });
  }
}

async function findActiveV2(query, select, options) {
  return await Model.findOne(
    {
      ...query,
      expire_at: { $gte: new Date() },
      start_at: { $lte: new Date() },
      status: 'active'
    },
    select,
    options
  );
}
/**
 *
 * @param {import('mongoose').FilterQuery} query
 * @param {any} select
 * @param {import('mongoose').QueryFindBaseOptions} options
 */
async function findActive(query, select, options) {
  return await Model.findOne(
    {
      ...query,
      expire_at: { $gte: new Date() },
      start_at: { $lte: new Date() },
      status: 'active',
      $or: [{ remain: { $gt: 0 } }, { unlimit: true }]
    },
    select,
    options
  );
}

/**
 *
 * @param {string} id
 * @param {*} update
 */
async function findByIdAndUpdate(id, update) {
  try {
    return await Model.findByIdAndUpdate(id, update, { new: true });
  } catch (err) {
    logger.error(err);
    throw new BaseError({
      statusCode: 500,
      error: "can't update promotion from search project",
      errors: err
    });
  }
}

async function findOneAndUpdate(query, update) {
  try {
    return await Model.findOneAndUpdate(query, update, { new: true });
  } catch (err) {
    logger.error(err);
    throw new BaseError({
      statusCode: 500,
      error: "can't update promotion from search project",
      errors: err
    });
  }
}

async function findOneAndDelete(query) {
  try {
    return await Model.findOneAndDelete(query);
  } catch (err) {
    logger.error(err);
    throw new BaseError({
      statusCode: 500,
      error: "can't delete promotion from search project",
      errors: err
    });
  }
}

async function count(query) {
  try {
    return await Model.countDocuments(query);
  } catch (err) {
    logger.error(err);
    throw new BaseError({ statusCode: 500, error: "can't count", errors: err });
  }
}

async function updateMaxRefund({ company_id }) {
  const promotion = await Model.findOne({
    company_id,
    expire_at: { $gte: new Date() },
    start_at: { $lte: new Date() },
    remain: { $gt: 0 }
  });
  if (promotion) {
    const { max_price, max_refund, max_discount } = await getMaxRefund(
      promotion.product_ids,
      promotion.refund,
      promotion.value
    );
    promotion.max_product_price = max_price;
    promotion.max_product_refund = max_refund;
    promotion.max_product_discount = max_discount;
    promotion.save();
  }
  await companyLimitService.update(company_id);
}

async function getMaxRefund(product_ids, refund_rate, discount_rate) {
  const [productMaxPrice, productMaxRefund] = await Promise.all([
    productService.findOne(
      { _id: { $in: product_ids }, status: 'approved' },
      'price refund refund_rate',
      { sort: '-price' }
    ),
    productService.findOne(
      { _id: { $in: product_ids }, status: 'approved' },
      'price refund refund_rate',
      { sort: '-refund' }
    )
  ]);
  if (!productMaxPrice) return { max_discount: 0, max_price: 0, max_refund: 0 };
  if (
    productMaxPrice.refund + productMaxPrice.price * refund_rate >
    productMaxRefund.refund + productMaxRefund.price * refund_rate
  )
    return {
      max_price: productMaxPrice.price,
      max_discount: productMaxPrice.price * discount_rate,
      max_refund: productMaxRefund.refund + productMaxPrice.price * refund_rate
    };
  return {
    max_price: productMaxPrice.price,
    max_discount: productMaxPrice.price * discount_rate,
    max_refund: productMaxRefund.refund + productMaxRefund.price * refund_rate
  };
}

async function updateStatistic(
  promotion_id,
  discountVal = 0,
  refundVal = 0,
  paymentVal = 0,
  totalUses = 0
) {
  try {
    await Model.findByIdAndUpdate(promotion_id, {
      $inc: {
        total_discount: discountVal,
        total_refund: refundVal,
        total_payment: paymentVal,
        total_uses: totalUses
      }
    });
  } catch (err) {
    logger.error(err);
    throw new BaseError({
      statusCode: 500,
      error: 'update statistic promotion faild',
      errors: err
    });
  }
}

async function aggregate(query) {
  try {
    return await Model.aggregate(query);
  } catch (err) {
    logger.error(err);
    throw new BaseError({
      statusCode: 500,
      error: 'aggregate promotin faild',
      errors: err
    });
  }
}

async function sendNotification(promotion) {
  const followedUsers = await companyService.findReaction({
    query: { company_id: promotion.company_id, follow: true },
    limit: 0
  });
  if (followedUsers.length) {
    const user_ids = followedUsers.map((follow) => follow.user_id);
    notificationService.createAndSendMultiple({
      user_ids,
      type: 'user_new_promotion',
      message: ` ${promotion.name} - ${promotion.description}`,
      title: `Khuyến mãi mới mà bạn quan tâm`,
      object_id: promotion._id.toString(),
      onModel: 's_promotion'
    });
  }
}
async function updateById(id, update) {
  return await Model.findByIdAndUpdate(id, update);
}
export default {
  updateById,
  count,
  create,
  find,
  mFind,
  findById,
  findOne,
  findOneAndUpdate,
  findOneAndDelete,
  getMaxRefund,
  updateMaxRefund,
  updateStatistic,
  aggregate,
  findByIdAndUpdate,
  findActive,
  findActiveV2,
  rawFind,
  sendNotification
};
