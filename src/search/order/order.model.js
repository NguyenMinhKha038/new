import { model, Schema } from 'mongoose';
import { getDate } from '../../commons/utils';
import { handleXss, removeFields } from '../../commons/utils/utils';
import roundNumber from '../../commons/utils/round-number';
import companyService from '../company/company.service';
import statisticService from '../statistic/statistic.service';
import storeService from '../store/store.service';
import {
  Statuses as OptionStatuses,
  Types as OptionTypes,
  Units as OptionUnits,
  Units
} from '../selling-option/selling-option.config';
import {
  Types,
  PaymentTypes,
  Statuses,
  PaymentMethods,
  DefaultCompletedDate,
  AccompaniedProductStatuses,
  SaleForms
} from './v2/order.config';
import orderHelper from './order.helper';
import settingService from '../setting/setting.service';

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
    model_id: { type: Schema.Types.ObjectId },
    accompanied_products: {
      type: [accompaniedProduct]
    },
    accompanied_product_price: { type: Number },
    model_name: { type: String },
    model_images: { type: [String] },
    type: { type: String, enum: Object.values(SaleForms) },
    box_quantity: Number,
    box_price: Number,
    model_list: {
      type: [Object]
    }
  },
  {
    timestamps: false,
    toObject: { virtuals: true, getters: true },
    toJSON: { virtuals: true, getters: true }
  }
);
productSchema.virtual('true_refund_rate').get(function () {
  return roundNumber((this.refund_rate * 9) / 10, 4);
});

