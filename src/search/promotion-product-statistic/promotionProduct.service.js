import Model from './promotionProduct.model';
import { logger, BaseError } from '../../commons/utils';

// Model.find()
//   .populate('promotion_id')
//   .then(async data => {
//     console.log('DATA', data);
//     for (let i = 0; i < data.length; i++) {
//       const item = data[i];
//       const res = await Model.findOneAndUpdate(
//         { _id: item._id },
//         { company_id: item.promotion_id.company_id }
//       );
//       console.log('INDEX', res, i);
//     }
//   });

async function create(data) {
  try {
    return await Model.create(data);
  } catch (err) {
    logger.error(err);
    throw new BaseError({
      statusCode: 500,
      error: "can't create promotion product statistic",
      errors: err
    });
  }
}

async function insertMany(data) {
  try {
    return await Model.insertMany(data);
  } catch (err) {
    logger.error(err);
    throw new BaseError({
      statusCode: 500,
      error: "can't create promotion product statistic",
      errors: err
    });
  }
}

async function find({
  query,
  options = {},
  limit,
  skip,
  sort = {},
  populate = [{ path: 'none-path' }]
}) {
  try {
    return await Model.find(query, options)
      .populate(populate)
      // .populate('store_ids')
      .limit(limit)
      .skip(skip)
      .sort(sort)
      .lean();
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
 * @description update multiple product detail in promotion
 * @param {string} promotion_id
 * @param {PromotionProductStatisticUpdate[]} updateData
 */
async function updateStatistic(promotion_id, updateData) {
  try {
    const bulkUpdate = updateData.map((item) => {
      const {
        company_id,
        discount,
        payment,
        product_storing_id,
        quantity,
        refund,
        store_id,
        product_id
      } = item;
      return {
        updateOne: {
          filter: {
            promotion_id,
            product_storing_id,
            store_id,
            product_id,
            company_id
          },
          update: {
            $inc: {
              total_discount: discount,
              total_refund: refund,
              total_payment: payment,
              total_quantity: quantity
            }
          },
          upsert: true
        }
      };
    });
    Model.bulkWrite(bulkUpdate);
  } catch (err) {
    logger.error(err);
    throw new BaseError({
      statusCode: 500,
      error: 'update promotion product statistic fail',
      errors: err
    });
  }
}

async function count(query) {
  return await Model.countDocuments(query);
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

export default {
  create,
  find,
  updateStatistic,
  count,
  insertMany
};
