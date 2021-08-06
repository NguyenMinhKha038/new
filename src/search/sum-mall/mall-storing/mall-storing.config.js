export const PopulatedFields = [
  { path: 'mall', select: 'name status address location' },
  {
    path: 'product',
    select:
      'status name pure_name is_limited_stock company_category_id sub_category_id type_category_id price refund_rate refund thumbnail pid'
  },
  { path: 'detail' }
];
export const DeletedStatus = 'disabled';
export const Statuses = {
  Active: 'active',
  Inactive: 'inactive'
};
export const QueryStatuses = {
  Active: 'active',
  Inactive: 'inactive',
  Disabled: 'disabled'
};
