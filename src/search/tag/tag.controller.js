import tagService from './tag.service';
import {
  selectToPopulate,
  BaseResponse,
  mergeObject,
  BaseError,
  errorCode
} from '../../commons/utils';
import { PopulatedFields, Scopes, MaxFlashTime, Types, Statuses, MinFlashTime } from './tag.config';
import { getDateRangeQuery } from '../../commons/utils/utils';
import storeService from '../store/store.service';

export default {
  async getById(req, res, next) {
    try {
      const {
        params: { id: tagId },
        query: { select, populate: populatedStr }
      } = req;
      const { populate } = selectToPopulate(populatedStr, PopulatedFields);

      let tag = await tagService.findOneUnexpired({ _id: tagId }, select, { populate });
      if (tag) {
        tag = tag.removeFields(['admin', 'admin_id']);
      }

      return new BaseResponse({ statusCode: 200, data: tag }).return(res);
    } catch (err) {
      return next(err);
    }
  },
  async get(req, res, next) {
    try {
      const {
        query: {
          select,
          sort,
          limit,
          page,
          populate: populatedStr,
          expiry_date_from,
          expiry_date_to,
          admin_id,
          ...query
        }
      } = req;
      query.status = Statuses.Active;
      query['$or'] = [
        { type: Types.Permanent },
        { type: Types.Flash, expiry_date: { $gt: new Date() } }
      ];
      mergeObject(
        query,
        getDateRangeQuery('expiry_date', { fromDate: expiry_date_from, toDate: expiry_date_to })
      );
      const { populate } = selectToPopulate(populatedStr, PopulatedFields);

      let [tags, metadata] = await tagService.findWithPagination({
        page,
        limit,
        select,
        sort,
        populate,
        query
      });
      if (tags.length) {
        tags = tags.map((tag) => tag.removeFields(['admin', 'admin_id']));
      }

      return new BaseResponse({ statusCode: 200, data: tags }).addMeta(metadata).return(res);
    } catch (err) {
      return next(err);
    }
  },
  company: {
    async create(req, res, next) {
      try {
        const {
          company: { id: company_id, store_id, is_owner },
          body: { expiry_date, ...dataToCreate }
        } = req;
        dataToCreate.company_id = company_id;

        // Validating
        const query = { name: dataToCreate.name, company_id };
        if (!is_owner) {
          dataToCreate.scope = Scopes.Store;
          dataToCreate.store_id = store_id;
          query.store_id = store_id;
          query.scope = Scopes.Store;
        } else if (dataToCreate.scope === Scopes.Company) {
          delete dataToCreate.store_id;
          query.scope = Scopes.Company;
        } else if (dataToCreate.scope === Scopes.Store) {
          const store = await storeService.findOneEnsure({
            _id: dataToCreate.store_id,
            company_id,
            status: 'active'
          });
          dataToCreate.store_id = store._id;
          query.store_id = store._id;
          query.scope = Scopes.Store;
        }

        // Check expiry_date (if type === 'flash')
        if (dataToCreate.type === Types.Flash) {
          const curDate = new Date();
          const expDate = new Date(expiry_date);
          if (
            expDate.getTime() > curDate.getTime() + MaxFlashTime ||
            expDate.getTime() < curDate.getTime() + MinFlashTime
          ) {
            throw new BaseError({
              statusCode: 400,
              error: errorCode.client,
              errors: { expiry_date: errorCode['any.invalid'] },
              message: 'expiry_date must in 1 hour to 30 days in `flash` form'
            });
          }
          dataToCreate.expiry_date = expiry_date;
        }
        // Check if tag exists
        let tag = await tagService.findOneUnexpired(query);
        if (tag) {
          throw new BaseError({
            statusCode: 400,
            error: errorCode.client,
            errors: { tag: errorCode['client.tagExisted'] }
          });
        }

        tag = await tagService.create(dataToCreate);

        return new BaseResponse({ statusCode: 201, data: tag }).return(res);
      } catch (err) {
        return next(err);
      }
    },
    async update(req, res, next) {
      try {
        const {
          params: { id: tagId },
          company: { id: company_id, store_id, is_owner },
          body: { expiry_date, ...dataToUpdate }
        } = req;
        const baseQuery = {
          company_id,
          status: Statuses.Active,
          $or: [{ type: Types.Permanent }, { type: Types.Flash, expiry_date: { $gt: new Date() } }]
        };

        // Check if tag exists
        const query = {
          ...baseQuery,
          _id: tagId,
          ...(!is_owner ? { store_id, scope: Scopes.Store } : {})
        };
        let tag = await tagService.findOneEnsure(query);

        // Check if tag with new name exists
        if (dataToUpdate.name && dataToUpdate.name !== tag.name) {
          const countQuery = {
            ...baseQuery,
            ...(tag.store_id ? { store_id: tag.store_id } : {}),
            scope: tag.scope,
            name: dataToUpdate.name
          };
          const count = await tagService.countDocuments(countQuery);
          if (count) {
            throw new BaseError({
              statusCode: 400,
              error: errorCode.client,
              errors: { name: errorCode['client.tagExisted'] }
            });
          }
        }

        // Check expiry_date (if any)
        if (expiry_date) {
          const curDate = new Date();
          const expDate = new Date(expiry_date);
          if (
            expDate.getTime() > curDate.getTime() + MaxFlashTime ||
            expDate.getTime() < curDate.getTime() + MinFlashTime
          ) {
            throw new BaseError({
              statusCode: 400,
              error: errorCode.client,
              errors: { expiry_date: errorCode['any.invalid'] },
              message: 'expiry_date must in 1 hour to 30 days in `flash` form'
            });
          }

          dataToUpdate.expiry_date = expiry_date;
        }

        mergeObject(tag, dataToUpdate);
        await tag.save();

        return new BaseResponse({ statusCode: 200, data: tag }).return(res);
      } catch (err) {
        return next(err);
      }
    },
    async delete(req, res, next) {
      try {
        const {
          params: { id: tagId },
          company: { id: company_id, store_id, is_owner }
        } = req;
        const query = {
          company_id,
          _id: tagId
        };
        if (!is_owner) {
          query.store_id = store_id;
          query.scope = Scopes.Store;
        }

        const tag = await tagService.findOneUnexpiredAndUpdate(query, {
          status: Statuses.Disabled
        });
        if (!tag) {
          throw new BaseError({
            statusCode: 404,
            error: errorCode.client,
            errors: { tag_id: errorCode['client.tagNotFound'] }
          });
        }

        return new BaseResponse({ statusCode: 200, data: tag.id }).return(res);
      } catch (err) {
        return next(err);
      }
    }
  },
  mall: {},
  admin: {}
};
