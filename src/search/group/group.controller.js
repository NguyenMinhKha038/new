import groupService from './group.service';
import {
  selectToPopulate,
  BaseResponse,
  mergeObject,
  BaseError,
  errorCode
} from '../../commons/utils';
import { PopulatedFields, Statuses } from './group.config';
import storeService from '../store/store.service';

export default {
  user: {
    async getById(req, res, next) {
      try {
        const {
          params: { id: groupId },
          query: { select, populate: populatedStr }
        } = req;
        const { populate } = selectToPopulate(populatedStr, PopulatedFields);

        let group = await groupService.findOneActive({ _id: groupId }, select, { populate });
        if (group) {
          group = group.removeFields(['admin', 'admin_id']);
        }

        return new BaseResponse({ statusCode: 200, data: group }).return(res);
      } catch (err) {
        return next(err);
      }
    },
    async get(req, res, next) {
      try {
        const {
          query: { select, sort, limit, page, populate: populatedStr, ...query }
        } = req;
        query.status = Statuses.Active;
        const { populate } = selectToPopulate(populatedStr, PopulatedFields);

        let [groups, metadata] = await groupService.findWithPagination({
          page,
          limit,
          select,
          sort,
          populate,
          query
        });
        if (groups.length) {
          groups = groups.map((group) => group.removeFields(['admin', 'admin_id']));
        }

        return new BaseResponse({ statusCode: 200, data: groups }).addMeta(metadata).return(res);
      } catch (err) {
        return next(err);
      }
    }
  },
  company: {
    async getById(req, res, next) {
      try {
        const {
          params: { id: groupId },
          query: { select, populate: populatedStr },
          company: { id: company_id, store_id, is_owner }
        } = req;
        const query = { _id: groupId, company_id };
        if (!is_owner) {
          query.store_id = store_id;
        }
        const { populate } = selectToPopulate(populatedStr, PopulatedFields);

        let group = await groupService.findOneActive(query, select, { populate });
        if (group) {
          group = group.removeFields(['admin', 'admin_id']);
        }

        return new BaseResponse({ statusCode: 200, data: group }).return(res);
      } catch (err) {
        return next(err);
      }
    },
    async get(req, res, next) {
      try {
        const {
          query: { select, sort, limit, page, populate: populatedStr, ...query },
          company: { id: company_id, store_id, is_owner }
        } = req;
        query.company_id = company_id;
        query.status = Statuses.Active;
        if (!is_owner) {
          query.store_id = store_id;
        }
        const { populate } = selectToPopulate(populatedStr, PopulatedFields);

        let [groups, metadata] = await groupService.findWithPagination({
          page,
          limit,
          select,
          sort,
          populate,
          query
        });
        if (groups.length) {
          groups = groups.map((group) => group.removeFields(['admin', 'admin_id']));
        }

        return new BaseResponse({ statusCode: 200, data: groups }).addMeta(metadata).return(res);
      } catch (err) {
        return next(err);
      }
    },
    async create(req, res, next) {
      try {
        const {
          company: { id: company_id, store_id, is_owner },
          body: dataToCreate
        } = req;
        dataToCreate.company_id = company_id;
        if (!is_owner) {
          dataToCreate.store_id = store_id;
        } else {
          const store = await storeService.findOneEnsure({
            _id: dataToCreate.store_id,
            company_id,
            status: 'active'
          });
          dataToCreate.store_id = store._id;
        }

        // Check if group exists
        let group = await groupService.findOneActive({
          name: dataToCreate.name,
          company_id,
          store_id: dataToCreate.store_id
        });
        if (group) {
          throw new BaseError({
            statusCode: 400,
            error: errorCode.client,
            errors: { group: errorCode['client.groupExisted'] }
          });
        }

        group = await groupService.create(dataToCreate);

        return new BaseResponse({ statusCode: 201, data: group }).return(res);
      } catch (err) {
        return next(err);
      }
    },
    async update(req, res, next) {
      try {
        const {
          params: { id: groupId },
          company: { id: company_id, store_id, is_owner },
          body: updates
        } = req;
        const query = {
          status: Statuses.Active,
          company_id,
          _id: groupId
        };
        if (!is_owner) {
          query.store_id = store_id;
        }

        // Check if group exists
        let group = await groupService.findOneEnsure(query);

        // Check if group with new name exists
        if (updates.name && updates.name !== group.name) {
          const countQuery = {
            status: Statuses.Active,
            name: updates.name,
            company_id,
            store_id: group.store_id
          };
          const count = await groupService.countDocuments(countQuery);
          if (count) {
            throw new BaseError({
              statusCode: 400,
              error: errorCode.client,
              errors: { name: errorCode['client.groupExisted'] }
            });
          }
        }

        mergeObject(group, updates);
        await group.save();

        return new BaseResponse({ statusCode: 200, data: group }).return(res);
      } catch (err) {
        return next(err);
      }
    },
    async delete(req, res, next) {
      try {
        const {
          params: { id: groupId },
          company: { id: company_id, store_id, is_owner }
        } = req;
        const query = {
          company_id,
          _id: groupId
        };
        if (!is_owner) {
          query.store_id = store_id;
        }

        const group = await groupService.findOneActiveAndUpdate(query, {
          status: Statuses.Disabled
        });
        if (!group) {
          throw new BaseError({
            statusCode: 404,
            error: errorCode.client,
            errors: { group_id: errorCode['client.groupNotFound'] }
          });
        }

        return new BaseResponse({ statusCode: 200, data: group.id }).return(res);
      } catch (err) {
        return next(err);
      }
    }
  },
  mall: {},
  admin: {}
};
