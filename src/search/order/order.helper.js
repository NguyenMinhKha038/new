/* eslint-disable prettier/prettier */
import { Promise } from 'bluebird';
import { promotionCodeServiceV2 } from '../promotion-code/v2/promotion-code.service';
import productStoringService from '../product-storing/product-storing.service';
import promotionService from '../promotion/promotion.service';
import globalPromotionCodeService from '../promotion-code/v2/global-promotion-code.service';
import promotionCodeService from '../promotion-code/promotion-code.service';
import { BaseError, errorCode } from '../../commons/utils';
import {
  AccompaniedProductStatuses,
  ModelStatuses
} from '../product-storing/v2/product-storing.config';

const helperV1 = {
  async getPromotionCode() {
    if (this.promotion_code) {
      const promotionCode = await promotionCodeService.findActive(this.promotion_code);
      if (promotionCode) {
        const promotion = promotionCode.promotion_id;
        mergeObject(this, { promotion, is_valid_promotion_code: true });
      } else {
        mergeObject(this, { promotion: null, is_valid_promotion_code: false });
      }
    }
  },
  getPrice() {
    const listProductInPromotion = (this.promotion && this.promotion.product_ids) || [];
    const promotion = this.promotion || {};
    this.products.map((product) => {
      const hasPromotion = listProductInPromotion.includes(product.id);
      //* refund
      // product.refund_rate = product.detail.refund_rate || 0;
      product.refund_rate = hasPromotion ? promotion.refund : product.storing_detail.refund_rate;
      product.refund = Math.round(product.refund_rate * product.storing_detail.price);
      product.total_refund = product.refund * product.quantity;
      //* discount
      product.discount_rate = hasPromotion ? promotion.value : 0;
      product.discount = Math.round(product.storing_detail.price * product.discount_rate);
      product.total_discount = product.discount * product.quantity;
      product.final_price = product.storing_detail.price - (product.discount || 0);
      product.original_price = product.storing_detail.price;
      product.original_total = product.original_price * product.quantity;
      product.total = product.original_total - product.total_discount;
    });
    const total = this.products.reduce(
      (prev, curt) => {
        return {
          total_discount: prev.total_discount + curt.total_discount,
          total_refund: prev.total_refund + curt.total_refund,
          total: prev.total + curt.total,
          original_total: prev.original_total + curt.original_total
        };
      },
      {
        total: 0,
        total_refund: 0,
        total_discount: 0,
        original_total: 0
      }
    );
    total.total += this.transport_fee || 0;
    Object.assign(this, total);
  }
};
const helperV2 = {
  async getPriceV2(mustGotPromotionCode = false) {
    await Promise.map(this.products, async (product) => {
      if (!product.store_id)
        return helperV2.fullFillProduct({ product, hasPromotion: false, promotion: null });
      let promotion;
      if (mustGotPromotionCode) {
        const promotionCode = await promotionCodeServiceV2.autoGetV2({
          product_id: product.id,
          company_id: product.company_id,
          store_id: product.store_id,
          promotion_code_id: product.promotion_code_id,
          promotion,
          apply_count: product.quantity
        });
        product.promotion_code = promotionCode.code;
        product.promotion_id = promotionCode.promotion && promotionCode.promotion._id;
        product.promotion_code_id = promotionCode._id;
        product.applied_promotion_quantity = promotionCode.apply_count || 0;
        promotion = promotionCode.promotion;
      } else {
        promotion = await promotionService.findActiveV2({
          product_ids: product.id,
          store_id: product.store_id
        });
      }
      const productPromotion = promotion && promotion.products.id(product.id);
      product.product_promotion = productPromotion;
      const applyQuantity = helperV2.getQuantity({
        mustGotPromotionCode,
        productPromotion,
        product
      });
      helperV2.fullFillProduct({ product, applyQuantity, promotion });
    });
    const total = this.products.reduce(
      (prev, curt) => {
        return {
          total_discount: prev.total_discount + curt.total_discount,
          total_refund: prev.total_refund + curt.total_refund,
          total: prev.total + curt.total,
          original_total: prev.original_total + curt.original_total
        };
      },
      {
        total: 0,
        total_refund: 0,
        total_discount: 0,
        original_total: 0
      }
    );
    total.total += this.transport_fee || 0;
    Object.assign(this, total);
  },
  getQuantity({ mustGotPromotionCode, productPromotion, product }) {
    if (mustGotPromotionCode) return product.applied_promotion_quantity;
    if (productPromotion) {
      if (productPromotion.unlimited) return product.quantity;
      if (product.applied_promotion_quantity) {
        const applicableQuantity = product.applied_promotion_quantity + productPromotion.remain;
        if (applicableQuantity > product.quantity) return product.quantity;
        else return applicableQuantity;
      }
      return productPromotion.remain < product.quantity
        ? productPromotion.remain
        : product.quantity;
    }
    return 0;
  },
  fullFillProduct({ product, applyQuantity, promotion }) {
    product.applied_promotion_quantity = applyQuantity;
    const appliedQuantity =
      promotion && applyQuantity ? product.applied_promotion_quantity : product.quantity;
    product.promotion_id = promotion && promotion._id;
    product.refund_rate = applyQuantity ? promotion.refund : product.storing_detail.refund_rate;
    product.original_refund_rate = product.storing_detail.refund_rate;
    product.refund = Math.round(product.refund_rate * product.storing_detail.price);
    product.original_refund = Math.round(
      product.original_refund_rate * product.storing_detail.price
    );
    product.total_refund =
      product.refund * appliedQuantity +
      (product.quantity - appliedQuantity) * product.original_refund;
    //* discount
    product.discount_rate = applyQuantity ? promotion.value : 0;
    product.discount = Math.round(product.storing_detail.price * product.discount_rate);
    product.total_discount = product.discount * appliedQuantity;
    product.final_price = product.storing_detail.price - (product.discount || 0);
    product.original_price = product.storing_detail.price;
    product.original_total = product.original_price * product.quantity;
    product.total = product.original_total - product.total_discount;
  }
};

