import permissionGroupService from '../permission-group/permission-group.service';
import mallStaffPermissionService from '../sum-mall/staff/staff.service';
import { BaseError, errorCode } from '../../commons/utils';
import { MallStaffRoles } from '../sum-mall/staff/staff.config';
import { StockPermission, MovingTypes } from './goods-batch.config';
import { CompanyStaffRoles } from '../permission-group/permission-group.config';
import warehouseService from '../warehouse/warehouse.service';
import storeService from '../store/store.service';
import { omit } from 'lodash';

export default {
  async hasStockPermission(req, res, next) {
    try {
      const { id: userId, name, phone } = req.user;

      const [userCompanyPermission, userMallPermission] = await Promise.all([
        permissionGroupService.findOneActive({ user_id: userId }),
        mallStaffPermissionService.findOneActive({ user_id: userId })
      ]);
      if (!userCompanyPermission && !userMallPermission) {
        return next(
          new BaseError({
            statusCode: 400,
            error: errorCode.authorization,
            errors: {
              permission: errorCode['permission.notAllow']
            }
          }).addMeta({ message: 'user not authorized' })
        );
      }
      const omittedFields = ['_id', 'createdAt', 'updatedAt', 'user_id'];
      const { id: permission_group_id, type: companyStaffRoles = [], ...userCompPer } = omit(
        userCompanyPermission ? userCompanyPermission.toObject() : {},
        omittedFields
      );
      const { id: mall_staff_permission_id, type: mallStaffRoles = [], ...userMallPer } = omit(
        userMallPermission ? userMallPermission.toObject() : {},
        omittedFields
      );
      const stockPermission = {
        ...userCompPer,
        ...userMallPer,
        name,
        phone,
        permission_group_id,
        mall_staff_permission_id,
        user_id: userId.toString(),
        type: [...companyStaffRoles, ...mallStaffRoles],
        staff_of: [],
        mall_ids: userCompPer.mall_id ? [userMallPer.mall_id.toString()] : [],
        warehouse_ids: userCompPer.warehouse_id ? [userCompPer.warehouse_id.toString()] : [],
        store_ids: userCompPer.store_id ? [userCompPer.store_id.toString()] : []
      };

      if (stockPermission.is_owner) {
        const [warehouses, stores] = await Promise.all([
          warehouseService.findManyActive({ company_id: stockPermission.company_id }),
          storeService.findManyActive({ company_id: stockPermission.company_id })
        ]);
        stockPermission.warehouse_ids = warehouses.map((warehouse) => warehouse.id);
        stockPermission.store_ids = stores.map((store) => store.id);
        stockPermission.staff_of.push('warehouse', 'store');
        stockPermission.type.push(CompanyStaffRoles.Owner);
      } else {
        if (stockPermission.mall_id) {
          stockPermission.staff_of.push('mall');
        }
        if (stockPermission.warehouse_id) {
          stockPermission.staff_of.push('warehouse');
        }
        if (stockPermission.store_id) {
          stockPermission.staff_of.push('store');
        }
      }

      const staffType = stockPermission.type;
      if (staffType.some((type) => StockPermission.includes(type))) {
        req.stock_permission = stockPermission;

        return next();
      }

      return next(
        new BaseError({
          statusCode: 401,
          error: errorCode.authorization,
          errors: {
            permission: errorCode['permission.notAllow']
          }
        }).addMeta({ message: 'user not authorized' })
      );
    } catch (err) {
      next(err);
    }
  },
  async hasMoveStockPermission(req, res, next) {
    try {
      const { id: userId, name, phone } = req.user;

      const [userCompanyPermission, userMallPermission] = await Promise.all([
        permissionGroupService.findOneActive({ user_id: userId }),
        mallStaffPermissionService.findOneActive({ user_id: userId })
      ]);
      if (!userCompanyPermission && !userMallPermission) {
        return next(
          new BaseError({
            statusCode: 400,
            error: errorCode.authorization,
            errors: {
              permission: errorCode['permission.notAllow']
            }
          }).addMeta({ message: 'user not authorized' })
        );
      }

      const omittedFields = ['_id', 'createdAt', 'updatedAt', 'user_id'];
      const { id: permission_group_id, type: companyStaffRoles = [], ...userCompPer } = omit(
        userCompanyPermission ? userCompanyPermission.toObject() : {},
        omittedFields
      );
      const { id: mall_staff_permission_id, type: mallStaffRoles = [], ...userMallPer } = omit(
        userMallPermission ? userMallPermission.toObject() : {},
        omittedFields
      );
      const stockPermission = {
        ...userCompPer,
        ...userMallPer,
        name,
        phone,
        permission_group_id,
        mall_staff_permission_id,
        user_id: userId.toString(),
        type: [...companyStaffRoles, ...mallStaffRoles],
        staff_of: [],
        mall_ids: userCompPer.mall_id ? [userMallPer.mall_id.toString()] : [],
        warehouse_ids: userCompPer.warehouse_id ? [userCompPer.warehouse_id.toString()] : [],
        store_ids: userCompPer.store_id ? [userCompPer.store_id.toString()] : []
      };

      if (stockPermission.is_owner) {
        const [warehouses, stores] = await Promise.all([
          warehouseService.findManyActive({ company_id: stockPermission.company_id }),
          storeService.findManyActive({ company_id: stockPermission.company_id })
        ]);
        stockPermission.warehouse_ids = warehouses.map((warehouse) => warehouse.id);
        stockPermission.store_ids = stores.map((store) => store.id);
        stockPermission.staff_of.push('warehouse', 'store');
        stockPermission.type.push(CompanyStaffRoles.Owner);
      } else {
        if (stockPermission.mall_id) {
          stockPermission.staff_of.push('mall');
        }
        if (stockPermission.warehouse_id) {
          stockPermission.staff_of.push('warehouse');
        }
        if (stockPermission.store_id) {
          stockPermission.staff_of.push('store');
        }
      }

      const mallPermissions = [MallStaffRoles.MallManager, MallStaffRoles.MallStock];
      const warehousePermissions = [
        CompanyStaffRoles.Owner,
        CompanyStaffRoles.WarehouseManager,
        CompanyStaffRoles.WarehouseStock
      ];
      const storePermissions = [
        CompanyStaffRoles.Owner,
        CompanyStaffRoles.StoreManager,
        CompanyStaffRoles.StoreStock
      ];
      const possibleMovingTypes = [];
      const staffType = stockPermission.type;

      // Check if having mall permission
      if (staffType.some((type) => mallPermissions.includes(type))) {
        possibleMovingTypes.push(
          MovingTypes.MallToMall,
          MovingTypes.MallToWarehouse,
          MovingTypes.MallToStore,
          MovingTypes.WarehouseToMall,
          MovingTypes.StoreToMall
        );
      }
      // Check if having warehouse permission
      if (staffType.some((type) => warehousePermissions.includes(type))) {
        possibleMovingTypes.push(
          MovingTypes.WarehouseToWarehouse,
          MovingTypes.WarehouseToMall,
          MovingTypes.WarehouseToStore,
          MovingTypes.MallToWarehouse,
          MovingTypes.StoreToWarehouse
        );
      }
      // Check if having store permission
      if (staffType.some((type) => storePermissions.includes(type))) {
        possibleMovingTypes.push(
          MovingTypes.StoreToStore,
          MovingTypes.StoreToWarehouse,
          MovingTypes.StoreToMall,
          MovingTypes.WarehouseToStore,
          MovingTypes.MallToStore
        );
      }

      if (!possibleMovingTypes.length) {
        return next(
          new BaseError({
            statusCode: 401,
            error: errorCode.authorization,
            errors: {
              permission: errorCode['permission.notAllow']
            }
          }).addMeta({ message: 'user not authorized' })
        );
      }

      req.move_permission = {
        ...stockPermission,
        moving_types: possibleMovingTypes
      };

      return next();
    } catch (err) {
      next(err);
    }
  }
};
