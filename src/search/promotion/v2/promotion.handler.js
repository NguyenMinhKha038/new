/* eslint-disable prettier/prettier */
import { BaseError, errorCode } from '../../../commons/utils';
import productStoringService from '../../product-storing/product-storing.service';
import storeService from '../../store/store.service';
import promotionService from '../promotion.service';
import productStoringV2Service from '../../product-storing/v2/product-storing.service';
import { Promise } from 'bluebird';
import promotionConfig from '../promotion.config';

function createCode() {
  let currentTime = new Date().getTime() % 1000000000;
  return currentTime.toString(36).toUpperCase();
}

async function handleErrorAndGetMaxRefund({
  store_id,
  product_ids,
  start_at,
  expire_at,
  company_id,
  products,
  refund_rate,
  discount_rate
}) {
  if (!store_id) {
    throw new BaseError({
      statusCode: 500,
      error: errorCode.server,
      errors: { store_id: errorCode['any.empty'] }
    }).addMeta({ message: 'store id is empty' });
  }
  
  const store = await storeService.findOne({ _id: store_id, company_id });
  if (!store) {
    throw new BaseError({
      statusCode: 400,
      error: errorCode.client,
      errors: { store_id: errorCode['client.storeNotExist'] }
    }).addMeta({ message: 'store is not existed' });
  }

  const productStoring = await productStoringService.find({
    query: { store_id, company_id, product_id: { $in: product_ids } },
    select: 'product_id'
  });
  if (!productStoring || productStoring.length !== product_ids.length) {
    const errors = getNotExistedIndex(product_ids, productStoring);
    throw new BaseError({
      statusCode: 400,
      error: errorCode.client,
      errors: { products: errors }
    }).addMeta({ message: 'product is not existed in store' });
  }
  let max_price_price = 0;
  let max_price_refund = 0;
  let max_refund_price = 0;
  let max_refund_refund = 0;
  products &&
    (await Promise.map(products, async (product) => {
      const productStoring = await productStoringV2Service.findActiveV2({
        product_id: product.product_id,
        store_id
      });
      product.model_ids = [];
      product.model_list = productStoring.model_list;
      if (product.model_scope === 'all') {
        const modelIds = productStoring.model_list.map((model) => model._id);
        const modelList = productStoring.model_list.map((model) => ({
          model_id: model._id,
          model_images: model.images,
          unlimited: product.unlimited,
          total: !product.unlimited ? product.total : null,
          remain: !product.unlimited ? product.total : null
        }));
        product.model_ids = modelIds;
        product.models = modelList;
      }
      product.models.map((model) => {
        const validModel = productStoring.model_list.find(
          (item) => item.model_id.toString() === model.model_id.toString()
        );
        if (!validModel) {
          throw new BaseError({
            statusCode: 400,
            error: errorCode.client,
            errors: {
              model: errorCode['client.invalidProductModel']
            }
          });
        }
        model.model_images = validModel.images;
        if (!product.model_ids.includes(validModel._id)) {
          product.model_ids.push(validModel._id);
        }

        if (validModel.price > max_price_price) {
          max_price_price = validModel.price;
          max_price_refund = validModel.refund;
        }
        if (validModel.refund > max_refund_refund) {
          max_refund_price = validModel.price;
          max_refund_refund = validModel.refund;
        }
      });
    }));
  const promotionList = await promotionService.rawFind(
    {
      company_id,
      store_id,
      product_ids: { $in: product_ids },
      status: 'active',
      $or: [
        {
          expire_at: { $gte: start_at },
          start_at: { $lte: start_at }
        },
        {
          start_at: { $lte: expire_at },
          expire_at: { $gte: expire_at }
        },
        {
          start_at: { $gte: start_at },
          expire_at: { $lte: expire_at }
        }
      ]
    },
    'name product_ids store_id company_id start_at expire_at products'
  );
  if (promotionList.length) {
    const errors = {};
    promotionList.map((promotion) => {
      promotion.products.map((product, index) => {
        let errorFlag = false;
        if (!product_ids.includes(product.product_id.toString())) {
          return;
        }
        const promotionProduct = products.find(
          (product) => product.product_id.toString() === product.product_id.toString()
        );
        if (promotionProduct.model_scope === 'all' || product.model_scope === 'all') {
          errors[index] = {
            errors: {
              product_id: errorCode['client.promotion.productAlreadyExisted']
            },
            message: 'product already existed in other one',
            promotion_id: promotion._id,
            promotion_name: promotion.name,
            start_at: promotion.start_at,
            expire_at: promotion.expire_at,
            product_id: product.product_id
          };
          errorFlag = true;
        }
        const existedModelPromotionId = promotionProduct.model_ids.find((model_id) =>
          product.model_ids.includes(model_id.toString())
        );
        if (existedModelPromotionId && !errorFlag) {
          errors[index] = {
            errors: {
              product_id: errorCode['client.promotion.productAlreadyExisted']
            },
            message: 'product already existed in other one',
            promotion_id: promotion._id,
            promotion_name: promotion.name,
            start_at: promotion.start_at,
            expire_at: promotion.expire_at,
            product_id: product.product_id,
            model_id: existedModelPromotionId
          };
        }
      });
    });
    if (Object.keys(errors).length) {
      throw new BaseError({
        statusCode: 400,
        error: errorCode.client,
        errors: { promotion: errorCode['client.promotion.productAlreadyExisted'] }
      }).addMeta({
        message: 'product already existed in other promotion',
        already_promotion: promotionList,
        duplicate_product: errors
      });
    }
  }

  if (
    max_price_refund + max_price_price * refund_rate >
    max_refund_refund + max_refund_price * refund_rate
  ) {
    return {
      max_price: max_price_price,
      max_discount: max_price_price * discount_rate,
      max_refund: max_refund_refund + max_price_price * refund_rate
    };
  }
  return {
    max_price: max_price_price,
    max_discount: max_price_price * discount_rate,
    max_refund: max_refund_refund + max_refund_price * refund_rate
  };
}

