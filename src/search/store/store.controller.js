import { getDistance } from 'geolib';
import {
  BaseResponse,
  mergeObject,
  splitString,
  errorCode,
  BaseError,
  withSafety
} from '../../commons/utils';
import companyService from '../company/company.service';
import { searchService } from '../search/search.service';
import storeService from './store.service';
import { Promise } from 'bluebird';
import baseLogistics from '../logistics/provider/base-logistics';
import companyActivityService from '../company-activity/company-activity.service';
import { CompanyActions } from '../company-activity/company-activity.config';

export default {
  async get(req, res, next) {
    try {
      const {
        limit,
        page,
        select,
        sort = '-max_discount -max_refund',
        location,
        company_id,
        radius = 15,
        ...query
      } = req.query;
      const [lat, long] = splitString(location) || [];
      const locationQuery = location && {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [+long, +lat]
          },
          $maxDistance: radius * 1e3
        }
      };
      let [stores, count] = await Promise.all([
        storeService.find({
          limit,
          page,
          select,
          sort,
          company_id,
          location: locationQuery,
          populate: [{ path: 'company' }],
          status: 'active',
          is_active_company: true,
          ...query
        }),
        limit &&
          storeService.count({
            status: 'active',
            is_active_company: true,
            company_id,
            location: locationQuery,
            ...query
          })
      ]);
      location &&
        stores.forEach((store) => {
          const distance = getDistance(
            {
              lat: +lat,
              lon: +long
            },
            {
              lat: store.location.coordinates[1],
              lon: store.location.coordinates[0]
            }
          );
          store.distance = distance;
        });
      const total_page = limit && Math.ceil(count / limit);
      return new BaseResponse({ statusCode: 200, data: stores })
        .addMeta({ total_page, total: count })
        .return(res);
    } catch (error) {
      next(error);
    }
  },
  async getNearest(req, res, next) {
    try {
      const { location = '', company_id } = req.query;
      const [lat, long] = splitString(location) || [];
      const stores = location
        ? await storeService.getNearestStore({
            company_id,
            location: [long, lat],
            multi: true
          })
        : await storeService.find({ company_id });
      return new BaseResponse({ statusCode: 200, data: stores }).return(res);
    } catch (error) {
      next(error);
    }
  },
  async getById(req, res, next) {
    try {
      const { id } = req.params;
      const store = await storeService.findActive({ _id: id });
      return new BaseResponse({ statusCode: 200, data: store }).return(res);
    } catch (error) {
      next(error);
    }
  },
  company: {
    async get(req, res, next) {
      try {
        const { limit, page, select, sort, store_ids, ...other } = req.query;
        const { id: company_id } = req.company;
        const query = {
          company_id,
          limit,
          page,
          select,
          sort,
          ...other
        };
        let countingQuery = { company_id };
        if (store_ids) {
          query._id = { $in: store_ids };
          countingQuery = { _id: { $in: store_ids }, ...countingQuery };
        }
        const [store, count] = await Promise.all([
          storeService.find(query),
          limit && storeService.count(countingQuery)
        ]);
        const total_page = limit && Math.ceil(count / limit);

        return new BaseResponse({ statusCode: 200, data: store })
          .addMeta({ total_page, total: count })
          .return(res);
      } catch (error) {
        next(error);
      }
    },
    async getById(req, res, next) {
      try {
        const { id } = req.params;
        const store = await storeService.findById(id);
        return new BaseResponse({ statusCode: 200, data: store }).return(res);
      } catch (error) {
        next(error);
      }
    },
    async post(req, res, next) {
      try {
        let { name, address, location, ...restData } = req.body;
        const { id: company_id, ...company } = req.company;
        const { is_lucky } = req.user;

        // * is Lucky
        if (is_lucky) {
          const store = await storeService.findOne({ is_lucky: true });
          if (store)
            throw new BaseError({
              statusCode: 403,
              error: errorCode.client,
              errors: {
                store_limit: errorCode['client.storeLimitExceeded']
              }
            });
        }
        const isExistStore = await storeService.findOne({ name, company_id });
        if (isExistStore)
          throw new BaseError({
            statusCode: 400,
            error: errorCode.client,
            errors: { company_id: errorCode['client.storeIsExist'] }
          });
        const [lat, long] = (location && splitString(location)) || [];
        const normalizedAddress = `${address.text}, ${address.ward}, ${address.district}, ${address.province}`;
        location = location
          ? { type: 'Point', coordinates: [+long, +lat] }
          : {
              type: 'Point',
              coordinates: await searchService.getCoordinates(normalizedAddress)
            };
        const { id: user_id } = req.user;
        const store = await storeService.create({
          company_id,
          name,
          address,
          location,
          user_id,
          is_active_company: company.status === 'approved',
          company_category_id: company.category_id,
          type_category_id: company.type_category_id,
          // * Is Lucky
          ...(is_lucky ? { is_lucky, status: 'active' } : {}),
          ...restData
        });
        withSafety(async () => {
          // * logistics
          if (req.company.online_sales) await baseLogistics.ghn.createStore(store);
          //* change count
          companyService.changeCount(company_id, { total_store: 1 });
          companyActivityService.implicitCreate(CompanyActions.createStore)(req, {
            object_id: store._id
          });
        });
        return new BaseResponse({ statusCode: 200, data: store }).return(res);
        //*
      } catch (error) {
        next(error);
      }
    },
    async put(req, res, next) {
      try {
        let { name, address, location, status, ...restData } = req.body;
        const { id: company_id } = req.company;
        const { id } = req.params;
        const [lat, long] = (location && splitString(location)) || [];
        const normalizedAddress =
          address && `${address.text}, ${address.ward}, ${address.district}, ${address.province}`;
        location = location
          ? { type: 'Point', coordinates: [+long, +lat] }
          : address
          ? {
              type: 'Point',
              coordinates: await searchService.getCoordinates(normalizedAddress)
            }
          : undefined;
        const isExistStore = await storeService.findOne({ name, company_id });
        if (isExistStore && isExistStore.id !== id)
          throw new BaseError({
            statusCode: 400,
            error: errorCode.client,
            errors: { company_id: errorCode['client.storeIsExist'] }
          });
        const store = await storeService.update(
          { company_id, _id: id },
          { name, address, location, status, ...restData },
          { online_sales: req.company.online_sales }
        );
        withSafety(() => {
          companyActivityService.implicitCreate(CompanyActions.updateStore)(req, {
            object_id: store._id
          });
        });
        return new BaseResponse({ statusCode: 200, data: store }).return(res);
      } catch (error) {
        next(error);
      }
    }
  },
  admin: {
    async get(req, res, next) {
      try {
        const {
          limit,
          page,
          select,
          sort,
          user_id,
          status,
          company_id,
          start_time,
          end_time,
          store_ids,
          ...query
        } = req.query;
        if (start_time || end_time)
          query.createdAt = mergeObject(
            {},
            start_time && { $gte: new Date(start_time) },
            end_time && { $lte: new Date(end_time) }
          );
        if (store_ids) {
          query._id = { $in: store_ids };
        }
        const populate = { path: 'company_id', select: 'name' };
        const [store, count] = await Promise.all([
          storeService.find({
            limit,
            page,
            select,
            sort,
            user_id,
            status,
            populate,
            company_id,
            ...query
          }),
          limit && storeService.count({ user_id, status, company_id, ...query })
        ]);
        const total_page = limit && Math.ceil(count / limit);
        return new BaseResponse({ statusCode: 200, data: store })
          .addMeta({ total_page, total: count })
          .return(res);
      } catch (error) {
        next(error);
      }
    },
    async getById(req, res, next) {
      try {
        const { id } = req.params;
        const store = await storeService.findById(id);
        return new BaseResponse({ statusCode: 200, data: store }).return(res);
      } catch (error) {
        next(error);
      }
    }
  }
};