const helperV3 = {
  async helperAccompaniedProduct({ accompanied_products = [], productStoring, options }) {
    const { session } = options;
    let accompaniedProductPrice = 0;
    accompanied_products.length &&
      (await Promise.map(accompanied_products, async (product) => {
        await productStoringService.findActive({
          _id: product.product_storing_id,
          options: { session }
        });
        const existAccompaniedProduct = productStoring.accompanied_products.find(
          (item) =>
            item.product_storing_id.toString() == product.product_storing_id.toString() &&
            item.status === AccompaniedProductStatuses.Active
        );
        if (!existAccompaniedProduct) {
          throw new BaseError({
            statusCode: 400,
            error: errorCode.client,
            errors: {
              accompanied_product: errorCode['client.accompaniedProductNotFound']
            }
          });
        }
        accompaniedProductPrice += existAccompaniedProduct.price * product.quantity;
      }));

    return accompaniedProductPrice;
  },
  async getPriceV3({
    mustGotPromotionCode = false,
    options = {},
    isChangePromotionQuantity = true,
    cart = { isInCart: false, options: [] }
  } = {}) {
    const { session } = options;

    await Promise.mapSeries(this.products, async (product) => {
      if (!product.store_id) return helperV3.fullFillProduct({ product, applyQuantity: 0 });
      if (cart.isInCart) {
        const { model_id, accompanied_products = [], quantity } = product;
        const productOptions = cart.options;
        const productStoring = await productStoringService.findActive({
          _id: product.product_storing_id,
          populate: 'product options.option',
          options: { session }
        });
        const validModel = productStoring.model_list.find(
          (model) =>
            model._id.toString() === model_id.toString() && model.status === ModelStatuses.Active
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

        let price = validModel.price;
        let accompaniedProductPrice;

        if (accompanied_products.length) {
          accompaniedProductPrice = await helperV3.helperAccompaniedProduct({
            accompanied_products,
            productStoring,
            options: { session }
          });
          product.accompanied_product_price = accompaniedProductPrice;
        }
        if (productOptions && productOptions.length) {
          productOptions.forEach((option) => {
            const productStoringOption = productStoring.options.find(
              (item) =>
                item.option_id.toString() === option.type_option_id.toString() &&
                item.status === 'active'
            );
            if (!productStoringOption) {
              throw new BaseError({
                statusCode: 400,
                error: errorCode.client,
                errors: {
                  selection: errorCode['client.sellingSelectionNotFound']
                }
              });
            }
            const optionItem = productStoringOption.option.options.find(
              (item) =>
                item._id.toString() === option.option_id.toString() && item.status === 'active'
            );
            if (!optionItem) {
              throw new BaseError({
                statusCode: 400,
                error: errorCode.client,
                errors: {
                  selectionOption: errorCode['client.sellingSelectionOptionNotFound']
                }
              });
            }
            price += optionItem.price;
          });
        }
        product.storing_detail.price = price;
        product.storing_detail.discount = validModel.discount;
        product.storing_detail.discount_rate = validModel.discount_rate;
        product.storing_detail.refund_rate = validModel.refund_rate;
        product.storing_detail.total_refund_rate = validModel.total_refund_rate;
      }
      const {
        hasUseableGlobalPromotion,
        hasUseablePromotion,
        productStoring
      } = await helperV3.checkPromotion(product, { session });

      const { globalPromotion } = await helperV3.applyGlobalPromotion(
        {
          hasUseableGlobalPromotion,
          product,
          mustGotPromotionCode,
          productStoring
        },
        { session }
      );
      const { promotion, modelPromotion } = await helperV3.applyPromotion(
        {
          hasUseableGlobalPromotion,
          hasUseablePromotion,
          product,
          mustGotPromotionCode
        },
        { session }
      );
      if (!hasUseablePromotion && !hasUseableGlobalPromotion) {
        product.applied_promotion_quantity = 0;
      }
      const applyQuantity = helperV3.getQuantity({
        mustGotPromotionCode,
        modelPromotion,
        product,
        hasUseableGlobalPromotion,
        isChangePromotionQuantity
      });
      helperV3.fullFillProduct({ product, promotion, globalPromotion, applyQuantity });
      if (product.accompanied_product_price) {
        product.total += product.accompanied_product_price;
      }
    });
    const total = this.products.reduce(
      (prev, curt) => {
        return {
          total_discount: prev.total_discount + curt.total_discount,
          total_refund: prev.total_refund + curt.total_refund,
          total: prev.total + curt.total,
          original_total: prev.original_total + curt.original_total
        };
      },
      {
        total: 0,
        total_refund: 0,
        total_discount: 0,
        original_total: 0
      }
    );
    total.total += this.transport_fee || 0;
    Object.assign(this, total);
  },
  fullFillProduct({ product, applyQuantity, promotion, globalPromotion }) {
    product.original_price = product.storing_detail.price;
    product.original_total = product.original_price * product.quantity;

    if (!promotion) {
      product.promotion_id = undefined;
    }
    if (!globalPromotion) {
      product.global_promotion_id = undefined;
    }
    product.applied_promotion_quantity = applyQuantity;

    let appliedQuantity;
    if (globalPromotion || promotion) {
      appliedQuantity = product.applied_promotion_quantity;
    } else {
      appliedQuantity = product.quantity;
    }
    // set default value for these field
    product.refund_rate = product.storing_detail.refund_rate;
    product.discount_rate = 0;
    product.discount = 0;
    product.total_discount = 0;
    product.original_refund_rate = product.storing_detail.refund_rate;
    product.original_refund = Math.round(
      product.original_refund_rate * product.storing_detail.price
    );

    // fullfill if has global-promotion or just has promotion
    if (globalPromotion) {
      helperV3.fullFillProductWithGlobalPromotion({
        product,
        globalPromotion,
        applyQuantity,
        appliedQuantity
      });
    }
    if (!globalPromotion && promotion) {
      helperV3.fullFillProductWithPromotion({ product, promotion, applyQuantity, appliedQuantity });
    }

    // fullfill common value
    product.refund = Math.round(product.refund_rate * product.storing_detail.price);
    product.total_refund =
      product.refund * appliedQuantity +
      (product.quantity - appliedQuantity) * product.original_refund;
    product.final_price = product.storing_detail.price - (product.discount || 0);
    product.total = product.original_total - product.total_discount;
  },

  // this function fullfill product if has global promotion
  fullFillProductWithGlobalPromotion({ product, globalPromotion, applyQuantity, appliedQuantity }) {
    product.global_promotion_id = globalPromotion._id;
    product.refund_rate = globalPromotion.refund || 0;
    product.discount_rate = applyQuantity ? globalPromotion.value : 0;
    product.discount = Math.round(product.storing_detail.price * product.discount_rate);
    if (globalPromotion.value_type === 'money') {
      product.discount = globalPromotion.value;
    }
    if (product.total_discount > globalPromotion.max_discount) {
      product.discount = globalPromotion.max_discount;
    }
    product.total_discount = product.discount * appliedQuantity;
  },

  // this function fullfill product if has promotion
  fullFillProductWithPromotion({ product, promotion, applyQuantity, appliedQuantity }) {
    product.promotion_id = promotion._id;
    product.refund_rate = promotion.refund || 0;
    product.discount_rate = applyQuantity ? promotion.value : 0;
    product.discount = Math.round(product.storing_detail.price * product.discount_rate);
    if (product.discount > promotion.max_product_discount) {
      product.discount = promotion.max_product_discount;
    }
    product.total_discount = product.discount * appliedQuantity;
  },
  /**
   * @description this product is from order
   * @param {*} product
   * @param options
   */
  async checkPromotion(product, options = {}) {
    try {
      const { model_id } = product;
      const { session } = options;

      const productStoring = await productStoringService.findActive({
        status: 'active',
        product_id: product.id,
        store_id: product.store_id,
        options: {
          session,
          populate: [
            {
              path: 'global_promotion_registration',
              match: {
                status: 'active',
                start_at: { $lte: new Date() },
                expire_at: { $gte: new Date() },
                global_promotion_status: 'active'
              },
              populate: {
                path: 'global_promotion',
                match: {
                  status: 'active'
                }
              }
            },
            {
              path: 'promotion',
              match: {
                status: 'active',
                start_at: { $lte: new Date() },
                expire_at: { $gte: new Date() },
                store_id: product.store_id
              }
            },
            {
              path: 'product'
            }
          ]
        }
      });
      let hasUseableGlobalPromotion = false;
      let hasUseablePromotion = false;
      if (
        productStoring.global_promotion_registration &&
        productStoring.global_promotion_registration.global_promotion &&
        helperV3.canApplyGlobalPromotion(
          product,
          productStoring.global_promotion_registration.global_promotion
        )
      ) {
        hasUseableGlobalPromotion = true;
      }
      if (productStoring.promotion) {
        const productPromotion = productStoring.promotion.products.id(productStoring.product_id); //chu7a hieu63
        const modelPromotion = productPromotion.models.find(
          (model) => model.model_id.toString() === model_id.toString()
        );
        if (modelPromotion) {
          hasUseablePromotion = true;
        }
      }
      return { hasUseableGlobalPromotion, hasUseablePromotion, productStoring };
    } catch (error) {
      return {};
    }
  },

  async applyGlobalPromotion(
    { hasUseableGlobalPromotion, product, mustGotPromotionCode, productStoring },
    options = {}
  ) {
    try {
      const { model_id } = product;
      const { session } = options;
      if (!hasUseableGlobalPromotion) {
        return {};
      }
      if (!mustGotPromotionCode) {
        return { globalPromotion: productStoring.global_promotion_registration.global_promotion };
      }
      const globalPromotionCode = await globalPromotionCodeService.autoGet(
        {
          product_storing_id: product._id,
          model_id,
          apply_count: product.quantity,
          global_promotion_code_id: product.global_promotion_code_id
        },
        { session }
      );
      product.global_promotion_code = globalPromotionCode.code;
      product.global_promotion_id = globalPromotionCode && globalPromotionCode.global_promotion_id;
      product.global_promotion_code_id = globalPromotionCode._id;
      product.applied_promotion_quantity = globalPromotionCode.apply_count || 0;
      const globalPromotion = globalPromotionCode.global_promotion;
      return { globalPromotion };
    } catch (error) {
      console.log('Global Promotion', error);
      return {};
    }
  },

  async applyPromotion(
    { hasUseablePromotion, hasUseableGlobalPromotion, product, mustGotPromotionCode },
    options = {}
  ) {
    try {
      const { model_id } = product;
      const { session } = options;
      if (!hasUseablePromotion) {
        return {};
      }
      let promotion = await promotionService.findActiveV2(
        {
          product_ids: product.id,
          store_id: product.store_id
        },
        null,
        { session }
      );
      if (!mustGotPromotionCode) {
        const productPromotion = promotion && promotion.products.id(product.id);
        const modelPromotion = productPromotion.models.find(
          (model) => model.model_id.toString() === model_id.toString()
        );
        return { promotion, modelPromotion };
      }
      const autoGetQuery = {
        product_id: product.id,
        model_id,
        company_id: product.company_id,
        store_id: product.store_id,
        promotion_code_id: product.promotion_code_id,
        promotion
      };
      if (
        hasUseableGlobalPromotion &&
        product.promotion_code_id &&
        // promo checkActiveCode(product.promotion_code_id) &&
        !promotion.unlimit
      ) {
        await promotionCodeServiceV2.autoGetV2(
          {
            ...autoGetQuery,
            apply_count: 0
          },
          { session }
        );
        return {};
      }
      if (hasUseableGlobalPromotion) {
        return {};
      }
      const promotionCode = await promotionCodeServiceV2.autoGetV2(
        {
          ...autoGetQuery,
          apply_count: product.quantity
        },
        { session }
      );
      console.log("code",promotionCode.code)
      product.promotion_code = promotionCode.code;
      product.promotion_id = promotionCode.promotion && promotionCode.promotion._id;
      product.promotion_code_id = promotionCode._id;
      product.applied_promotion_quantity = promotionCode.apply_count || 0;
      promotion = promotionCode.promotion;
      const productPromotion = promotion && promotion.products.id(product.id);
      const modelPromotion = productPromotion.models.find(
        (model) => model.model_id.toString() === model_id.toString()
      );
      return { promotion, modelPromotion };
    } catch (error) {
      console.log('Apply Promotion', error);
      return {};
    }
  },
  getQuantity({
    mustGotPromotionCode,
    modelPromotion,
    product,
    hasUseableGlobalPromotion,
    isChangePromotionQuantity
  }) {
    if (hasUseableGlobalPromotion) return product.quantity;
    if (mustGotPromotionCode) return product.applied_promotion_quantity;
    if (modelPromotion) {
      if (modelPromotion.unlimited) return product.quantity;
      if (product.applied_promotion_quantity) {
        if (!isChangePromotionQuantity) {
          if (modelPromotion.remain > product.quantity) return product.quantity;
          return product.applied_promotion_quantity;
        }
        const applicableQuantity = product.applied_promotion_quantity + modelPromotion.remain;
        if (applicableQuantity > product.quantity) return product.quantity;
        else return applicableQuantity;
      }
      return modelPromotion.remain < product.quantity ? modelPromotion.remain : product.quantity;
    }
    return 0;
  },
  canApplyGlobalPromotion(product, globalPromotion) {
    const originalPrice = product.storing_detail && product.storing_detail.price;
    const originalTotal = originalPrice * product.quantity;
    if (originalTotal < globalPromotion.min_order_value) {
      return false;
    }
    return true;
  }
};

export default {
  v1: helperV1,
  v2: helperV2,
  v3: helperV3
};
