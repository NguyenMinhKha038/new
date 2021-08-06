import { model, Schema } from 'mongoose';
import { getDate } from '../../commons/utils';
import { handleXss, removeFields } from '../../commons/utils/utils';
import roundNumber from '../../commons/utils/round-number';
import orderHelper from '../order/order.helper';
import { DefaultExpiryTime } from './order-caching.config';
import {
  Statuses as OptionStatuses,
  Types as OptionTypes,
  Units as OptionUnits
} from '../selling-option/selling-option.config';
import { SaleForms } from '../order/v2/order.config';

const accompaniedProduct = new Schema({
  product_storing_id: {
    type: Schema.Types.ObjectId,
    required: true
  },
  quantity: {
    type: Number,
    required: true
  }
});

accompaniedProduct.virtual('accompanied_product', {
  ref: 's_product_storing',
  localField: 'product_storing_id',
  foreignField: '_id',
  justOne: true
});

const optionItemSchema = new Schema(
  {
    status: { type: String, enum: Object.values(OptionStatuses) },
    name: { type: String, trim: true },
    value: { type: Schema.Types.Mixed, trim: true },
    image_url: { type: String, trim: true },
    price: { type: Number, min: 0 },
    quantity: { type: Number },
    is_limited_quantity: { type: Boolean }
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

const optionSchema = new Schema(
  {
    company_id: { type: Schema.Types.ObjectId },
    store_id: { type: Schema.Types.ObjectId },
    status: { type: String, enum: Object.values(OptionStatuses) },
    required: { type: Boolean },
    type: { type: String, enum: Object.values(OptionTypes) },
    name: { type: String, trim: true },
    pure_name: { type: String, trim: true },
    image_url: { type: String, trim: true },
    unit: { type: String, enum: Object.values(OptionUnits) },
    item: { type: optionItemSchema }
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

const productSchema = new Schema(
  {
    _id: { type: Schema.Types.ObjectId, ref: 's_product_storing' },
    id: { type: Schema.Types.ObjectId, ref: 's_product' },
    product_storing_id: { type: Schema.Types.ObjectId, ref: 's_product_storing' },
    mall_storing_id: { type: Schema.Types.ObjectId, ref: 's_mall_storing' },
    product_id: { type: Schema.Types.ObjectId, ref: 's_product' },
    company_id: { type: Schema.Types.ObjectId, ref: 's_company' },
    store_id: { type: Schema.Types.ObjectId, ref: 's_store' },
    promotion_code: String,
    promotion_id: Schema.Types.ObjectId,
    promotion_code_id: Schema.Types.ObjectId,
    type_category_id: String,
    company_category_id: String,
    sub_category_id: String,
    thumbnail: String,
    quantity: { type: Number, min: 0, default: 1 },
    applied_promotion_quantity: { type: Number, applied_promotion_quantity: 0 },
    price: { type: Number },
    name: String,
    final_price: { type: Number },
    original_price: { type: Number },
    original_total: { type: Number },
    total: { type: Number },
    refund_rate: { type: Number, set: (x) => roundNumber(x, 2), get: (x) => roundNumber(x, 2) },
    discount_rate: { type: Number, set: (x) => roundNumber(x, 2), get: (x) => roundNumber(x, 2) },
    refund: { type: Number },
    total_refund: { type: Number },
    discount: { type: Number },
    total_discount: { type: Number },
    is_limited_stock: Boolean,
    is_free_transport: Boolean,
    stock: { type: Number },
    options: [optionSchema],
    model_id: { type: Schema.Types.ObjectId },
    accompanied_products: {
      type: [accompaniedProduct]
    },
    accompanied_product_price: { type: Number },
    model_name: { type: String },
    model_images: { type: [String] },
    model_list: [Object],
    box_quantity: Number,
    box_price: Number,
    type: { type: String, enum: Object.values(SaleForms) }
  },
  { timestamps: false, toObject: { virtuals: true }, toJSON: { virtuals: true } }
);

productSchema.virtual('true_refund_rate').get(function () {
  return roundNumber((this.refund_rate * 9) / 10, 4);
});

productSchema.virtual('true_total_refund').get(function () {
  return roundNumber((this.total_refund * 9) / 10);
});

productSchema.virtual('product', {
  ref: 's_product',
  localField: 'product_id',
  foreignField: '_id',
  justOne: true
});

productSchema.virtual('product_storing', {
  ref: 's_product_storing',
  localField: 'product_storing_id',
  foreignField: '_id',
  justOne: true
});

productSchema.virtual('mall_storing', {
  ref: 's_mall_storing',
  localField: 'mall_storing_id',
  foreignField: '_id',
  justOne: true
});

productSchema.virtual('promotion', {
  ref: 's_promotion',
  localField: 'promotion_id',
  foreignField: '_id',
  justOne: true
});

productSchema.virtual('promotion_total').get(function () {
  const { promotion_total } = getPromotionQuantity(this.promotion, this.id);
  return promotion_total;
});

productSchema.virtual('promotion_remain').get(function () {
  const { promotion_remain } = getPromotionQuantity(this.promotion, this.id);
  return promotion_remain;
});
function getPromotionQuantity(promotion, product_id) {
  let promotion_total = 0;
  let promotion_remain = 0;
  if (promotion && product_id) {
    const { products } = promotion;
    if (typeof product_id !== 'string') {
      product_id = product_id._id;
    }
    const productPromotion = products.find(
      (item) => item.product_id.toString() === product_id.toString()
    );
    if (productPromotion) {
      if (productPromotion.unlimited) {
        promotion_total = 'unlimited';
        promotion_remain = 'unlimited';
      } else {
        promotion_total = productPromotion.total;
        promotion_remain = productPromotion.remain;
      }
    }
  }

  return {
    promotion_total,
    promotion_remain
  };
}

const orderCachingSchema = new Schema(
  {
    products: {
      type: [productSchema],
      default: []
    },
    cart_id: { type: Schema.Types.ObjectId, ref: 's_cart' },
    store_id: { type: Schema.Types.ObjectId, ref: 's_store' },
    mall_id: { type: Schema.Types.ObjectId, ref: 's_mall' },
    company_id: {
      type: Schema.Types.ObjectId,
      // required: true,
      ref: 's_company'
    },
    user_id: {
      type: Schema.Types.ObjectId,
      ref: 'Users'
    },
    seller_id: {
      type: Schema.Types.ObjectId
    },
    cashier_id: {
      type: Schema.Types.ObjectId
    },
    original_total: {
      type: Number,
      min: 0,
      set: (x) => roundNumber(x),
      get: (x) => roundNumber(x)
    },
    total: {
      type: Number,
      min: 0,
      set: (x) => roundNumber(x),
      get: (x) => roundNumber(x)
    },
    transport_fee: { type: Number, set: (x) => roundNumber(x), get: (x) => roundNumber(x) },
    calculated_transport_fee: {
      type: Number,
      set: (x) => roundNumber(x),
      get: (x) => roundNumber(x)
    },
    actual_transport_fee: {
      type: Number,
      set: (x) => roundNumber(x),
      get: (x) => roundNumber(x)
    },
    is_discount_transport: {
      type: Boolean
    },
    is_confirmed: { type: Boolean, default: false },
    waybill_code: { type: String },
    expected_delivery_time: { type: Date },
    discount_rate: {
      type: Number,
      default: 0,
      set: (x) => roundNumber(x, 2),
      get: (x) => roundNumber(x, 2)
    },
    total_discount: {
      type: Number,
      min: 0,
      default: 0,
      set: (x) => roundNumber(x),
      get: (x) => roundNumber(x)
    },
    refund_rate: {
      type: Number,
      default: 0,
      set: (x) => roundNumber(x, 2),
      get: (x) => roundNumber(x, 2)
    },
    total_refund: {
      type: Number,
      min: 0,
      default: 0,
      set: (x) => roundNumber(x),
      get: (x) => roundNumber(x)
    },
    code: {
      type: String,
      required: true,
      index: true,
      unique: true,
      default: function () {
        return `${Math.round(Date.now() / 1000).toString(36)}${Math.random()
          .toString(36)
          .substr(2, 5)}`.toUpperCase();
      }
    },
    type: {
      type: String,
      enum: ['online', 'offline'],
      default: 'online'
    },
    without_product: {
      type: Boolean,
      default: false
    },
    payment_method: {
      type: String,
      enum: ['COD', 'WALLET', 'CASH', 'VNPAY']
    },
    payment_type: {
      type: String,
      enum: ['prepaid', 'postpaid']
    },
    delivery_address: {
      province: String,
      district: String,
      ward: String,
      text: String,
      receiver: String,
      phone_number: String,
      normalizedAddress: String
    },
    store_address: {
      province: String,
      district: String,
      ward: String,
      text: String,
      manager_name: String,
      phone_number: String,
      normalizedAddress: String
    },
    status: {
      type: String,
      enum: [
        'pending',
        'handling',
        'picking',
        'delivering',
        'delivered',
        'user_canceled',
        'user_rejected',
        'company_canceled',
        'completed'
      ],
      default: 'pending'
    },
    promotion_code: String,
    promotion_id: Schema.Types.ObjectId,
    is_paid: {
      type: Boolean
    },
    total_service_fee: {
      type: Number,
      set: (x) => roundNumber(x),
      get: (x) => roundNumber(x)
    },
    reason_canceled: String,
    reason_rejected: String,
    logistics_provider: String,
    logistics_display_name: String,
    logistics_info: {},
    is_created_from_menu: { type: Boolean },
    position: { type: String },
    is_company_paid_transport_fee: Boolean,
    logistics_progress: {
      type: [{ date: Date, status: String }],
      default: []
    },
    progress_status: { type: String, enum: ['pending', 'handling', 'ready'] },
    is_lucky: Boolean,
    lucky_product_id: Schema.Types.ObjectId,
    date: { type: Date, default: getDate },
    is_received_at_store: Boolean,
    expected_received_date: Date,
    note: { type: String, maxlength: 300, trim: true },
    company_notes: [{ type: String, trim: true }],
    ready_date: Date,
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + DefaultExpiryTime) // 7 day
    }
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

orderCachingSchema.index({ is_confirmed: 1, expiresAt: 1, status: 1 });

orderCachingSchema
  .virtual('company_note')
  .get(function () {
    return (this.company_notes || [])[0];
  })
  .set(function (note) {
    if (note) {
      const notes = this.company_notes || [];
      notes.unshift(note);
      this.set({ company_notes: notes });
    }
  });

orderCachingSchema.virtual('true_total_refund').get(function () {
  return roundNumber((this.total_refund * 9) / 10, 2);
});

orderCachingSchema.virtual('user', {
  ref: 'Users',
  localField: 'user_id',
  foreignField: '_id',
  justOne: true
});

orderCachingSchema.virtual('cashier', {
  ref: 'Users',
  localField: 'cashier_id',
  foreignField: '_id',
  justOne: true
});
orderCachingSchema.virtual('seller', {
  ref: 'Users',
  localField: 'seller_id',
  foreignField: '_id',
  justOne: true
});

orderCachingSchema.virtual('company', {
  ref: 's_company',
  localField: 'company_id',
  foreignField: '_id',
  justOne: true
});

orderCachingSchema.virtual('store', {
  ref: 's_store',
  localField: 'store_id',
  foreignField: '_id',
  justOne: true
});

orderCachingSchema.virtual('mall', {
  ref: 's_mall',
  localField: 'mall_id',
  foreignField: '_id',
  justOne: true
});

orderCachingSchema.virtual('products.promotion', {
  ref: 's_promotion',
  localField: 'products.promotion_id',
  foreignField: '_id',
  justOne: true
});

orderCachingSchema.virtual('can_canceled_by_company').get(function () {
  if (this.type === 'offline') return true;
  if (this.is_received_at_store)
    if (+new Date() > +this.ready_date + 3 * 24 * 60 * 60 * 1000) return true;
    else return false;
});

orderCachingSchema.methods = {
  getPriceV2: orderHelper.v2.getPriceV2,
  getPriceV3: orderHelper.v3.getPriceV3,
  removeFields: removeFields
};

const orderCachingModel = model('s_order_caching', orderCachingSchema);
orderCachingModel.createCollection();
export default orderCachingModel;
