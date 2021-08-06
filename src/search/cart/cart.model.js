import { model, Schema } from 'mongoose';
import roundNumber from '../../commons/utils/round-number';
import orderHelper from '../order/order.helper';
import {
  Statuses as OptionStatuses,
  Types as OptionTypes,
  Units as OptionUnits
} from '../selling-option/selling-option.config';

const accompaniedProduct = new Schema({
  product_storing_id: {
    type: Schema.Types.ObjectId
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
    type: { type: String, enum: Object.values(OptionTypes) },
    required: { type: Boolean },
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
    product_storing_id: {
      type: Schema.Types.ObjectId,
      ref: 's_product_storing',
      get() {
        return this._id;
      }
    },
    product_id: {
      type: Schema.Types.ObjectId,
      ref: 's_product',
      get() {
        return this.id;
      }
    },
    company_id: { type: Schema.Types.ObjectId, ref: 's_company' },
    store_id: { type: Schema.Types.ObjectId, ref: 's_store' },
    promotion_code: String,
    promotion_id: Schema.Types.ObjectId,
    promotion_code_id: Schema.Types.ObjectId,
    global_promotion_code: String,
    global_promotion_id: Schema.Types.ObjectId,
    global_promotion_code_id: Schema.Types.ObjectId,
    quantity: { type: Number, min: 0, default: 1 },
    applied_promotion_quantity: { type: Number, applied_promotion_quantity: 0 },
    price: { type: Number },
    name: String,
    final_price: { type: Number },
    original_price: { type: Number },
    original_total: { type: Number },
    total: { type: Number },
    refund_rate: { type: Number, set: (x) => roundNumber(x, 2), get: (x) => roundNumber(x, 2) },
    original_refund_rate: {
      type: Number,
      set: (x) => roundNumber(x, 2),
      get: (x) => roundNumber(x, 2)
    },
    discount_rate: { type: Number, set: (x) => roundNumber(x, 2), get: (x) => roundNumber(x, 2) },
    refund: { type: Number },
    original_refund: { type: Number },
    total_refund: { type: Number },
    discount: { type: Number },
    total_discount: { type: Number },
    is_limited_stock: Boolean,
    is_free_transport: Boolean,
    stock: { type: Number },
    options: [optionSchema],
    model_id: { type: Schema.Types.ObjectId, required: true },
    accompanied_products: {
      type: [accompaniedProduct]
    },
    accompanied_product_price: { type: Number },
    model_list: {
      type: [Object]
    },
    tier_variations: [],
    model_name: { type: String },
    model_images: { type: [String] }
  },
  {
    timestamps: false,
    toObject: { virtuals: true, getters: true },
    toJSON: { virtuals: true, getters: true }
  }
);

productSchema.virtual('true_total_refund').get(function () {
  return roundNumber((this.total_refund * 9) / 10);
});
productSchema.virtual('product_promotion');

productSchema.virtual('true_refund_rate').get(function () {
  return roundNumber((this.refund_rate * 9) / 10, 4);
});
productSchema.virtual('true_original_refund_rate').get(function () {
  return this.original_refund_rate && roundNumber((this.original_refund_rate * 9) / 10, 4);
});

const orderSchema = new Schema(
  {
    store_id: { type: Schema.Types.ObjectId, ref: 's_store' },
    store_address: { type: {} },
    company_id: { type: Schema.Types.ObjectId, ref: 's_company' },
    products: { type: [productSchema], default: [] },
    promotion_code: String,
    promotion_id: Schema.Types.ObjectId,
    is_valid_promotion_code: { type: Boolean },
    promotion: {},
    original_total: { type: Number },
    total: { type: Number },
    total_refund: { type: Number },
    total_discount: { type: Number },
    transport_fee: { type: Number, set: (x) => roundNumber(x), get: (x) => roundNumber(x) },
    is_discount_transport: { type: Boolean },
    calculated_transport_fee: { type: Number },
    distance: { type: Number },
    logistics_provider: { type: String },
    logistics_display_name: String,
    logistics_info: { type: {}, default: {} },
    logistics_available: { type: [] },
    is_received_at_store: { type: Boolean, default: false },
    expected_received_date: { type: Date },
    note: String
  },
  { toObject: { virtuals: true }, toJSON: { virtuals: true }, timestamps: false }
);

orderSchema.virtual('true_total_refund').get(function () {
  return roundNumber((this.total_refund * 9) / 10);
});

const cartSchema = new Schema(
  {
    code: {
      type: String,
      required: true,
      index: true,
      unique: true,
      default: function () {
        return `${Math.round(Date.now() / 1000).toString(36)}${Math.random()
          .toString(36)
          .substr(2, 4)}`.toUpperCase();
      }
    },
    user_id: { type: Schema.Types.ObjectId, ref: 'Users', required: true, index: true },
    orders: { type: [orderSchema], default: [] },
    is_confirmed: { type: Boolean, default: false },
    is_checkouted: { type: Boolean, default: false },
    is_paid: { type: Boolean },
    total: { type: Number },
    original_total: { type: Number },
    total_discount: { type: Number },
    total_refund: { type: Number },
    total_transport_fee: { type: Number },
    payment_method: { type: String, enum: ['COD', 'WALLET', 'VNPAY', 'ALEPAY'] },
    receipt_code: { type: String },
    delivery_address: {
      default: {},
      address_id: String,
      province: String,
      district: String,
      ward: String,
      text: String,
      receiver: String,
      phone_number: String,
      normalizedAddress: String
    },
    checkouted_date: Date,
    is_lucky: Boolean
  },
  { timestamps: true, toObject: { virtuals: true }, toJSON: { virtuals: true }, id: false }
);

cartSchema.virtual('true_total_refund').get(function () {
  return roundNumber((this.total_refund * 9) / 10);
});

orderSchema.methods = {
  getPromotionCode: orderHelper.v1.getPromotionCode,
  getPrice: orderHelper.v1.getPrice,
  getPriceV2: orderHelper.v2.getPriceV2,
  getPriceV3: orderHelper.v3.getPriceV3
};

cartSchema.method('getTotal', function () {
  const total = this.orders.reduce(
    (prev, curt) => {
      return {
        total_discount: prev.total_discount + curt.total_discount || 0,
        total_refund: prev.total_refund + curt.total_refund || 0,
        total: prev.total + curt.total || 0,
        original_total: prev.original_total + curt.original_total || 0,
        total_transport_fee:
          curt.transport_fee !== undefined ? prev.total_transport_fee + curt.transport_fee : 0
      };
    },
    {
      total_discount: 0,
      total_refund: 0,
      total: 0,
      original_total: 0,
      total_transport_fee: 0
    }
  );
  Object.assign(this, total);
});

productSchema.virtual('storing', {
  ref: 's_product_storing',
  localField: '_id',
  foreignField: '_id',
  justOne: true
});

productSchema.virtual('storings', {
  ref: 's_product_storing',
  localField: 'id',
  foreignField: 'product_id'
});

productSchema.virtual('detail', {
  ref: 's_product',
  localField: 'id',
  foreignField: '_id',
  justOne: true
});

productSchema.virtual('storing_detail', {
  ref: 's_product_storing',
  localField: '_id',
  foreignField: '_id',
  justOne: true
});

orderSchema.virtual('store', {
  ref: 's_store',
  localField: 'store_id',
  foreignField: '_id',
  justOne: true
});

orderSchema.virtual('company', {
  ref: 's_company',
  localField: 'company_id',
  foreignField: '_id',
  justOne: true
});

export default model('s_cart', cartSchema);