productSchema.virtual('true_original_refund_rate').get(function () {
  return this.original_refund_rate && roundNumber((this.original_refund_rate * 9) / 10, 4);
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

const orderSchema = new Schema(
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
      ref: 'Users',
      index: true
    },
    buyer_id: {
      type: Schema.Types.ObjectId,
      ref: 's_buyer'
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
    additional_transport_fee: {
      type: Number,
      set: (x) => roundNumber(x),
      get: (x) => roundNumber(x)
    },
    company_transport_fee: {
      type: Number,
      set: (x) => roundNumber(x),
      get: (x) => roundNumber(x)
    },
    return_transport_fee: {
      type: Number,
      set: (x) => roundNumber(x),
      get: (x) => roundNumber(x)
    },
    is_discount_transport: {
      type: Boolean
    },
    is_confirmed: Boolean,
    waybill_code: { type: String },
    receipt_code: { type: String },
    expected_delivery_time: { type: Date },
    discount_rate: {
      type: Number,
      set: (x) => roundNumber(x, 4),
      get: (x) => roundNumber(x, 4)
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
      set: (x) => roundNumber(x, 4),
      get: (x) => roundNumber(x, 4)
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
      enum: Object.values(Types),
      default: Types.Online
    },
    without_product: {
      type: Boolean,
      default: false
    },
    payment_method: {
      type: String,
      enum: Object.values(PaymentMethods)
    },
    payment_type: {
      type: String,
      enum: Object.values(PaymentTypes),
      default: PaymentTypes.Prepaid
    },
    delivery_address: {
      address_id: Schema.Types.ObjectId,
      province: String,
      district: String,
      ward: String,
      text: String,
      receiver: String,
      phone_number: String,
      normalizedAddress: String
    },
    store_address: {
      name: String,
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
      enum: Object.values(Statuses),
      default: Statuses.Handling
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
    is_created_from_menu: { type: Boolean, default: false },
    position: { type: String },
    is_company_paid_service_fee: Boolean,
    is_company_paid_transport_fee: Boolean,
    is_company_paid_return_fee: Boolean,

    logistics_progress: {
      type: [{ date: Date, status: String, description: String }],
      default: []
    },
    progress_status: { type: String, enum: ['pending', 'handling', 'ready'] },
    is_lucky: Boolean,
    lucky_product_id: Schema.Types.ObjectId,
    date: { type: Date, default: Date.now },
    day: {
      type: String,
      default: function () {
        const isoDateStr = new Date(this.date).toISOString().split('T')[0];
        return isoDateStr;
      }
    },
    month: {
      type: String,
      default: function () {
        const isoDateStr = new Date(this.date).toISOString().split('T')[0];
        return isoDateStr.substr(0, 7);
      }
    },
    year: {
      type: String,
      default: function () {
        const isoDateStr = new Date(this.date).toISOString().split('T')[0];
        return isoDateStr.substr(0, 4);
      }
    },
    is_received_at_store: Boolean,
    expected_received_date: Date,
    note: { type: String, maxlength: 300, trim: true },
    company_notes: [{ type: String, trim: true }],
    ready_date: Date,
    is_received_by_user: {
      type: Boolean
    },
    delivered_date: {
      type: Date
    },
    completed_date: { type: Date },
    completed_day: { type: String },
    completed_month: { type: String },
    completed_year: { type: String }
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

orderSchema
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

orderSchema.virtual('true_total_refund').get(function () {
  return roundNumber((this.total_refund * 9) / 10, 2);
});

orderSchema.virtual('user', {
  ref: 'Users',
  localField: 'user_id',
  foreignField: '_id',
  justOne: true
});

orderSchema.virtual('buyer', {
  ref: 's_buyer',
  localField: 'buyer_id',
  foreignField: '_id',
  justOne: true
});

orderSchema.virtual('cashier', {
  ref: 'Users',
  localField: 'cashier_id',
  foreignField: '_id',
  justOne: true
});
orderSchema.virtual('seller', {
  ref: 'Users',
  localField: 'seller_id',
  foreignField: '_id',
  justOne: true
});

orderSchema.virtual('company', {
  ref: 's_company',
  localField: 'company_id',
  foreignField: '_id',
  justOne: true
});

orderSchema.virtual('store', {
  ref: 's_store',
  localField: 'store_id',
  foreignField: '_id',
  justOne: true
});

orderSchema.virtual('mall', {
  ref: 's_mall',
  localField: 'mall_id',
  foreignField: '_id',
  justOne: true
});

orderSchema.virtual('can_canceled_by_company').get(function () {
  if (this.type === 'offline') return true;
  if (this.is_received_at_store)
    if (+new Date() > +this.ready_date + 3 * 24 * 60 * 60 * 1000) return true;
    else return false;
});

orderSchema.pre('save', async function () {
  if (this.isNew) {
    if (this.company_id) {
      const companySetting = await settingService.get(this.company_id);
      this.payment_type = companySetting.payment_type;
    }

    // Below lines cause WriteConflict error when executed in a transaction with other
    // operations relate to [statistic, company, store].
    statisticService.update({ total_order: 1 });
    // companyService.changeCount(this.company_id, { total_order: 1 });
    // storeService.changeCount(this.store_id, { total_order: 1 });
  }
  if (this.isModified('status')) {
    const curDate = new Date();
    if (this.status === Statuses.Delivered) {
      this.completed_date = new Date(new Date().setDate(curDate.getDate() + DefaultCompletedDate));
      const isoDateStr = new Date(this.completed_date).toISOString().split('T')[0];
      this.completed_year = isoDateStr.substr(0, 4);
      this.completed_month = isoDateStr.substr(0, 7);
      this.completed_day = isoDateStr;
    } else if (this.status === Statuses.Completed) {
      this.completed_date = curDate;
      const isoDateStr = new Date(this.completed_date).toISOString().split('T')[0];
      this.completed_year = isoDateStr.substr(0, 4);
      this.completed_month = isoDateStr.substr(0, 7);
      this.completed_day = isoDateStr;
    }
  }
});

orderSchema.pre('findOneAndUpdate', function () {
  if (this._update.status) {
    const curDate = new Date();
    if (this._update.status === Statuses.Delivered) {
      this._update.completed_date = new Date(
        new Date().setDate(curDate.getDate() + DefaultCompletedDate)
      );
      const isoDateStr = new Date(this._update.completed_date).toISOString().split('T')[0];
      this._update.completed_year = isoDateStr.substr(0, 4);
      this._update.completed_month = isoDateStr.substr(0, 7);
      this._update.completed_day = isoDateStr;
    } else if (this._update.status === Statuses.Completed) {
      this._update.completed_date = curDate;
      const isoDateStr = new Date(this._update.completed_date).toISOString().split('T')[0];
      this._update.completed_year = isoDateStr.substr(0, 4);
      this._update.completed_month = isoDateStr.substr(0, 7);
      this._update.completed_day = isoDateStr;
    }
  }
});

orderSchema.methods = {
  getPriceV2: orderHelper.v2.getPriceV2,
  getPriceV3: orderHelper.v3.getPriceV3,
  removeFields: removeFields
};

const orderModel = model('s_order', orderSchema);
orderModel.createCollection();
export default orderModel;
