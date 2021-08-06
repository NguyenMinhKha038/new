export const PopulatedFields = [
  // products
  {
    path: 'products.product',
    select: '_id stock name thumbnail price discount discount_rate is_limited_stock'
  },
  { path: 'products.from_product_storing', select: '_id stock is_limited_stock transportable' },
  { path: 'products.to_product_storing', select: '_id stock is_limited_stock transportable' },
  { path: 'products.from_mall_storing', select: '_id stock is_limited_stock transportable' },
  { path: 'products.to_mall_storing', select: '_id stock is_limited_stock transportable' },
  // batches
  {
    path: 'batches.batch',
    select:
      '_id batch_code stock batch_stock on_sales provider_name status transportable manufacturing_date expiry_date origin'
  },
  {
    path: 'batches.original_batch',
    select: '_id is_transported stock place_of_stock status transportable'
  },
  {
    path: 'batches.product',
    select: '_id stock name thumbnail price discount discount_rate is_limited_stock model_list'
  },
  {
    path: 'batches.from_warehouse_storing',
    select: '_id stock is_limited_stock transportable model_list'
  },
  {
    path: 'batches.to_warehouse_storing',
    select: '_id stock is_limited_stock transportable model_list'
  },
  {
    path: 'batches.from_mall_storing',
    select: '_id stock is_limited_stock transportable model_list'
  },
  {
    path: 'batches.to_mall_storing',
    select: '_id stock is_limited_stock transportable model_list'
  },
  {
    path: 'batches.from_product_storing',
    select: '_id stock is_limited_stock transportable model_list'
  },
  {
    path: 'batches.to_product_storing',
    select: '_id stock is_limited_stock transportable model_list'
  },
  // general
  { path: 'user', select: '_id phone name avatar' },
  { path: 'from_store', select: '_id name address location status' },
  { path: 'to_store', select: '_id name address location' },
  { path: 'from_mall', select: '_id name address location status' },
  { path: 'to_mall', select: '_id name address location' },
  { path: 'from_warehouse', select: '_id name address location status' },
  { path: 'to_warehouse', select: '_id name address location' },
  { path: 'company', select: '_id name logo email phone address' },
  {
    path: 'transaction',
    select:
      '_id type status without_product original_total total code payment_method reason_canceled reason_rejected'
  },
  { path: 'requester.user', select: '_id phone name avatar' },
  { path: 'approver.user', select: '_id phone name avatar' },
  { path: 'confirmor.user', select: '_id phone name avatar' }
];
export const Types = {
  Import: 'import',
  Export: 'export',
  LocalImport: 'local_import',
  LocalExport: 'local_export',
  Sell: 'sell',
  Refund: 'refund',
  Move: 'move',
  Edit: 'edit'
};
export const Statuses = {
  Completed: 'completed',
  Pending: 'pending',
  Cancelled: 'cancelled',
  Approved: 'approved'
};
export const RelateTo = {
  Warehouse: 'warehouse',
  Store: 'store',
  Mall: 'mall',
  All: 'all',
  Mall_Mall: 'mall_mall',
  Warehouse_Warehouse: 'warehouse_warehouse',
  Store_Store: 'store_store',
  Warehouse_Store: 'warehouse_store',
  Store_Warehouse: 'warehouse_store',
  Warehouse_Mall: 'warehouse_mall',
  Mall_Warehouse: 'warehouse_mall',
  Mall_Store: 'mall_store',
  Store_Mall: 'mall_store'
};

export default {
  PopulatedFields,
  Types,
  Statuses,
  RelateTo
};
