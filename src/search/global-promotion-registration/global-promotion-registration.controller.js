import globalPromotionRegistrationService from './global-promotion-registration.service';
import { mergeObject, BaseResponse, BaseError, errorCode, withSession } from '../../commons/utils';
import globalPromotionService from '../global-promotion/global-promotion.service';
import productStoringService from '../product-storing/product-storing.service';
import _ from 'lodash';
import { Promise } from 'bluebird';
function createCode() {
  let currentTime = new Date().getTime() % 1000000000;
  return currentTime.toString(35).toUpperCase();
}
export default {
  admin: {
    async get(req, res, next) {
      try {
        const { page, limit, sort, select, ...query } = req.query;
        const skip = page ? (page - 1) * limit : 0;
        const populate = [
          {
            path: 'global_promotion_id'
          },
          { path: 'company_id', select: '-wallet -chat_password -pin' }
        ];
        const [result, count] = await Promise.all([
          globalPromotionRegistrationService.find({
            query,
            options: {
              skip,
              limit,
              populate,
              sort
            },
            select
          }),
          limit && globalPromotionRegistrationService.count(query)
        ]);
        const total_page = limit && Math.ceil(count / limit);
        return new BaseResponse({ statusCode: 200, data: result })
          .addMeta({ total_page })
          .return(res);
      } catch (error) {
        next(error);
      }
    },
    async getById(req, res, next) {
      try {
        const { id } = req.params;
        const result = await globalPromotionRegistrationService.findById({ id });
        return new BaseResponse({ statusCode: 200, data: result }).return(res);
      } catch (error) {
        next(error);
      }
    }
  },
  company: {
    async getById(req, res, next) {
      try {
        const { id } = req.params;
        const company = req.company;
        const result = await globalPromotionRegistrationService.findOne({
          _id: id,
          company_id: company._id,
          options: {
            populate: { path: 'global_promotion' }
          }
        });
        return new BaseResponse({ statusCode: 200, data: result }).return(res);
      } catch (error) {
        next(error);
      }
    },
    async register(req, res, next) {
      try {
        const { product_storing_ids, global_promotion_id } = req.body;
        const company = req.company;
        const result = await withSession(async (session) => {
          const [promotion, existedRegistration] = await Promise.all([
            globalPromotionService.findOne({
              query: { _id: global_promotion_id, status: 'active' },
              options: { session }
            }),
            globalPromotionRegistrationService.findOne({
              company_id: company._id,
              global_promotion_id,
              options: { session }
            })
          ]);
          if (existedRegistration) {
            throw new BaseError({
              statusCode: 400,
              error: errorCode.client,
              errors: {
                registration: errorCode['client.registrationExisted']
              }
            }).addMeta({
              message: 'registration existed'
            });
          }
          if (!promotion) {
            throw new BaseError({
              statusCode: 400,
              error: errorCode.client,
              errors: {
                promotion: errorCode['client.promotion.notFound']
              }
            }).addMeta({
              message: "Promotion doesn't exists"
            });
          }
          if (new Date().getTime() < new Date(promotion.register_at).getTime()) {
            throw new BaseError({
              statusCode: 400,
              error: errorCode.client,
              errors: {
                time: errorCode['client.cannotAccess']
              }
            }).addMeta({
              message: 'Registration is not available'
            });
          }
          if (promotion.is_limit_company && promotion.max_company <= promotion.count_company) {
            throw new BaseError({
              statusCode: 400,
              error: errorCode.client,
              errors: {
                promotion: errorCode['client.amountGreaterThanMaximum']
              }
            }).addMeta({
              message: 'Amount of company is equal to maximum'
            });
          }
          if (new Date().getTime() >= new Date(promotion.start_at).getTime()) {
            throw new BaseError({
              statusCode: 400,
              error: errorCode.client,
              errors: {
                time: errorCode['client.startDateLessThanCurrentDate']
              }
            }).addMeta({
              message: 'Start date is less than current date'
            });
          }
          await Promise.map(product_storing_ids, async (productStoringId) => {
            const productStoring = await productStoringService.findActive({
              _id: productStoringId,
              active: true,
              company_id: company._id,
              options: { populate: { path: 'product' }, session }
            });
            if (
              (!promotion.is_all_categories &&
                productStoring.product &&
                !promotion.categories.find((item) =>
                  item.equals(productStoring.product.company_category_id)
                )) ||
              !productStoring.product
            ) {
              throw new BaseError({
                statusCode: 400,
                error: errorCode.client,
                errors: {
                  categories: errorCode['client.unsuitableProductsOfCompany']
                }
              });
            }
          });
          const code = promotion.code + '-' + createCode();
          const data = {
            global_promotion_id: id,
            company_id: company._id,
            product_storing_ids,
            code,
            start_at: promotion.start_at,
            expire_at: promotion.expire_at
          };
          const result = await globalPromotionRegistrationService.create([data], { session });
          await globalPromotionService.updateById(
            id,
            {
              $inc: { count_company: 1 }
            },
            { session }
          );
          return result;
        });
        return new BaseResponse({ statusCode: 200, data: result }).return(res);
      } catch (error) {
        next(error);
      }
    },
    async update(req, res, next) {
      try {
        const { product_storing_ids, status } = req.body;
        const { id } = req.params;
        const company = req.company;
        const result = await withSession(async (session) => {
          const promotionRegistration = await globalPromotionRegistrationService.findOne({
            _id: id,
            company_id: company._id,
            options: { session, populate: { path: 'global_promotion' } }
          });
          if (!promotionRegistration) {
            throw new BaseError({
              statusCode: 400,
              error: errorCode.client,
              errors: {
                promotion_registration: errorCode['client.registrationNotFound']
              }
            }).addMeta({
              message: 'Promotion registration is not exist'
            });
          }
          const globalPromotion = promotionRegistration.global_promotion;
          if (!globalPromotion) {
            throw new BaseError({
              statusCode: 400,
              error: errorCode.client,
              errors: {
                promotion: errorCode['client.promotion.notFound']
              }
            }).addMeta({
              message: 'global promotion not found'
            });
          }
          if (new Date().getTime() >= new Date(promotionRegistration.start_at).getTime()) {
            throw new BaseError({
              statusCode: 400,
              error: errorCode.client,
              errors: {
                time: errorCode['client.startDateLessThanCurrentDate']
              }
            }).addMeta({
              message: 'Start date is less than current date'
            });
          }
          await Promise.map(product_storing_ids, async (productStoringId) => {
            const productStoring = await productStoringService.findActive({
              _id: productStoringId,
              active: true,
              options: { populate: { path: 'product' }, session },
              company_id: company._id
            });
            if (
              (!globalPromotion.is_all_categories &&
                productStoring.product &&
                !globalPromotion.categories.find((item) =>
                  item.equals(productStoring.product.company_category_id)
                )) ||
              !productStoring.product
            ) {
              throw new BaseError({
                statusCode: 400,
                error: errorCode.client,
                errors: {
                  product_storing_ids: errorCode['client.unsuitableProductsOfCompany']
                }
              });
            }
          });
          let count = status === 'active' ? 1 : -1;
          if (status && status !== promotionRegistration.status) {
            globalPromotion.count_company += count;
            promotionRegistration.status = status;
          }
          promotionRegistration.product_storing_ids = product_storing_ids;
          await globalPromotion.save({ session });
          const result = await promotionRegistration.save({ session });
          return result;
        });
        return new BaseResponse({ statusCode: 200, data: result }).return(res);
      } catch (error) {
        next(error);
      }
    },
    async getMyRegistration(req, res, next) {
      try {
        const { status, limit, sort, page, select } = req.query;
        const company = req.company;
        const skip = page ? (page - 1) * limit : 0;
        const [result, count] = await Promise.all([
          globalPromotionRegistrationService.find({
            query: {
              company_id: company.id,
              status
            },
            select,
            options: {
              skip,
              limit,
              sort
            }
          }),
          limit &&
            globalPromotionRegistrationService.count({
              company_id: company._id,
              status
            })
        ]);
        const total_page = limit && Math.ceil(count / limit);
        return new BaseResponse({
          statusCode: 200,
          data: result
        })
          .addMeta({ total_page, total: count })
          .return(res);
      } catch (error) {
        next(error);
      }
    }
  }
};
