export const Types = { Online: 'online', Offline: 'offline' };

export const SaleForms = { Retail: 'retail', Wholesale: 'wholesale' };

export const Statuses = {
  Handling: 'handling',
  Picking: 'picking',
  Delivering: 'delivering',
  Delivered: 'delivered',
  Completed: 'completed',
  CompanyCanceled: 'company_canceled',
  UserCanceled: 'user_canceled',
  UserRejected: 'user_rejected',
  LostDamage: 'lost_damage',
  Exception: 'exception'
};

export const PaymentMethods = {
  COD: 'COD',
  Wallet: 'WALLET',
  Cash: 'CASH',
  Vnpay: 'VNPAY',
  Alepay: 'ALEPAY'
};

export const PaymentTypes = {
  Prepaid: 'prepaid',
  Postpaid: 'postpaid'
};

export const FinalStatuses = {
  Completed: 'completed',
  CompanyCanceled: 'company_canceled',
  UserCanceled: 'user_canceled',
  UserRejected: 'user_rejected',
  LostDamage: 'lost_damage',
  Exception: 'exception'
};

export const CanceledReasons = {
  C0: {
    vi: 'Lý do khác',
    en: 'Other'
  },
  C1: {
    vi: 'Không còn nhu cầu',
    en: 'No longer need'
  },
  C2: {
    vi: 'Đổi hình thức thanh toán',
    en: 'Change payment method'
  },
  C3: {
    vi: 'Thời gian giao hàng không như mong muốn',
    en: 'Unexpected delivery time'
  },
  C4: {
    vi: 'Đặt trùng sản phẩm',
    en: 'Order same products'
  },
  C5: {
    vi: 'Thay đổi số lượng',
    en: 'Change quantity of products'
  },
  C6: {
    vi: 'Thay đổi địa chỉ nhận hàng',
    en: 'Change received address'
  }
};

export const RejectedReasons = {
  R0: {
    vi: 'Khác',
    en: 'Other'
  },
  R1: {
    vi: 'Sai sản phẩm',
    en: 'Wrong product'
  },
  R2: {
    vi: 'Sản phẩm không giống miêu tả',
    en: 'Product is not the same as described'
  },
  R3: {
    vi: 'Hình thức không đảm bảo',
    en: 'Poor appearance'
  }
};

export const ProgressStatuses = {
  Pending: 'pending',
  Handling: 'handling',
  Ready: 'ready'
};

export const StatusesFrom = {
  [Statuses.Completed]: [Statuses.Delivered, Statuses.Delivering, Statuses.Handling],
  [Statuses.Delivered]: [Statuses.Delivering, Statuses.Picking, Statuses.Handling],
  [Statuses.Delivering]: [Statuses.Picking, Statuses.Handling],
  [Statuses.Picking]: [Statuses.Handling, Statuses.Pending],
  [Statuses.Handling]: [Statuses.Pending],
  [Statuses.CompanyCanceled]: [Statuses.Picking, Statuses.Handling, Statuses.Pending],
  [Statuses.UserCanceled]: [Statuses.Handling, Statuses.Pending],
  [Statuses.UserRejected]: [Statuses.Delivered, Statuses.Delivering],
  [Statuses.LostDamage]: [Statuses.Delivering, Statuses.Picking],
  [Statuses.Exception]: [
    Statuses.Delivered,
    Statuses.Delivering,
    Statuses.Picking,
    Statuses.Handling,
    Statuses.Pending
  ]
};

export const DefaultCompletedDate = 7;

export const DefaultLimit = 20;

export const MaxLimit = 50;

export const PopulatedFields = [
  { path: 'store', select: 'name pure_name status address location' },
  { path: 'mall', select: 'name pure_name status address location' },
  { path: 'seller', select: 'name pure_name status' },
  { path: 'cashier', select: 'name pure_name status' },
  { path: 'user', select: 'name pure_name status phone' },
  { path: 'buyer', select: 'name pure_name status phone' },
  {
    path: 'company',
    select: 'name pure_name status address logo cover_images online_sales'
  },
  {
    path: 'products.detail'
  },
  {
    path: 'products.product',
    select:
      'name pure_name stock price pid stock description refund_rate discount_rate unit stock_per_box box_unit'
  },
  {
    path: 'products.promotion',
    select: 'name pure_name status type value refund start_at expire_at unlimit total products'
  },
  {
    path: 'products.product_storing',
    select:
      'stock batch_stock on_sales_stock is_limited_stock true_refund total_refund_rate refund promotion product_id refund_rate unit stock_per_box box_unit'
  },
  {
    path: 'products.mall_storing',
    select:
      'stock batch_stock on_sales_stock stock is_limited_stock true_refund total_refund_rate refund promotion product_id refund_rate'
  }
];

export const StatisticTypes = {
  CompletedDay: 'completed_day',
  CompletedMonth: 'completed_month',
  CompletedYear: 'completed_year'
};
