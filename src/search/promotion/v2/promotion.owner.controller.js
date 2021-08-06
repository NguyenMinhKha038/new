/* eslint-disable prettier/prettier */
import { BaseError, errorCode, BaseResponse, withSafety } from '../../../commons/utils';
import { CompanyActions } from '../../company-activity/company-activity.config';
import companyActivityService from '../../company-activity/company-activity.service';
import companyLimitService from '../../company/company-limit.service';
import productStoringService from '../../product-storing/product-storing.service';
import { promotionCodeServiceV2 } from '../../promotion-code/v2/promotion-code.service';
import promotionService from '../promotion.service';
import { promotionHandlerV2 } from './promotion.handler';

const {
  handleErrorAndGetMaxRefund,
  statisticUsingPromotionCode,
  createCode,
  getDuplicateProductIndex
} = promotionHandlerV2;

async function create(req, res, next) {
  try {
    let code = createCode();
    req.validate.start_at = new Date(req.validate.start_at);
    req.validate.expire_at = new Date(req.validate.expire_at);
    console.log("Day",new Date())
    console.log("start",req.validate.start_at)
    console.log("expire",req.validate.expire_at)
    const {
      product_scope,
      store_id,
      expire_at,
      start_at,
      refund,
      value,
      unlimit,
      // products,
      total
    } = req.validate;
    // let product_ids = req.validate.product_ids;
    let { product_ids, products } = req.validate;
    // let remain = -1

    const company = req.company;
    const company_id = company._id;
    if (company.status !== 'approved') {
      return next(
        new BaseError({
          statusCode: 400,
          error: errorCode.authorization,
          errors: { company: errorCode['client.companyNotApproved'] }
        }).addMeta({ message: 'company is not approved' })
      );
    }
    if (product_scope === 'all') {
      const productList = await productStoringService.find({
        query: { store_id, company_id },
        select: 'product_id store_id company_id model_list'
      });
      product_ids = productList.map((item) => item.product_id);
      // if (!unlimit && typeof total === 'number') {
      products = [];
      productList.forEach((item) => {
        const modelList = item.model_list.map((model) => ({
          model_id: model._id,
          model_images: model.images,
          unlimited: unlimit,
          total: !unlimit ? total : null,
          remain: !unlimit ? total : null
        }));
        const modelIds = item.model_list.map((model) => ({
          model_id: model._id
        }));
        const product = !unlimit
          ? {
              _id: item._id,
              product_id: item.product_id,
              total,
              remain: total,
              unlimited: false,
              models: modelList,
              model_ids: modelIds,
              model_scope: 'all'
            }
          : {
              _id: item,
              unlimited: true,
              product_id: item.product_id,
              models: modelList,
              model_ids: modelIds,
              model_scope: 'all'
            };
        products.push(product);
      });
      req.validate.products = products;
      // }
    }
    console.log("length",products.length)
    if (product_scope === 'partial') {
      product_ids = products.map((item) => {
        item._id = item.product_id;
        return item.product_id;
      });
    }
    const { max_price, max_refund, max_discount } = await handleErrorAndGetMaxRefund({
      store_id,
      product_ids,
      start_at,
      expire_at,
      company_id,
      products,
      refund_rate: refund,
      discount_rate: value
    });
    let createdData = {
      ...req.validate,
      product_ids,
      code,
      company_id,
      max_product_refund: max_refund,
      max_product_price: max_price,
      max_product_discount: max_discount
    };
    const promotion = await promotionService.create(createdData);
    console.log("pro",promotion)
    await promotion
      .populate({
        path: 'products.product',
        select: 'name thumbnail price total_refund_rate refund'
      })
      .execPopulate();

    withSafety(() => {
      companyActivityService.implicitCreate(CompanyActions.createPromotion)(req, {
        object_id: promotion._id
      });
    });
    return res.send(new BaseResponse({ statusCode: 201, data: promotion }));
  } catch (err) {
    return next(err);
  }
}

