const ActionTypes = ['insert', 'update', 'delete'];
const DefaultLimit = 50;
const OnModels = [
  'admins',
  'Permissions',
  'admin_banks',
  's_banner',
  's_company',
  's_category',
  's_revenue',
  's_comment',
  's_deposit_withdraw',
  's_lucky_shopping',
  's_product',
  's_order',
  's_promotion',
  's_report',
  's_product_attribute',
  's_product_template'
];

export const Types = {
  Insert: 'insert',
  Update: 'update',
  Delete: 'delete'
};

export default {
  ActionTypes,
  DefaultLimit,
  OnModels
};
