export const Statuses = {
  Active: 'active',
  Disabled: 'disabled'
};

export const PopulatedFields = [
  { path: 'store', select: 'name pure_name status address location' },
  {
    path: 'company',
    select: 'name pure_name status address logo cover_images online_sales'
  },
  {
    path: 'user',
    select: 'status name pure_name avatar email'
  },
  {
    path: 'products.options',
    select: 'name pure_name unit image_url options type'
  },
  {
    path: 'products.product',
    select: 'name pure_name thumbnail SKU description'
  },
  {
    path: 'products.product_storing',
    select: 'name pure_name stock price pid stock description refund_rate discount_rate'
  }
];