async function update(req, res, next) {
  try {
    if (req.validate.start_at) {
      req.validate.start_at = new Date(req.validate.start_at);
    }
    if (req.validate.expire_at) {
      req.validate.expire_at = new Date(req.validate.expire_at);
    }
    const {
      product_scope,
      store_id,
      expire_at,
      start_at,
      unlimit,
      // products,
      total,
      promotion_id
    } = req.validate;
    // let product_ids = req.validate.product_ids;
    let { products, refund, value } = req.validate;
    let product_ids = [];
    const company = req.company;
    if (company.status !== 'approved') {
      return next(
        new BaseError({
          statusCode: 400,
          error: errorCode.authorization,
          errors: { company: errorCode['client.company.notApproved'] }
        }).addMeta({ message: 'company is not approved' })
      );
    }
    const promotion = await promotionService.findOne({
      company_id: req.company._id,
      _id: promotion_id
    });
    if (!promotion) {
      return next(
        new BaseError({
          statusCode: 200,
          error: errorCode.client,
          errors: { _id: errorCode['client.promotion.notFound'] }
        }).addMeta({ message: 'promotion not found' })
      );
    }
    if (promotion.status !== 'handling') {
      return next(
        new BaseError({
          statusCode: 400,
          error: errorCode.client,
          errors: {
            status: errorCode['client.promotion.cannotEdit']
          }
        }).addMeta({ message: 'cannot edit promotion if status is not "handling"' })
      );
    }

    const company_id = company._id;
    if (product_scope === 'all') {
      const productList = await productStoringService.find({
        query: { store_id, company_id },
        select: 'product_id store_id company_id model_list'
      });
      product_ids = productList.map((item) => item.product_id);
      // if (!unlimit && typeof total === 'number') {
      products = [];
      productList.forEach((item) => {
        const modelList = item.model_list.map((model) => ({
          model_id: model._id,
          model_images: model.images,
          unlimited: unlimit,
          total: !unlimit ? total : null,
          remain: !unlimit ? total : null
        }));
        const modelIds = item.model_list.map((model) => ({ model_id: model._id }));
        const product = !unlimit
          ? {
              _id: item._id,
              product_id: item._id,
              total,
              remain: total,
              unlimited: false,
              model_ids: modelIds,
              models: modelList,
              model_scope: 'all'
            }
          : {
              _id: item,
              unlimited: true,
              product_id: item,
              models: modelList,
              model_ids: modelIds,
              model_scope: 'all'
            };
        products.push(product);
      });
      req.validate.products = products;
      // }
    }
    if (product_scope === 'partial') {
      product_ids = products.map((item) => {
        item._id = item.product_id;
        return item.product_id;
      });
      products.forEach((item) => {
        item.remain = item.total;
      });
    }
    const { max_price, max_refund, max_discount } = await handleErrorAndGetMaxRefund({
      product_ids,
      start_at,
      expire_at,
      store_id,
      company_id,
      products,
      refund_rate: refund,
      discount_rate: value
    });
    let updateData = {
      ...req.validate,
      product_ids,
      max_product_refund: max_refund,
      max_product_price: max_price,
      max_product_discount: max_discount
    };
    for (const key in updateData) {
      promotion[key] = updateData[key];
    }
    await promotion.save();
    await promotion
      .populate({
        path: 'products.product',
        select: 'name thumbnail price total_refund_rate refund'
      })
      .execPopulate();
    withSafety(() => {
      companyActivityService.implicitCreate(CompanyActions.updatePromotion)(req, {
        object_id: promotion._id
      });
    });
    return res.send(new BaseResponse({ statusCode: 201, data: promotion }));
  } catch (error) {
    return next(error);
  }
}

