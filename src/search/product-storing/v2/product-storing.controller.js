import { Promise } from 'bluebird';
import productStockHistoryServiceV2 from '../../product-stock-history/v2/product-stock-history.service';
import { Types as HistoryTypes } from '../../product-stock-history/v2/product-stock-history.config';
import productStoringService from './product-storing.service';
import { PopulatedFields, Statuses, DeletedStatus } from './product-storing.config';
import {
  BaseResponse,
  errorCode,
  BaseError,
  selectToPopulate,
  mergeObject,
  transactionHelper
} from '../../../commons/utils';
import storeService from '../../store/store.service';
import productService from '../../product/product.service';
import sellingOptionService from '../../selling-option/selling-option.service';
import groupService from '../../group/group.service';
import tagService from '../../tag/tag.service';
import productStoringHandler from './product-storing.handler';
import productStoringModel from '../product-storing.model';

export default {
  async getById(req, res, next) {
    try {
      const {
        params: { id: storingId },
        query: { select, populate: populatedStr }
      } = req;
      const { populate } = selectToPopulate(populatedStr, PopulatedFields);
      let productStoring = await productStoringService.findOneActive({ _id: storingId }, select, {
        populate
      });
      if (productStoring) {
        productStoring = productStoring.removeFields([
          'is_active_product',
          'is_active_store',
          'is_active_company',
          'transportable',
          'sold',
          'stock',
          'batch_stock',
          'active',
          'status'
        ]);
      }

      return new BaseResponse({ statusCode: 200, data: productStoring }).return(res);
    } catch (err) {
      return next(err);
    }
  },
  async get(req, res, next) {
    try {
      const { limit, page, sort, select, populate: populatedStr, ...query } = req.query;
      query.status = Statuses.Active;
      const { populate } = selectToPopulate(populatedStr, PopulatedFields);

      let [productStorings, metadata] = await productStoringService.findWithPagination({
        page,
        limit,
        select,
        sort,
        populate,
        query
      });
      if (productStorings.length) {
        productStorings = productStorings.map((productStoring) =>
          productStoring.removeFields([
            'is_active_product',
            'is_active_store',
            'is_active_company',
            'transportable',
            'sold',
            'stock',
            'batch_stock',
            'active',
            'status'
          ])
        );
      }

      return new BaseResponse({ statusCode: 200, data: productStorings })
        .addMeta(metadata)
        .return(res);
    } catch (err) {
      return next(err);
    }
  },
  company: {
    async search(req, res, next) {
      try {
        const {
          company: { id: company_id, store_id: userStoreId, is_owner },
          query: { limit = 20, store_id: queryStoreId, q, query, SKU }
        } = req;
        const textQuery = q || query;
        let store_id = userStoreId;
        if (is_owner && queryStoreId) {
          const store = await storeService.findActive({
            _id: queryStoreId,
            company_id
          });
          store_id = store._id;
        }

        const rawResults = await productStoringModel.esSearch(
          {
            query: {
              bool: {
                must: [
                  {
                    match_phrase: store_id ? { 'store_id._id': store_id } : { company_id }
                  },
                  {
                    match_phrase: { showable: true }
                  },
                  textQuery
                    ? {
                        query_string: {
                          fields: ['product_id.name', 'product_id.pid'],
                          query: textQuery
                          // analyzer: 'word_ngram'
                        }
                      }
                    : {
                        match_all: { boost: 1.2 }
                      }
                ]
              }
            }
          },
          {
            hydrate: {
              select: '-id',
              docsOnly: true,
              populate: [
                {
                  path: 'promotion',
                  match: {
                    start_at: {
                      $lte: new Date()
                    },
                    expire_at: {
                      $gt: new Date()
                    },
                    remain: {
                      $gt: 0
                    }
                  }
                },
                { path: 'product_id' }
              ]
            }
          }
        );
        const results = rawResults.slice(0, limit).map((re) => re);
        return new BaseResponse({ statusCode: 200, data: results }).return(res);
      } catch (error) {
        next(error);
      }
    },
    async getById(req, res, next) {
      try {
        const {
          company: { id: company_id, store_id, is_owner },
          query: { select, populate: populatedStr },
          params: { id: storingId }
        } = req;
        const query = { _id: storingId, company_id, status: { $ne: DeletedStatus } };
        if (!is_owner) {
          query.store_id = store_id;
        }

        const { populate } = selectToPopulate(populatedStr, PopulatedFields);
        const productStoring = await productStoringService.findOne(query, select, {
          populate
        });

        return new BaseResponse({ statusCode: 200, data: productStoring }).return(res);
      } catch (err) {
        return next(err);
      }
    },
    async get(req, res, next) {
      try {
        const {
          company: { id: company_id, store_id, is_owner },
          query: { select, sort, page, limit, populate: populatedStr, ...query }
        } = req;
        if (!is_owner) {
          query.store_id = store_id;
        }
        query.company_id = company_id;
        query['$and'] = [{ status: { $ne: DeletedStatus } }];
        const { populate } = selectToPopulate(populatedStr, PopulatedFields);

        const [productStorings, metadata] = await productStoringService.findWithPagination({
          page,
          limit,
          select,
          sort,
          populate,
          query
        });

        return new BaseResponse({ statusCode: 200, data: productStorings })
          .addMeta(metadata)
          .return(res);
      } catch (err) {
        return next(err);
      }
    },
    async importProducts(req, res, next) {
      try {
        const {
          user: { id, ...user },
          company: { id: companyId, store_id: userStoreId, is_owner },
          body: { store_id: reqStoreId, products, note }
        } = req;

        // Check store_id
        let storeId = userStoreId;
        if (is_owner) {
          storeId = reqStoreId;
        }
        const store = await storeService.findOneEnsure({
          _id: storeId,
          company_id: companyId,
          status: 'active'
        });

        // Create or update product storing
        const { stockHistory } = await transactionHelper.withSession(async (session) => {
          const performedUser = {
            ...req.company,
            company_id: companyId,
            perform_as: 'store',
            perform_as_id: storeId
          };

          return await productStoringHandler.importProducts(
            { products, companyId, storeId, performedUser, note },
            { session }
          );
        });

        return new BaseResponse({
          statusCode: 201,
          data: stockHistory
        }).return(res);
      } catch (err) {
        return next(err);
      }
    },
    async updateStatus(req, res, next) {
      try {
        const { id: companyId, is_owner, store_id } = req.company;
        const { product_storings } = req.body;

        const updatedProductStorings = await Promise.map(
          product_storings,
          async ({ id: productStoringId, status }) => {
            const query = {
              status: { $ne: DeletedStatus },
              _id: productStoringId,
              company_id: companyId
            };
            if (!is_owner) {
              query.store_id = store_id;
            }
            const productStoring = await productStoringService.findOne(query);
            if (!productStoring) {
              throw new BaseError({
                statusCode: 404,
                error: errorCode.client,
                errors: {
                  mall_storing_id: errorCode['client.productNotExistInStore']
                }
              });
            }

            productStoring.status = status;

            return await productStoring.save();
          }
        );

        return new BaseResponse({ statusCode: 200, data: updatedProductStorings }).return(res);
      } catch (err) {
        next(err);
      }
    },
    async update(req, res, next) {
      try {
        const {
          company: { id: company_id, store_id, is_owner },
          params: { id: storingId },
          body: { note, ...updates }
        } = req;

        // Update product storing
        const updatedProductStoring = await transactionHelper.withSession(async (session) => {
          // Check if product storing exists or not
          const query = {
            _id: storingId,
            company_id,
            status: { $ne: DeletedStatus }
          };
          if (!is_owner) {
            query.store_id = store_id;
          }

          const productStoring = await productStoringService.findOneEnsure(query, null, {
            session,
            populate: 'groups'
          });

          const performedUser = {
            ...req.company,
            company_id,
            perform_as: 'store',
            perform_as_id: productStoring.store_id
          };

          return await productStoringHandler.update(
            {
              productStoringDoc: productStoring,
              companyId: company_id,
              storeId: productStoring.store_id,
              performedUser,
              note
            },
            updates,
            { session }
          );
        });

        return new BaseResponse({ statusCode: 200, data: updatedProductStoring }).return(res);
      } catch (err) {
        return next(err);
      }
    },
    async delete(req, res, next) {
      try {
        const { id: company_id, is_owner, store_id } = req.company;
        const { id: productStoringId } = req.params;

        const query = {
          _id: productStoringId,
          company_id,
          status: { $ne: DeletedStatus }
        };
        if (!is_owner) {
          query.store_id = store_id;
        }

        const deletedProductStoring = await productStoringService.findOneAndUpdate(query, {
          status: DeletedStatus
        });
        if (!productStoring) {
          throw new BaseError({
            statusCode: 404,
            error: errorCode.client,
            errors: {
              product_storing_id: errorCode['client.productNotExistInStore']
            }
          });
        }

        return new BaseResponse({ statusCode: 200, data: deletedProductStoring }).return(res);
      } catch (err) {
        return next(err);
      }
    }
  },
  admin: {
    async getById(req, res, next) {
      try {
        const { id: productStoringId } = req.params;
        const { select, populate } = selectToPopulate(req.query.select, PopulatedFields);
        let productStoring = await productStoringService.findOne(
          { _id: productStoringId },
          select,
          {
            populate
          }
        );

        return new BaseResponse({ statusCode: 200, data: productStoring }).return(res);
      } catch (err) {
        next(err);
      }
    },
    async get(req, res, next) {
      try {
        const { limit, page, sort, select: selectStr, ...query } = req.query;
        const { select, populate } = selectToPopulate(selectStr, PopulatedFields);

        let [productStorings, metadata] = await productStoringService.findWithPagination({
          page,
          limit,
          select,
          sort,
          populate,
          query
        });

        return new BaseResponse({ statusCode: 200, data: productStorings })
          .addMeta(metadata)
          .return(res);
      } catch (err) {
        next(err);
      }
    }
  }
};
