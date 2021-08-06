export const OrderType = { online: 'online', offline: 'offline' };
export const OrderStatus = {
  handling: 'handling',
  picking: 'picking',
  delivering: 'delivering',
  delivered: 'delivered',
  completed: 'completed',
  companyCanceled: 'company_canceled',
  userCanceled: 'user_canceled',
  userRejected: 'user_rejected',
  lostDamage: 'lost_damage',
  exception: 'exception'
};

export const OrderPaymentMethod = {
  cod: 'COD',
  wallet: 'WALLET',
  cash: 'CASH',
  vnpay: 'VNPAY',
  alepay: 'ALEPAY'
};

export const OrderFinalStatuses = [
  'completed',
  'user_canceled',
  'company_canceled',
  'user_rejected',
  'lost_damage'
];

export const CanceledReasons = {
  c0: {
    vi: 'Lý do khác',
    en: 'Other'
  },
  c1: {
    vi: 'Không còn nhu cầu',
    en: 'No longer need'
  },
  c2: {
    vi: 'Đổi hình thức thanh toán',
    en: 'Change payment method'
  },
  c3: {
    vi: 'Thời gian giao hàng không như mong muốn',
    en: 'Unexpected delivery time'
  },
  c4: {
    vi: 'Đặt trùng sản phẩm',
    en: 'Order same products'
  },
  c5: {
    vi: 'Thay đổi số lượng',
    en: 'Change quantity of products'
  },
  c6: {
    vi: 'Thay đổi địa chỉ nhận hàng',
    en: 'Change received address'
  }
};

export const RejectedReasons = {
  r0: {
    vi: 'Khác',
    en: 'Other'
  },
  r1: {
    vi: 'Sai sản phẩm',
    en: 'Wrong product'
  },
  r2: {
    vi: 'Sản phẩm không giống miêu tả',
    en: 'Product is not the same as described'
  },
  r3: {
    vi: 'Hình thức không đảm bảo',
    en: 'Poor appearance'
  }
};

export const OrderStatusTypes = {
  status: ['handling', 'delivered', 'completed', 'company_canceled', 'user_rejected'],
  progress_status: ['ready']
};

export const DefaultLimit = 20;

export const MaxLimit = 50;

export const PopulatedFields = {
  store: { path: 'store', select: 'name pure_name status address location' },
  company: {
    path: 'company',
    select: 'name pure_name status address logo cover_images online_sales'
  },
  promotion: {
    path: 'products.promotion',
    select: 'name pure_name status type value refund start_at expire_at unlimit total'
  },
  buyer: {
    path: 'buyer'
  }
};