async function updateStatus(req, res, next) {
  try {
    const { status, promotion_id } = req.validate;
    const promotion = await promotionService.findOne({
      _id: promotion_id,
      company_id: req.company._id
    });
    if (!promotion) {
      return next(
        new BaseError({
          statusCode: 400,
          error: errorCode.client,
          errors: { promotion_id: errorCode['client.promotion.notFound'] }
        }).addMeta({ message: 'promotion is not found' })
      );
    }
    const {
      status: promotionStatus,
      store_id,
      product_ids,
      products,
      start_at,
      expire_at
    } = promotion;

    if (promotionStatus === 'active' && status !== 'disabled') {
      return next(
        new BaseError({
          statusCode: 400,
          error: errorCode.client,
          errors: { status: errorCode['any.invalid'] }
        }).addMeta({
          message:
            'status is not valid, the valid value is "disabled" when previous status is not "active"'
        })
      );
    }
    if (promotionStatus === 'disabled') {
      return next(
        new BaseError({
          statusCode: 400,
          error: errorCode.client,
          errors: { status: errorCode['client.promotion.hadBeenDisabled'] }
        }).addMeta({ message: 'cannot update status, promotion had been disabled' })
      );
    }
    if (status === 'active') {
      const startAt = new Date(start_at);
      const expiredAt = new Date(expire_at);
      const query = {
        store_id,
        company_id: req.company._id,
        product_ids: { $in: product_ids },
        status: 'active',
        $or: [
          {
            start_at: { $gte: startAt, $lte: expiredAt }
          },
          {
            expire_at: { $lte: expiredAt, $gte: startAt }
          },
          {
            start_at: { $lte: startAt },
            expire_at: { $gte: expiredAt }
          }
        ]
      };
      const currentPromotions = await promotionService.find({
        query,
        select: 'name start_at expire_at product_ids products'
        // populate: { path: 'products.product', select: 'name thumbnail' }
      });
      if (currentPromotions && currentPromotions.length) {
        const errors = {};
        currentPromotions.map((promotion) => {
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
            already_promotion: currentPromotions,
            duplicate_product: errors
          });
        }
      }
    }
    promotion.status = status;
    await promotion.save();
    await promotion
      .populate({ path: 'products.product', select: 'name thumbnail price' })
      .execPopulate();
    const tenMinutes = 10 * 60 * 1000;
    const startAt = new Date(promotion.start_at);
    const updatedAt = new Date(promotion.updatedAt);
    const period = startAt.getTime() - updatedAt.getTime();
    if (
      promotion.status === 'active' &&
      period < tenMinutes &&
      Math.floor(updatedAt.getMinutes() / 10) === Math.floor(startAt.getMinutes() / 10)
    ) {
      setTimeout(() => {
        companyLimitService.update(promotion.company_id);
        promotionService.updateById(promotion._id, { apply_status: true });
      }, period + 1000);
    }

    withSafety(() => {
      companyActivityService.implicitCreate(CompanyActions.updatePromotion)(req, {
        object_id: promotion._id
      });
      companyLimitService.update(promotion.company_id);
    });
    // const converterPromotion = promotion.toObject();
    // converterPromotion.status = convertPromotionStatus(promotion.status, start_at, expire_at);
    // companyLimitService.update(promotion.company_id);
    return res.send(new BaseResponse({ statusCode: 200, data: promotion }));
  } catch (error) {
    return next(error);
  }
}

async function getById(req, res, next) {
  try {
    const { id } = req.params;
    const { select } = req.query;
    const projection = {};
    if (select) {
      const selectedList = select.split(' ');
      for (const i in selectedList) {
        projection[selectedList[i]] = 1;
      }
      if (!projection.products) {
        projection.products = 1;
      }
    }

    const promotion = await promotionService.findOne(
      { _id: id, company_id: req.company._id },
      projection,
      {
        populate: [
          { path: 'products.product', select: 'name thumbnail price' },
          { path: 'store', select: 'name' }
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
    const productList = statisticUsingPromotionCode(products, promotionCodeList);
    responsePromotion.products = productList;
    return new BaseResponse({ statusCode: 200, data: responsePromotion }).return(res);
  } catch (error) {
    return next(error);
  }
}

export const promotionCompanyControllersV2 = {
  create,
  update,
  updateStatus,
  getById
};
