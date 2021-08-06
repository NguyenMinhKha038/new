import providerService from './provider.service';
import { searchService } from '../search/search.service';
import {
  BaseResponse,
  errorCode,
  BaseError,
  splitString,
  selectToPopulate
} from '../../commons/utils';
import { PopulatedFields, Statuses } from './provider.config';

export default {
  admin: {
    async getById(req, res, next) {
      try {
        const { id: providerId } = req.params;
        const { select, populate } = selectToPopulate(req.query.select, PopulatedFields);
        const provider = await providerService.findOne({ _id: providerId }, select, {
          populate
        });
        return new BaseResponse({ statusCode: 200, data: provider }).return(res);
      } catch (err) {
        next(err);
      }
    },
    async get(req, res, next) {
      try {
        const { limit, page, sort, select: selectStr, ...query } = req.query;
        const { select, populate } = selectToPopulate(selectStr, PopulatedFields);

        const [providers, metadata] = await providerService.findWithPagination({
          page,
          limit,
          select,
          sort,
          populate,
          query
        });

        return new BaseResponse({ statusCode: 200, data: providers }).addMeta(metadata).return(res);
      } catch (err) {
        next(err);
      }
    },
    async create(req, res, next) {
      try {
        const { id: adminId } = req.admin;
        let { location, address, name, ...restData } = req.body;
        if (location) {
          const rawLoc = location;
          const [lat, long] = splitString(location) || [];
          location = { type: 'Point', coordinates: [+long, +lat] };
          if (!address) {
            address = await searchService.getAddress(rawLoc);
          }
        }
        if (address) {
          const coordinates = await searchService.getCoordinates(address);
          if (coordinates && coordinates.length) {
            location = { type: 'Point', coordinates };
          }
        }

        const provider = await providerService.create({
          location,
          address,
          name,
          admin_id: adminId,
          type: 'public',
          ...restData
        });

        return new BaseResponse({ statusCode: 201, data: provider }).return(res);
      } catch (err) {
        next(err);
      }
    },
    async update(req, res, next) {
      try {
        const { id: providerId } = req.params;
        let { location, address, ...updates } = req.body;
        if (location) {
          const rawLoc = location;
          const [lat, long] = splitString(location) || [];
          updates.location = { type: 'Point', coordinates: [+long, +lat] };
          if (!address) {
            updates.address = await searchService.getAddress(rawLoc);
          }
        } else if (address) {
          updates.address = address;
          const coordinates = await searchService.getCoordinates(address);
          if (coordinates && coordinates.length) {
            updates.location = { type: 'Point', coordinates };
          }
        }

        const provider = await providerService.findOneActiveAndUpdate({ _id: providerId }, updates);
        if (!provider) {
          throw new BaseError({
            statusCode: 404,
            error: errorCode.client,
            errors: {
              provider: errorCode['client.providerNotFound']
            }
          });
        }

        return new BaseResponse({ statusCode: 200, data: provider }).return(res);
      } catch (err) {
        next(err);
      }
    },
    async delete(req, res, next) {
      try {
        const { id: providerId } = req.params;

        const provider = await providerService.findOneActiveAndUpdate(
          { _id: providerId },
          { status: Statuses.Disabled }
        );
        if (!provider) {
          throw new BaseError({
            statusCode: 404,
            error: errorCode.client,
            errors: {
              provider: errorCode['client.providerNotFound']
            }
          });
        }

        return new BaseResponse({ statusCode: 200, data: provider.id }).return(res);
      } catch (err) {
        next(err);
      }
    }
  },
  company: {
    async getById(req, res, next) {
      try {
        const { id: company_id } = req.company;
        const { id: providerId } = req.params;
        const { select, populate } = selectToPopulate(req.query.select, PopulatedFields);
        const query = {
          $or: [
            { _id: providerId, company_id, type: 'private' },
            { _id: providerId, type: 'public' }
          ]
        };
        let provider = await providerService.findOneActive(query, select, {
          populate
        });
        if (provider) {
          provider = provider.removeFields(['admin', 'admin_id']);
        }

        return new BaseResponse({ statusCode: 200, data: provider }).return(res);
      } catch (err) {
        next(err);
      }
    },
    async get(req, res, next) {
      try {
        const { id: company_id } = req.company;
        const { limit, page, sort, select: selectStr, ...query } = req.query;
        query.status = Statuses.Active;
        query['$or'] = [{ company_id, type: 'private' }, { type: 'public' }];
        const { select, populate } = selectToPopulate(selectStr, PopulatedFields);

        let [providers, metadata] = await providerService.findWithPagination({
          page,
          limit,
          select,
          sort,
          populate,
          query
        });
        if (providers.length) {
          providers = providers.map((provider) => provider.removeFields(['admin', 'admin_id']));
        }

        return new BaseResponse({ statusCode: 200, data: providers }).addMeta(metadata).return(res);
      } catch (err) {
        next(err);
      }
    },
    async create(req, res, next) {
      try {
        const { id: companyId } = req.company;
        const { id: userId } = req.user;
        let { location, address, name, ...restData } = req.body;
        if (location) {
          const rawLoc = location;
          const [lat, long] = splitString(location) || [];
          location = { type: 'Point', coordinates: [+long, +lat] };
          if (!address) {
            address = await searchService.getAddress(rawLoc);
          }
        }
        if (address) {
          const coordinates = await searchService.getCoordinates(address);
          if (coordinates && coordinates.length) {
            location = { type: 'Point', coordinates };
          }
        }

        const provider = await providerService.create({
          location,
          address,
          name,
          user_id: userId,
          company_id: companyId,
          type: 'private',
          ...restData
        });

        return new BaseResponse({ statusCode: 201, data: provider }).return(res);
      } catch (err) {
        next(err);
      }
    },
    async getOne(req, res, next) {
      try {
        const { id: companyId } = req.company;
        const { id: userId } = req.user;
        let { location, address, name } = req.body;
        if (location) {
          const rawLoc = location;
          const [lat, long] = splitString(location) || [];
          location = { type: 'Point', coordinates: [+long, +lat] };
          if (!address) {
            address = await searchService.getAddress(rawLoc);
          }
        }
        if (address) {
          const coordinates = await searchService.getCoordinates(address);
          if (coordinates && coordinates.length) {
            location = { type: 'Point', coordinates };
          }
        }

        const provider = await providerService.createIfNotExist(
          {
            name: new RegExp(name, 'gi'),
            status: Statuses.Active
          },
          {
            location,
            address,
            name,
            user_id: userId,
            company_id: companyId
          }
        );

        return new BaseResponse({ statusCode: 201, data: provider }).return(res);
      } catch (err) {
        next(err);
      }
    },
    async update(req, res, next) {
      try {
        const { id: providerId } = req.params;
        const { id: companyId } = req.company;
        let { location, address, ...updates } = req.body;
        if (location) {
          const rawLoc = location;
          const [lat, long] = splitString(location) || [];
          updates.location = { type: 'Point', coordinates: [+long, +lat] };
          if (!address) {
            updates.address = await searchService.getAddress(rawLoc);
          }
        } else if (address) {
          updates.address = address;
          const coordinates = await searchService.getCoordinates(address);
          if (coordinates && coordinates.length) {
            updates.location = { type: 'Point', coordinates };
          }
        }

        const provider = await providerService.findOneActiveAndUpdate(
          { _id: providerId, company_id: companyId },
          updates,
          { new: true }
        );
        if (!provider) {
          throw new BaseError({
            statusCode: 404,
            error: errorCode.client,
            errors: {
              provider: errorCode['client.providerNotFound']
            }
          });
        }

        return new BaseResponse({ statusCode: 200, data: provider }).return(res);
      } catch (err) {
        next(err);
      }
    },
    async delete(req, res, next) {
      try {
        const { id: providerId } = req.params;
        const { id: companyId } = req.company;

        const provider = await providerService.findOneActiveAndUpdate(
          { _id: providerId, company_id: companyId },
          { status: Statuses.Disabled }
        );
        if (!provider) {
          throw new BaseError({
            statusCode: 404,
            error: errorCode.client,
            errors: {
              provider: errorCode['client.providerNotFound']
            }
          });
        }

        return new BaseResponse({ statusCode: 200, data: provider.id }).return(res);
      } catch (err) {
        next(err);
      }
    }
  }
};
