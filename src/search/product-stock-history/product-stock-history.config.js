const FieldSelections = {
  'products.from_product_storing': '_id stock is_limited_stock transportable',
  'products.to_product_storing': '_id stock is_limited_stock transportable',
  'products.product': '_id stock name thumbnail price discount discount_rate is_limited_stock',
  performed_by: '_id phone name avatar',
  handled_by: '_id phone name avatar',
  approved_by: '_id phone name avatar',
  user: '_id phone name avatar',
  from_store: '_id name address location status',
  to_store: '_id name address location',
  company: '_id name logo email phone address',
  transaction:
    '_id type status without_product original_total total code payment_method reason_canceled reason_rejected'
};

const Types = ['import', 'export', 'sell', 'refund', 'move'];

const Statuses = ['completed', 'pending', 'cancelled', 'approved'];

const RelateTo = ['stock', 'store', 'both'];

const GetPermission = ['owner', 'store_stock', 'company_stock', 'store_manager'];

export { FieldSelections, Types, Statuses, RelateTo, GetPermission };
