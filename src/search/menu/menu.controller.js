import {
  BaseResponse,
  BaseError,
  errorCode,
  selectToPopulate,
  mergeObject,
  withSafety
} from '../../commons/utils';
import productStoringServiceV2 from '../product-storing/v2/product-storing.service';
import menuService from './menu.service';
import storeService from '../store/store.service';
import { PopulatedFields, Statuses } from './menu.config';
import companyActivityService from '../company-activity/company-activity.service';
import { CompanyActions } from '../company-activity/company-activity.config';
import sellingOptionService from '../selling-option/selling-option.service';

export default {
  async getById(req, res, next) {
    try {
      const {
        params: { id: menuId },
        query: { select, populate: populatedStr }
      } = req;
      const { populate } = selectToPopulate(populatedStr, PopulatedFields);

      const menu = await menuService.findOneActive({ _id: menuId }, select, { populate });

      return new BaseResponse({ statusCode: 200, data: menu }).return(res);
    } catch (err) {
      return next(err);
    }
  },
  async getByStoreId(req, res, next) {
    try {
      const {
        params: { id: storeId },
        query: { select, populate: populatedStr }
      } = req;
      const { populate } = selectToPopulate(populatedStr, PopulatedFields);

      const menu = await menuService.findOneActive({ store_id: storeId }, select, { populate });

      return new BaseResponse({ statusCode: 200, data: menu }).return(res);
    } catch (err) {
      return next(err);
    }
  },
  async get(req, res, next) {
    try {
      const { limit, select, sort, page, populate: populatedStr, ...query } = req.query;
      const { populate } = selectToPopulate(populatedStr, PopulatedFields);

      query.status = Statuses.Active;
      const [menus, metadata] = await menuService.findWithPagination({
        limit,
        select,
        sort,
        page,
        populate,
        query
      });

      return new BaseResponse({ statusCode: 200, data: menus }).addMeta(metadata).return(res);
    } catch (err) {
      return next(err);
    }
  },
  company: {
    async create(req, res, next) {
      try {
        const {
          user: { id: user_id },
          company: { id: company_id, store_id: userStoreId, is_owner },
          body: dataToCreate
        } = req;
        dataToCreate.company_id = company_id;
        dataToCreate.user_id = user_id;

        // Check store_id
        let storeId = userStoreId;
        if (is_owner) {
          if (!dataToCreate.store_id) {
            throw new BaseError({
              statusCode: 400,
              error: errorCode.client,
              errors: { store_id: errorCode['any.empty'] }
            });
          }
          storeId = dataToCreate.store_id;
        } else {
          if (!userStoreId) {
            throw new BaseError({
              statusCode: 401,
              error: errorCode.client,
              errors: { permission: errorCode['permission.notAllow'] }
            });
          }
          storeId = userStoreId;
        }
        dataToCreate.store_id = storeId;

        // Checking product storings, menu, store
        const productStoringIds = [];
        const sellingOptionIds = [];
        dataToCreate.products.forEach(({ product_storing_id, options }) => {
          productStoringIds.push(product_storing_id);
          if (options && options.length) {
            sellingOptionIds.push(...options);
          }
        });
        let [productStorings, menu, store, sellingOptions] = await Promise.all([
          productStoringServiceV2.findManyActive({
            _id: { $in: productStoringIds },
            store_id: storeId,
            company_id
          }),
          menuService.findOneActive({ store_id: storeId, company_id }),
          storeService.findOneActive({ _id: storeId, company_id }),
          sellingOptionService.findManyActive({
            _id: { $in: sellingOptionIds },
            store_id: storeId,
            company_id
          })
        ]);
        if (menu) {
          throw new BaseError({
            statusCode: 400,
            error: errorCode.client,
            errors: { menu: errorCode['client.menuExisted'] }
          });
        }
        if (!store) {
          throw new BaseError({
            statusCode: 404,
            error: errorCode.client,
            errors: { store: errorCode['client.storeNotExist'] },
            message: 'store not found or disabled'
          });
        }
        if (!productStorings.length || productStorings.length !== productStoringIds.length) {
          throw new BaseError({
            statusCode: 404,
            error: errorCode.client,
            errors: { product_storing_id: errorCode['client.productNotExistInStore'] }
          });
        }
        if (
          sellingOptionIds.length &&
          [...new Set(sellingOptionIds)].length !== sellingOptions.length
        ) {
          throw new BaseError({
            statusCode: 404,
            error: errorCode.client,
            errors: { selling_option_id: errorCode['client.sellingOptionNotFound'] }
          });
        }

        dataToCreate.products = dataToCreate.products.map((product) => {
          const productStoring = productStorings.find(
            (ps) => ps.id === product.product_storing_id.toString()
          );
          if (!productStoring) {
            throw new BaseError({
              statusCode: 404,
              error: errorCode.client,
              errors: { product_storing_id: errorCode['client.productNotExistInStore'] },
              message: `product_storing_id [${product.product_storing_id}] not found`
            });
          }

          return { ...product, product_id: productStoring.product_id };
        });

        menu = await menuService.create(dataToCreate);

        // CREATE COMPANY ACTIVITY
        withSafety(() => {
          companyActivityService.implicitCreate(CompanyActions.createMenu)(req, {
            object_id: menu._id
          });
        });

        return new BaseResponse({ statusCode: 201, data: menu }).return(res);
      } catch (err) {
        return next(err);
      }
    },
    async update(req, res, next) {
      try {
        const {
          params: { id: menuId },
          body: { products, ...updates },
          company: { id: company_id, store_id, is_owner },
          user: { id: userId }
        } = req;
        updates.user_id = userId;

        const query = { _id: menuId, company_id };
        if (!is_owner) {
          query.store_id = store_id;
        }

        // Check if menu exists
        const menu = await menuService.findOneEnsure(query);

        // Checking product storings
        if (products) {
          const productStoringIds = [];
          const sellingOptionIds = [];
          products.forEach(({ product_storing_id, options }) => {
            productStoringIds.push(product_storing_id);
            if (options && options.length) {
              sellingOptionIds.push(...options);
            }
          });
          const [productStorings, sellingOptions] = await Promise.all([
            productStoringServiceV2.findManyActive({
              _id: { $in: productStoringIds },
              store_id: menu.store_id,
              company_id
            }),
            sellingOptionService.findManyActive({
              _id: { $in: sellingOptionIds },
              store_id: menu.store_id,
              company_id
            })
          ]);
          if (!productStorings.length || productStorings.length !== productStoringIds.length) {
            throw new BaseError({
              statusCode: 404,
              error: errorCode.client,
              errors: { product_storing_id: errorCode['client.productNotExistInStore'] }
            });
          }
          if (
            sellingOptionIds.length &&
            [...new Set(sellingOptionIds)].length !== sellingOptions.length
          ) {
            throw new BaseError({
              statusCode: 404,
              error: errorCode.client,
              errors: { selling_option_id: errorCode['client.sellingOptionNotFound'] }
            });
          }

          updates.products = products.map((product) => {
            const productStoring = productStorings.find(
              (ps) => ps.id === product.product_storing_id
            );
            if (!productStoring) {
              throw new BaseError({
                statusCode: 404,
                error: errorCode.client,
                errors: { product_storing_id: errorCode['client.productNotExistInStore'] },
                message: `product_storing_id [${product.product_storing_id}] not found`
              });
            }
            return { ...product, product_id: productStoring.product_id };
          });
        }

        mergeObject(menu, updates);
        await menu.save();

        // CREATE COMPANY ACTIVITY
        withSafety(() => {
          companyActivityService.implicitCreate(CompanyActions.updateMenu)(req, {
            object_id: menu._id
          });
        });

        return new BaseResponse({ statusCode: 200, data: menu }).return(res);
      } catch (err) {
        return next(err);
      }
    },
    async delete(req, res, next) {
      try {
        const {
          params: { id: menuId },
          company: { id: company_id, store_id, is_owner },
          user: { id: user_id }
        } = req;
        const query = { _id: menuId, company_id };
        if (!is_owner) {
          query.store_id = store_id;
        }

        const menu = await menuService.findOneActiveAndUpdate(query, {
          status: Statuses.Disabled,
          user_id
        });
        if (!menu) {
          throw new BaseError({
            statusCode: 404,
            error: errorCode.client,
            errors: { menu_id: errorCode['client.menuNotFound'] }
          });
        }

        // CREATE COMPANY ACTIVITY
        withSafety(() => {
          companyActivityService.implicitCreate(CompanyActions.deleteMenu)(req, {
            object_id: menu._id
          });
        });

        return new BaseResponse({ statusCode: 200, data: menu.id }).return(res);
      } catch (err) {
        return next(err);
      }
    }
  }
};
