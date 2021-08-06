import {
  BaseResponse,
  splitString,
  errorCode,
  BaseError,
  withSafety,
  selectToPopulate,
  transactionHelper
} from '../../commons/utils';
import { searchService } from '../search/search.service';
import warehouseService from './warehouse.service';
import companyActivityService from '../company-activity/company-activity.service';
import { CompanyActions } from '../company-activity/company-activity.config';
import { DeletedStatus, PopulatedFields } from './warehouse.config';
import permissionGroupService from '../permission-group/permission-group.service';
import { handleXss } from '../../commons/utils/utils';

export default {
  company: {
    async getById(req, res, next) {
      try {
        const { id: companyId } = req.company;
        const { id: warehouseId } = req.params;

        const { select, populate } = selectToPopulate(req.query.select, PopulatedFields);
        const warehouse = await warehouseService.findOne(
          { _id: warehouseId, company_id: companyId, status: { $ne: DeletedStatus } },
          select,
          {
            populate
          }
        );

        return new BaseResponse({ statusCode: 200, data: warehouse }).return(res);
      } catch (err) {
        next(err);
      }
    },
    async get(req, res, next) {
      try {
        const { id: companyId } = req.company;
        const { limit, page, sort, select: selectStr, ...query } = req.query;
        query.status = { $ne: DeletedStatus };
        query.company_id = companyId;

        const { select, populate } = selectToPopulate(selectStr, PopulatedFields);

        const [warehouses, metadata] = await warehouseService.findWithPagination({
          page,
          limit,
          select,
          sort,
          populate,
          query
        });

        return new BaseResponse({ statusCode: 200, data: warehouses })
          .addMeta(metadata)
          .return(res);
      } catch (err) {
        next(err);
      }
    },
    async create(req, res, next) {
      try {
        const {
          company: { id: companyId, is_owner, type: staffType, ...company },
          user: { id: userId }
        } = req;
        let { location, name, address, manager_id = userId, ...restData } = req.body;

        const newWarehouse = await transactionHelper.withSession(async (session) => {
          const query = {
            company_id: companyId,
            name: handleXss(name),
            status: { $ne: DeletedStatus }
          };
          // Check if warehouse existed or not
          const hasExisted = await warehouseService.findOne(query, null, { session });
          if (hasExisted) {
            throw new BaseError({
              statusCode: 400,
              error: errorCode.client,
              errors: {
                warehouse: errorCode['client.warehouseExisted']
              }
            });
          }
          // Check if manager_id exists or not
          if (manager_id !== userId) {
            const permission = await permissionGroupService.findOneActive(
              {
                user_id: manager_id,
                company_id: companyId
              },
              null,
              { session, populate: { path: 'user', select: 'name phone' } }
            );
            if (!permission) {
              throw new BaseError({
                statusCode: 404,
                error: errorCode.client,
                errors: {
                  manager_id: errorCode['client.userNotFound']
                }
              });
            }
            if (!permission.is_owner && !permission.type.includes('warehouse_manager')) {
              permission.type.push('warehouse_manager');
              await permission.save();
            }
          }

          const [lat, long] = (location && splitString(location)) || [];
          const normalizedAddress = `${address.text}, ${address.ward}, ${address.district}, ${address.province}`;
          location = location
            ? { type: 'Point', coordinates: [+long, +lat] }
            : {
                type: 'Point',
                coordinates: await searchService.getCoordinates(normalizedAddress)
              };
          return await warehouseService.create(
            {
              name,
              address,
              location,
              manager_id,
              company_id: companyId,
              type_category_id: company.type_category_id,
              company_category_id: company.category_id,
              is_active_company: company.status === 'approved',
              ...restData
            },
            { session }
          );
        });

        // Create company activity
        withSafety(() => {
          companyActivityService.implicitCreate(CompanyActions.createWarehouse)(req, {
            object_id: newWarehouse._id
          });
        });
        return new BaseResponse({ statusCode: 201, data: newWarehouse }).return(res);
      } catch (err) {
        next(err);
      }
    },
    async put(req, res, next) {
      try {
        const { id: companyId, is_owner, type: staffType } = req.company;
        const { id: warehouseId } = req.params;
        let { location, address, manager_id, ...updates } = req.body;

        const updatedWarehouse = await transactionHelper.withSession(async (session) => {
          // Check if manager_id exists or not
          if (manager_id) {
            const permission = await permissionGroupService.findOneActive(
              {
                user_id: manager_id,
                company_id: companyId
              },
              null,
              { session }
            );
            if (!permission) {
              throw new BaseError({
                statusCode: 404,
                error: errorCode.client,
                errors: {
                  manager_id: errorCode['client.userNotFound']
                }
              });
            }
            if (!permission.is_owner && !permission.type.includes('warehouse_manager')) {
              permission.type.push('warehouse_manager');
              await permission.save();
            }
            updates.manager_id = manager_id;
          }

          if (address) {
            const [lat, long] = (location && splitString(location)) || [];
            const normalizedAddress = `${address.text}, ${address.ward}, ${address.district}, ${address.province}`;
            location = location
              ? { type: 'Point', coordinates: [+long, +lat] }
              : {
                  type: 'Point',
                  coordinates: await searchService.getCoordinates(normalizedAddress)
                };
            updates.address = address;
            updates.location = location;
          }

          // Update warehouse
          const query = {
            _id: warehouseId,
            company_id: companyId,
            status: { $ne: DeletedStatus }
          };
          const warehouse = await warehouseService.findOneAndUpdate(query, updates, { session });
          if (!warehouse) {
            throw new BaseError({
              statusCode: 404,
              error: errorCode.client,
              errors: {
                warehouse: errorCode['client.warehouseNotFound']
              }
            });
          }

          return warehouse;
        });

        // Create company activity
        withSafety(() => {
          companyActivityService.implicitCreate(CompanyActions.updateWarehouse)(req, {
            object_id: updatedWarehouse._id
          });
        });
        return new BaseResponse({ statusCode: 200, data: updatedWarehouse }).return(res);
      } catch (err) {
        next(err);
      }
    },
    async delete(req, res, next) {
      try {
        const { id: companyId } = req.company;
        const { id: warehouseId } = req.params;

        const query = {
          _id: warehouseId,
          company_id: companyId,
          status: { $ne: DeletedStatus }
        };
        const deletedWarehouse = await warehouseService.findOneAndUpdate(query, {
          status: DeletedStatus
        });
        if (!deletedWarehouse) {
          throw new BaseError({
            statusCode: 404,
            error: errorCode.client,
            errors: {
              warehouse: errorCode['client.warehouseNotFound']
            }
          });
        }

        // Create company activity
        withSafety(() => {
          companyActivityService.implicitCreate(CompanyActions.deleteWarehouse)(req, {
            object_id: deletedWarehouse._id
          });
        });
        return new BaseResponse({ statusCode: 200, data: deletedWarehouse }).return(res);
      } catch (err) {
        next(err);
      }
    }
  },
  admin: {
    async getById(req, res, next) {
      try {
        const { id: warehouseId } = req.params;
        const { select, populate } = selectToPopulate(req.query.select, PopulatedFields);
        const warehouse = await warehouseService.findOne({ _id: warehouseId }, select, {
          populate
        });

        return new BaseResponse({ statusCode: 200, data: warehouse }).return(res);
      } catch (err) {
        next(err);
      }
    },
    async get(req, res, next) {
      try {
        const { limit, page, sort, select: selectStr, ...query } = req.query;
        const { select, populate } = selectToPopulate(selectStr, PopulatedFields);

        const [warehouses, metadata] = await warehouseService.findWithPagination({
          page,
          limit,
          select,
          sort,
          populate,
          query
        });

        return new BaseResponse({ statusCode: 200, data: warehouses })
          .addMeta(metadata)
          .return(res);
      } catch (err) {
        next(err);
      }
    }
  }
};
