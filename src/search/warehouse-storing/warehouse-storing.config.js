export const PopulatedFields = [
  { path: 'company', select: 'name status address' },
  {
    path: 'product',
    select:
      'status name pure_name is_limited_stock company_category_id sub_category_id type_category_id price refund_rate refund thumbnail pid model_list unit box_unit'
  },
  { path: 'detail' },
  { path: 'attributes.product_attribute', select: 'name pure_name status values' }
];

export const DeletedStatus = 'disabled';

export const Statuses = {
  Active: 'active',
  Inactive: 'inactive'
};
