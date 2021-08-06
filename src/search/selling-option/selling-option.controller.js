import storeService from '../store/store.service';
import sellingOptionService from './selling-option.service';
import {
  selectToPopulate,
  BaseResponse,
  BaseError,
  errorCode,
  mergeObject
} from '../../commons/utils';
import { Statuses, PopulatedFields, Scopes } from './selling-option.config';

export default {
  user: {},
  company: {
    async getById(req, res, next) {
      try {
        const {
          params: { id: optionId },
          company: { id: company_id, store_id, is_owner },
          query: { select, populate: populatedStr }
        } = req;
        const { populate } = selectToPopulate(populatedStr, PopulatedFields);

        const query = {
          _id: optionId,
          $or: [{ company_id }, { scope: Scopes.Global }]
        };
        const option = await sellingOptionService.findOneActive(query, select, {
          populate
        });

        return new BaseResponse({ statusCode: 200, data: option }).return(res);
      } catch (err) {
        return next(err);
      }
    },
    async get(req, res, next) {
      try {
        const {
          company: { id: company_id, store_id, is_owner },
          query: { select, populate: populatedStr, page, limit, sort, ...query }
        } = req;
        query.status = Statuses.Active;
        query['$or'] = [{ company_id }, { scope: Scopes.Global }];
        const { populate } = selectToPopulate(populatedStr, PopulatedFields);

        const [options, metadata] = await sellingOptionService.findWithPagination({
          query,
          select,
          populate,
          sort,
          limit,
          page
        });

        return new BaseResponse({ statusCode: 200, data: options }).addMeta(metadata).return(res);
      } catch (err) {
        return next(err);
      }
    },
    async create(req, res, next) {
      try {
        const {
          company: { id: companyId, store_id, is_owner },
          user: { id: userId },
          body: { store_id: reqStoreId, ...dataToCreate }
        } = req;
        let storeId = store_id;
        if (is_owner) {
          storeId = reqStoreId;
          storeId && (await storeService.findOneActive({ _id: storeId }));
        }
        dataToCreate.store_id = storeId;
        dataToCreate.company_id = companyId;

        // Check if option exists
        let option = await sellingOptionService.findOneActive({
          store_id: storeId,
          company_id: companyId,
          name: dataToCreate.name
        });
        if (option) {
          throw new BaseError({
            statusCode: 400,
            error: errorCode.client,
            errors: {
              option: errorCode['client.sellingOptionExisted']
            }
          });
        }

        option = await sellingOptionService.create(dataToCreate);

        return new BaseResponse({ statusCode: 201, data: option }).return(res);
      } catch (err) {
        return next(err);
      }
    },
    async update(req, res, next) {
      try {
        const {
          company: { id: company_id, store_id, is_owner },
          params: { id: optionId },
          body: updates
        } = req;

        const query = { _id: optionId, company_id, scope: { $in: [Scopes.Company, Scopes.Store] } };
        if (!is_owner) {
          query.store_id = store_id;
        }

        // Check if option exists
        let option = await sellingOptionService.findOneEnsure({
          ...query,
          status: Statuses.Active
        });

        // Check if option with { store_id, company_id, type, name } exists or not
        if (updates.name && updates.name !== option.name) {
          const exists = await sellingOptionService.findOneActive({
            company_id,
            store_id: option.store_id,
            name: updates.name
          });
          if (exists) {
            throw new BaseError({
              statusCode: 400,
              error: errorCode.client,
              errors: {
                selling_option: errorCode['client.sellingOptionExisted']
              }
            });
          }
        }

        mergeObject(option, updates);
        await option.save();

        return new BaseResponse({ statusCode: 200, data: option }).return(res);
      } catch (err) {
        return next(err);
      }
    },
    async delete(req, res, next) {
      try {
        const {
          company: { id: company_id, store_id, is_owner },
          user: { id: user_id },
          params: { id: optionId }
        } = req;

        const query = { _id: optionId, company_id, scope: { $in: [Scopes.Company, Scopes.Store] } };
        if (!is_owner) {
          query.store_id = store_id;
        }

        const option = await sellingOptionService.findOneActiveAndUpdate(query, {
          user_id,
          status: Statuses.Disabled
        });
        if (!option) {
          throw new BaseError({
            statusCode: 404,
            error: errorCode.client,
            errors: {
              selling_option: errorCode['client.sellingOptionNotFound']
            },
            message: 'option not found'
          });
        }

        return new BaseResponse({ statusCode: 200, data: option._id }).return(res);
      } catch (err) {
        return next(err);
      }
    }
  },
  admin: {
    async getById(req, res, next) {
      try {
        const {
          params: { id: optionId },
          query: { select, populate: populatedStr }
        } = req;
        const { populate } = selectToPopulate(populatedStr, PopulatedFields);

        const query = { _id: optionId };
        const option = await sellingOptionService.findOneActive(query, select, {
          populate
        });

        return new BaseResponse({ statusCode: 200, data: option }).return(res);
      } catch (err) {
        return next(err);
      }
    },
    async get(req, res, next) {
      try {
        const {
          query: { select, populate: populatedStr, page, limit, sort, ...query }
        } = req;
        const { populate } = selectToPopulate(populatedStr, PopulatedFields);

        const [options, metadata] = await sellingOptionService.findWithPagination({
          query,
          select,
          populate,
          sort,
          limit,
          page
        });

        return new BaseResponse({ statusCode: 200, data: options }).addMeta(metadata).return(res);
      } catch (err) {
        return next(err);
      }
    },
    async create(req, res, next) {
      try {
        const {
          body: { ...dataToCreate }
        } = req;

        // Check if option exists
        let option = await sellingOptionService.findOneActive({
          name: dataToCreate.name,
          scope: Scopes.Global
        });
        if (option) {
          throw new BaseError({
            statusCode: 400,
            error: errorCode.client,
            errors: {
              option: errorCode['client.sellingOptionExisted']
            }
          });
        }

        option = await sellingOptionService.create(dataToCreate);

        return new BaseResponse({ statusCode: 201, data: option }).return(res);
      } catch (err) {
        return next(err);
      }
    },
    async update(req, res, next) {
      try {
        const {
          params: { id: optionId },
          body: updates
        } = req;

        const query = { _id: optionId, scope: Scopes.Global };

        // Check if option exists
        let option = await sellingOptionService.findOneEnsure({
          ...query,
          status: Statuses.Active
        });

        // Check if option with { store_id, company_id, type, name } exists or not
        if (updates.name && updates.name !== option.name) {
          const exists = await sellingOptionService.findOneActive({
            name: updates.name,
            scope: Scopes.Global
          });
          if (exists) {
            throw new BaseError({
              statusCode: 400,
              error: errorCode.client,
              errors: {
                selling_option: errorCode['client.sellingOptionExisted']
              }
            });
          }
        }

        mergeObject(option, updates);
        await option.save();

        return new BaseResponse({ statusCode: 200, data: option }).return(res);
      } catch (err) {
        return next(err);
      }
    },
    async delete(req, res, next) {
      try {
        const {
          params: { id: optionId }
        } = req;

        const query = { _id: optionId, scope: Scopes.Global };

        const option = await sellingOptionService.findOneActiveAndUpdate(query, {
          status: Statuses.Disabled
        });
        if (!option) {
          throw new BaseError({
            statusCode: 404,
            error: errorCode.client,
            errors: {
              selling_option: errorCode['client.sellingOptionNotFound']
            },
            message: 'option not found'
          });
        }

        return new BaseResponse({ statusCode: 200, data: option._id }).return(res);
      } catch (err) {
        return next(err);
      }
    }
  }
};
