export const Statuses = {
  Pending: 'pending',
  Checked: 'checked',
  Disabled: 'disabled'
};

export const PopulatedFields = [
  {
    path: 'stock_checking'
  },
  {
    path: 'product_storing'
  },
  {
    path: 'warehouse_storing'
  },
  {
    path: 'product',
    select: 'images name price'
  }
];
