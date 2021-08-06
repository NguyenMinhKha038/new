export const PopulatedFields = [
  {
    path: 'store',
    select: 'name address location max_refund max_discount discount_rate'
  },
  { path: 'company', select: 'name status address' },
  {
    path: 'product',
    select:
      'images description views_count likes_count comments_count status name pure_name is_limited_stock company_category_id sub_category_id type_category_id price refund_rate refund thumbnail pid SKU'
  },
  {
    path: 'options',
    select: 'required name pure_name unit image_url options'
  },
  {
    path: 'selections',
    select: 'required name pure_name unit image_url options'
  },
  { path: 'detail' },
  { path: 'groups', select: 'name pure_name value pure_value status type scope expiry_date' },
  { path: 'tags', select: 'name pure_name value pure_value status type scope expiry_date' }
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
