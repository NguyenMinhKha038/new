const MovingTypes = {
  StockToStore: 'stock_to_store',
  StoreToStock: 'store_to_stock'
};

const CommonPopulatedFields = [
  {
    path: 'products.product',
    select: 'name pure_name is_limited_stock stock price description thumbnail'
  },
  { path: 'products.from_product_storing' },
  { path: 'products.to_product_storing' },
  { path: 'from_store', select: 'name company_id' },
  { path: 'to_store', select: 'name company_id' },
  { path: 'performed_by', select: 'point status level name pure_name avatar' },
  { path: 'approved_by', select: 'point status level name pure_name avatar' },
  { path: 'handled_by', select: 'point status level name pure_name avatar' }
];

const MovingTypesExtra = {
  ...MovingTypes,
  StoreToStore: 'store_to_store'
};

const Statuses = ['completed', 'cancelled', 'approved', 'pending'];

const RequesterTypes = ['stock', 'store'];

const RequestPermission = {
  [MovingTypes.StoreToStock]: ['owner', 'store_stock', 'company_stock'],
  [MovingTypes.StockToStore]: ['owner', 'store_stock', 'company_stock']
};

const ConfirmPermission = {
  [MovingTypes.StoreToStock]: ['owner', 'company_stock'],
  [MovingTypes.StockToStore]: ['owner', 'store_stock']
};

const ApprovePermission = ['owner', 'company_stock'];

const UpdateStockPermission = ['owner', 'company_stock'];

export {
  MovingTypes,
  CommonPopulatedFields,
  MovingTypesExtra,
  Statuses,
  RequesterTypes,
  RequestPermission,
  ConfirmPermission,
  ApprovePermission,
  UpdateStockPermission
};
