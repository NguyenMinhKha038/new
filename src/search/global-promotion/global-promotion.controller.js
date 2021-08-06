import { BaseResponse, BaseError, errorCode, mergeObject, withSession } from '../../commons/utils';
import globalPromotionService from './global-promotion.service';
import productService from '../product/product.service';
import categoryService from '../category/category.service';
import _ from 'lodash';
import { Promise } from 'bluebird';
import globalPromotionRegistrationService from '../global-promotion-registration/global-promotion-registration.service';

function createCode() {
  let currentTime = new Date().getTime() % 1000000000;
  return currentTime.toString(35).toUpperCase();
}

export default {
  admin: {
    async getById(req, res, next) {
      try {
        const { id } = req.params;
        const result = await globalPromotionService.findById({ id });
        return new BaseResponse({ statusCode: 200, data: result }).return(res);
      } catch (error) {
        next(error);
      }
    },
    async get(req, res, next) {
      try {
        const { limit, page, sort, select, ...query } = req.query;
        const skip = page ? (page - 1) * limit : 0;
        const populate = [{ path: 'categories' }];
        const [result, count] = await Promise.all([
          globalPromotionService.find({
            query,
            options: {
              skip,
              limit,
              populate,
              sort
            },
            select
          }),
          limit && globalPromotionService.count(query)
        ]);
        const total_page = limit && Math.ceil(count / limit);
        return new BaseResponse({ statusCode: 200, data: result })
          .addMeta({ total_page, total: count })
          .return(res);
      } catch (error) {
        next(error);
      }
    },
    async create(req, res, next) {
      try {
        const code = createCode();
        let promotion = req.body;
        await Promise.map(promotion.categories, async (category_id) => {
          const [category, sameCategory] = await Promise.all([
            categoryService.findOne({
              _id: category_id,
              status: 'active',
              type: 2
            }),
            globalPromotionService.findOne({
              query: {
                $or: [{ categories: category_id }, { is_all_categories: true }],
                start_at: { $lte: promotion.expire_at },
                expire_at: { $gte: promotion.start_at },
                type: promotion.type,
                status: { $ne: 'disabled' }
              }
            })
          ]);
          if (!category) {
            throw new BaseError({
              statusCode: 400,
              error: errorCode.client,
              errors: {
                categories: errorCode['client.categoryNotExist']
              }
            });
          }
          if (sameCategory) {
            throw new BaseError({
              statusCode: 400,
              error: errorCode.client,
              errors: {
                categories: errorCode['client.promotionExisted']
              }
            });
          }
        });
        promotion = {
          ...promotion,
          code
        };
        const result = await globalPromotionService.create(promotion);
        return new BaseResponse({ statusCode: 200, data: result }).return(res);
      } catch (error) {
        next(error);
      }
    },
    async update(req, res, next) {
      try {
        const updatePromotion = req.body;
        const { id } = req.params;
        const result = await withSession(async (session) => {
          const promotion = await globalPromotionService.findOne({
            query: {
              _id: id,
              register_at: { $gte: new Date() }
            },
            options: { session }
          });
          if (!promotion) {
            throw new BaseError({
              statusCode: 400,
              error: errorCode.client,
              errors: {
                promotion: errorCode['client.promotion.notFound']
              }
            });
          }
          const type = promotion.type || updatePromotion.type;
          const start_at = new Date(promotion.start_at || updatePromotion.start_at);
          const expire_at = new Date(promotion.expire_at || updatePromotion.expire_at);
          await Promise.map(updatePromotion.categories, async (category_id) => {
            const [category, sameCategory] = await Promise.all([
              categoryService.findOne(
                {
                  _id: category_id,
                  status: 'active',
                  type: 2
                },
                null,
                { session }
              ),
              globalPromotionService.findOne({
                query: {
                  _id: { $ne: id },
                  $or: [{ categories: category_id }, { is_all_categories: true }],
                  start_at: { $lte: expire_at },
                  expire_at: { $gte: start_at },
                  type,
                  status: { $ne: 'disabled' }
                },
                options: { session }
              })
            ]);
            if (!category) {
              throw new BaseError({
                statusCode: 400,
                error: errorCode.client,
                errors: {
                  categories: errorCode['client.categoryNotExist']
                }
              });
            }
            if (sameCategory) {
              throw new BaseError({
                statusCode: 400,
                error: errorCode.client,
                errors: {
                  promotion: errorCode['client.promotionExisted']
                }
              });
            }
          });
          if (
            updatePromotion.is_limit_company &&
            updatePromotion.max_company < promotion.count_company
          ) {
            throw new BaseError({
              statusCode: 400,
              error: errorCode.client,
              errors: {
                count_company: errorCode['client.amountGreatThanMaximum']
              }
            }).addMeta({
              message: 'An update max_company is greater than current count company'
            });
          }
          await globalPromotionRegistrationService.updateTime({
            global_promotion_status: updatePromotion.status,
            start_at,
            expire_at,
            id,
            options: { session }
          });
          const result = await globalPromotionService.updateById(
            id,
            _.omit(updatePromotion, ['id']),
            { session }
          );
          return result;
        });
        return new BaseResponse({ statusCode: 200, data: result }).return(res);
      } catch (error) {
        next(error);
      }
    },
    async search(req, res, next) {
      try {
        const { limit, page, name } = req.query;
        const skip = page ? (page - 1) * limit : 0;
        const [result, count] = await Promise.all([
          globalPromotionService.find({
            query: { $text: { $search: name } },
            select: { score: { $meta: 'textScore' } },
            options: {
              populate: { path: 'categories' },
              skip,
              limit,
              sort: { score: { $meta: 'textScore' } }
            }
          }),
          limit && globalPromotionService.count({ $text: { $search: name } })
        ]);
        const total_page = limit && Math.ceil(count / limit);
        return new BaseResponse({ statusCode: 200, data: result })
          .addMeta({ total_page, total: count })
          .return(res);
      } catch (error) {
        next(error);
      }
    },
    async updateStatus(req, res, next) {
      try {
        const { id } = req.params;
        const { status } = req.body;
        const result = await globalPromotionService.updateOne(
          {
            _id: id,
            register_at: { $gte: new Date() },
            status: { $ne: status }
          },
          { status }
        );
        return new BaseResponse({
          statusCode: 200,
          data: result
        }).return(res);
      } catch (error) {
        next(error);
      }
    }
  },
  company: {
    async getSuitable(req, res, next) {
      try {
        const { limit, page, sort, select } = req.query;
        const skip = page ? (page - 1) * limit : 0;
        const company = req.company;
        const products = await productService.find({ company_id: company._id, status: 'approved' });
        let promotions = [];
        await Promise.map(products, async (product) => {
          const globalPromotions = await globalPromotionService.find({
            query: {
              $or: [{ categories: product.company_category_id }, { is_all_categories: true }],
              status: 'active',
              register_at: { $lte: new Date() },
              start_at: { $gte: new Date() }
            },
            options: {
              skip,
              limit,
              sort
            },
            select
          });
          globalPromotions.map((globalPromotion) => {
            if (!promotions.find((promotion) => promotion._id.equals(globalPromotion._id))) {
              promotions.push(globalPromotion);
            }
          });
        });
        const total_page = limit && Math.ceil(promotions.length / limit);
        return new BaseResponse({ statusCode: 200, data: promotions })
          .addMeta({ total_page, total: promotions.length })
          .return(res);
      } catch (error) {
        next(error);
      }
    },
    async getById(req, res, next) {
      try {
        const { id } = req.params;
        const result = await globalPromotionService.findOne({
          query: { _id: id, status: 'active' }
        });
        return new BaseResponse({ statusCode: 200, data: result }).return(res);
      } catch (error) {
        next(error);
      }
    },
    async getRunning(req, res, next) {
      try {
        const { limit, page, sort, select } = req.query;
        const skip = page ? (page - 1) * limit : 0;
        const query = {
          status: 'active',
          register_at: { $lte: new Date() },
          expire_at: { $gte: new Date() }
        };
        const [result, count] = await Promise.all([
          globalPromotionService.find({
            query,
            options: {
              skip,
              limit,
              sort
            },
            select
          }),
          limit && globalPromotionService.count(query)
        ]);
        const total_page = limit && Math.ceil(count / limit);
        return new BaseResponse({ statusCode: 200, data: result })
          .addMeta({ total_page, total: count })
          .return(res);
      } catch (error) {
        next(error);
      }
    },
    async search(req, res, next) {
      try {
        const { limit, page, name } = req.query;
        const skip = page ? (page - 1) * limit : 0;
        const [result, count] = await Promise.all([
          globalPromotionService.find({
            query: { $text: { $search: name }, status: 'active' },
            options: {
              populate: { path: 'categories' },
              skip,
              limit,
              status: 'active',
              sort: { score: { $meta: 'textScore' } }
            },
            select: { score: { $meta: 'textScore' } }
          }),
          globalPromotionService.count({ $text: { $search: name } })
        ]);
        const total_page = limit && Math.ceil(count / limit);
        return new BaseResponse({ statusCode: 200, data: result })
          .addMeta({ total_page, total: count })
          .return(res);
      } catch (error) {
        next(error);
      }
    }
  }
};