/**
 *
 * @param {string[]} requestList
 * @param {{product_id: string}[]} mappingList
 * @returns {any}
 */
function getNotExistedIndex(requestList, mappingList) {
  const errors = {};
  requestList.forEach((item, index) => {
    const existedIndex = mappingList.findIndex(
      (pTem) => pTem.product_id.toString() === item.toString()
    );
    if (existedIndex === -1) {
      errors[index] = { product_id: errorCode['client.promotion.productNotFound'] };
    }
  });
  return errors;
}

function getDuplicateProductIndex(productList, promotionList) {
  const errors = {};
  productList.forEach((item, index) => {
    promotionList.forEach((promotion) => {
      const duplicateIndex = promotion.product_ids.findIndex(
        (product_id) => product_id.toString() === item.toString()
      );
      if (duplicateIndex > -1) {
        errors[index] = {
          errors: {
            product_id: errorCode['client.promotion.productAlreadyExisted']
          },
          message: 'product already existed in other one',
          promotion_id: promotion._id,
          promotion_name: promotion.name,
          start_at: promotion.start_at,
          expire_at: promotion.expire_at,
          product_id: item
        };
      }
    });
  });
  return errors;
}

/**
 *
 * @param {{_id: string, name: string, total_used}[]} baseProductList
 * @param {{product_id: string, status: string, apply_count}[]} promotionCodeList
 * @returns {any}
 */
const statisticUsingPromotionCode = (baseProductList, promotionCodeList) => {
  if (!baseProductList || !promotionCodeList) {
    throw new BaseError({
      statusCode: 500,
      error: errorCode.server,
      errors: 'cannot group products of promotion, product list not found'
    });
  }
  baseProductList = [...baseProductList];
  baseProductList.forEach((product) => {
    const { _id, total_used } = product;
    product.models.map((model) => {
      let totalUsed = total_used || 0;
      let totalPending = 0;
      promotionCodeList.forEach((promotionCode) => {
        const { product_id, apply_count, status, model_id } = promotionCode;
        if (
          _id.toString() === product_id.toString() &&
          model_id.toString() === model.model_id.toString()
        ) {
          if (status === 'active') {
            totalPending += apply_count;
          }
          if (status === 'used') {
            totalUsed += apply_count;
          }
        }
      });

      model.total_used = totalUsed;
      model.total_pending = totalPending;
    });
  });
  return baseProductList;
};
export const promotionHandlerV2 = {
  createCode,
  handleErrorAndGetMaxRefund,
  statisticUsingPromotionCode,
  getDuplicateProductIndex
};
