import promotionCodeModel from '../promotion-code.model';
import globalPromotionService from '../../global-promotion/global-promotion.service';
import globalPromotionRegistrationService from '../../global-promotion-registration/global-promotion-registration.service';
import productStoringService from '../../product-storing/product-storing.service';
import promotionCodeService from '../promotion-code.service';
import { BaseError, errorCode, logger, withSession } from '../../../commons/utils';
import { Promise } from 'bluebird';

export default {
  async autoGet(
    { product_storing_id, global_promotion_code_id, apply_count, model_id },
    options = {}
  ) {
    try {
      const { session } = options;
      const isActiveCode = await this.checkActiveGlobalCode(global_promotion_code_id);
      const productStoring = await productStoringService.findActive({
        _id: product_storing_id,
        populate: {
          path: 'product'
        },
        options: { session }
      });
      let globalPromotionCode;
      if (isActiveCode) {
        globalPromotionCode = await promotionCodeService.updatePopulate({
          query: {
            _id: global_promotion_code_id,
            status: 'active',
            product_id: productStoring.product._id,
            model_id
          },
          update: {
            apply_count
          },
          options: { populate: [{ path: 'global_promotion' }, { path: 'product' }], session }
        });
        if (!globalPromotionCode || globalPromotionCode.global_promotion.status !== 'active') {
          throw new BaseError({
            statusCode: 400,
            error: errorCode.client,
            errors: {
              promotion_code: errorCode['client.promotion-code.notFound']
            }
          }).addMeta({
            message: 'Promotion code not exists'
          });
        }
        if (globalPromotionCode.global_promotion.happen_status !== 'running') {
          throw new BaseError({
            statusCode: 400,
            error: errorCode.client,
            errors: {
              promotion: errorCode['client.cannotAccess']
            }
          }).addMeta({
            message: 'Promotion is not available'
          });
        }
        globalPromotionCode = {
          ...globalPromotionCode.toObject(),
          global_promotion: globalPromotionCode.global_promotion,
          product: { ...productStoring.product.toObject(), model_id }
        };
      }
      if (!isActiveCode) {
        const promotionRegistrations = await globalPromotionRegistrationService.find({
          query: {
            product_storing_ids: product_storing_id,
            status: 'active'
          },
          options: { session, populate: { path: 'global_promotion' } }
        });
        let promotion;
        await Promise.map(promotionRegistrations, async (promotionRegistration) => {
          const globalPromotion = promotionRegistration.global_promotion;
          if (
            globalPromotion &&
            globalPromotion.happen_status === 'running' &&
            globalPromotion.status === 'active'
          ) {
            promotion = globalPromotion;
          }
        });
        if (!promotion) {
          return {};
        }
        const code = promotion.code + '-' + new Date().getTime().toString(35).toUpperCase();
        [globalPromotionCode] = await promotionCodeModel.create(
          [
            {
              global_promotion_id: promotion._id,
              product_id: productStoring.product._id,
              company_id: productStoring.company_id,
              store_id: productStoring.store_id,
              model_id: model_id,
              status: 'active',
              code,
              apply_count
            }
          ],
          { session }
        );
        globalPromotionCode = {
          ...globalPromotionCode.toObject(),
          global_promotion: promotion,
          product: { ...productStoring.product.toObject(), model_id }
        };
      }
      return globalPromotionCode;
    } catch (error) {
      logger.error(error);
      return {};
    }
  },
  async findActive(id, options = {}) {
    return await promotionCodeModel.findOne({ _id: id, status: 'active' }, null, options);
  },
  async checkActiveGlobalCode(global_promotion_code_id) {
    const populate = { path: 'global_promotion' };
    const promotionCode = await this.findActive(global_promotion_code_id, { populate });
    if (
      promotionCode &&
      promotionCode.global_promotion &&
      promotionCode.global_promotion.happen_status === 'running'
    ) {
      return true;
    }
    return false;
  }
};
