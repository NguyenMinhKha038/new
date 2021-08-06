import { CompanyStaffRoles } from '../permission-group/permission-group.config';
import { MallStaffRoles } from '../sum-mall/staff/staff.config';

export const PopulatedFields = [
  {
    path: 'product',
    select:
      'name images refund_rate price status description thumbnail pid discount_rate is_limited_stock stock model_list'
  },
  { path: 'company', select: 'name location address logo cover_image' },
  { path: 'mall', select: 'name description address location status' },
  { path: 'warehouse', select: 'name description address location status' },
  {
    path: 'mall_storing',
    select:
      'name images refund_rate price status description thumbnail pid discount_rate is_limited_stock stock model_list'
  },
  { path: 'store', select: 'name address location status' },
  {
    path: 'store_storing',
    select:
      'name images refund_rate price status description thumbnail pid discount_rate is_limited_stock stock model_list'
  },
  {
    path: 'product_storing',
    select:
      'name images refund_rate price status description thumbnail pid discount_rate is_limited_stock stock model_list'
  },
  {
    path: 'warehouse_storing',
    select:
      'name images refund_rate price status description thumbnail pid discount_rate is_limited_stock stock model_list'
  },
  { path: 'provider', select: 'name address location status' }
];
export const Statuses = {
  Active: 'active',
  Exported: 'exported',
  Disabled: 'disabled'
};
export const AvailableStatuses = {
  Active: 'active'
};
export const FinalStatuses = {
  Exported: 'exported',
  Disabled: 'disabled'
};
export const DeletedStatus = 'disabled';
export const PlaceOfStock = {
  Warehouse: 'warehouse',
  Mall: 'mall',
  Store: 'store',
  Transporting: 'transporting'
};
export const MallPlaceOfStock = {
  Mall: 'mall'
};
export const CompanyPlaceOfStock = {
  Warehouse: 'warehouse',
  Store: 'store'
};
export const InitPlaceOfStock = {
  Warehouse: 'warehouse',
  Mall: 'mall',
  Store: 'store'
};
export const StockPermission = [
  CompanyStaffRoles.Owner,
  CompanyStaffRoles.WarehouseStock,
  CompanyStaffRoles.WarehouseManager,
  CompanyStaffRoles.StoreStock,
  CompanyStaffRoles.StoreManager,
  MallStaffRoles.MallStock,
  MallStaffRoles.MallManager
];
export const UpdateMovePermission = [
  CompanyStaffRoles.Owner,
  CompanyStaffRoles.WarehouseStock,
  CompanyStaffRoles.WarehouseManager,
  CompanyStaffRoles.StoreStock,
  CompanyStaffRoles.StoreManager,
  MallStaffRoles.MallStock,
  MallStaffRoles.MallManager
];
export const MovingTypes = {
  WarehouseToWarehouse: 'warehouse_to_warehouse',
  WarehouseToStore: 'warehouse_to_store',
  WarehouseToMall: 'warehouse_to_mall',
  StoreToStore: 'store_to_store',
  StoreToWarehouse: 'store_to_warehouse',
  StoreToMall: 'store_to_mall',
  MallToMall: 'mall_to_mall',
  MallToWarehouse: 'mall_to_warehouse',
  MallToStore: 'mall_to_store'
};
export const NeedApprovedMovingTypes = [
  MovingTypes.WarehouseToWarehouse,
  MovingTypes.WarehouseToMall,
  MovingTypes.StoreToStore,
  MovingTypes.StoreToWarehouse,
  MovingTypes.StoreToMall,
  MovingTypes.MallToMall,
  MovingTypes.MallToWarehouse,
  MovingTypes.MallToStore
];
export const CanIgnoreApprovalMovingTypes = [
  MovingTypes.WarehouseToWarehouse,
  MovingTypes.WarehouseToStore
];

export const MovePermission = {
  [MovingTypes.WarehouseToWarehouse]: [
    CompanyStaffRoles.Owner,
    CompanyStaffRoles.WarehouseManager,
    CompanyStaffRoles.WarehouseStock
  ],
  [MovingTypes.WarehouseToStore]: [
    CompanyStaffRoles.Owner,
    CompanyStaffRoles.WarehouseManager,
    CompanyStaffRoles.WarehouseStock,
    CompanyStaffRoles.StoreManager,
    CompanyStaffRoles.StoreStock
  ],
  [MovingTypes.WarehouseToMall]: [
    CompanyStaffRoles.Owner,
    CompanyStaffRoles.WarehouseManager,
    CompanyStaffRoles.WarehouseStock,
    MallStaffRoles.MallManager,
    MallStaffRoles.MallStock
  ],
  [MovingTypes.StoreToStore]: [
    CompanyStaffRoles.Owner,
    CompanyStaffRoles.StoreManager,
    CompanyStaffRoles.StoreStock
  ],
  [MovingTypes.StoreToWarehouse]: [
    CompanyStaffRoles.Owner,
    CompanyStaffRoles.StoreManager,
    CompanyStaffRoles.StoreStock,
    CompanyStaffRoles.WarehouseManager,
    CompanyStaffRoles.WarehouseStock
  ],
  [MovingTypes.StoreToMall]: [
    CompanyStaffRoles.Owner,
    CompanyStaffRoles.StoreManager,
    CompanyStaffRoles.StoreStock,
    MallStaffRoles.MallManager,
    MallStaffRoles.MallStock
  ],
  [MovingTypes.MallToMall]: [
    // for new line (prettier)
    MallStaffRoles.MallManager,
    MallStaffRoles.MallStock
  ],
  [MovingTypes.MallToWarehouse]: [
    CompanyStaffRoles.Owner,
    MallStaffRoles.MallManager,
    MallStaffRoles.MallStock,
    CompanyStaffRoles.WarehouseManager,
    CompanyStaffRoles.WarehouseStock
  ],
  [MovingTypes.MallToStore]: [
    CompanyStaffRoles.Owner,
    MallStaffRoles.MallManager,
    MallStaffRoles.MallStock,
    CompanyStaffRoles.StoreManager,
    CompanyStaffRoles.StoreStock
  ]
};

export const RequesterTypes = {
  From: 'from',
  To: 'to'
};

export const ExportTypes = {
  Destructing: 'destructing',
  Local: 'local',
  ForSale: 'for_sale',
  Other: 'other'
};

export const GoodsBatchPermission = {
  Get: 'get',
  Move: 'move'
};

export const MaxBatchesPerRequest = 15;

export default {
  PopulatedFields,
  Statuses,
  DeletedStatus,
  PlaceOfStock,
  InitPlaceOfStock,
  MallPlaceOfStock,
  CompanyPlaceOfStock,
  StockPermission,
  UpdateMovePermission,
  MovingTypes,
  NeedApprovedMovingTypes,
  CanIgnoreApprovalMovingTypes,
  MovePermission,
  GoodsBatchPermission,
  RequesterTypes,
  ExportTypes,
  MaxBatchesPerRequest
};
