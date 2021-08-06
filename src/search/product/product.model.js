import { model, Schema } from 'mongoose';
import roundNumber from '../../commons/utils/round-number';

const productSchema = new Schema(
  {
    pid: {
      type: String,
      default: function () {
        return `${Math.round(Date.now() / 1000).toString(30)}${Math.random()
          .toString()
          .substr(2, 3)}`.toUpperCase();
      }
    },
    name: {
      type: String,
      required: true,
      es_indexed: true,
      es_type: 'text',
      es_analyzer: 'vi'
    },
    pure_name: {
      type: String,
      trim: true
    },
    company_id: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 's_company',
      index: true
    },
    condition: { type: String },
    user_id: { type: Schema.Types.ObjectId, required: true, ref: 'Users' },
    //* type: 2
    company_category_id: { type: Schema.Types.ObjectId, ref: 's_category' },
    //* type: 3
    sub_category_id: {
      type: Schema.Types.ObjectId,
      ref: 's_category',
      es_indexed: true,
      es_type: { name: { es_type: 'text', es_analyzer: 'vi' } }
    },
    //* type: 1
    type_category_id: { type: Schema.Types.ObjectId, ref: 's_category' },
    description: { type: String, required: true },
    thumbnail: { type: String },
    images: { type: [String] },

    likes_count: { type: Number, default: 0, es_indexed: false },
    comments_count: { type: Number, default: 0 },
    shares_count: { type: Number, default: 0 },
    views_count: { type: Number, default: 0 },
    price: { type: Number, default: 0 },
    refund: { type: Number, set: (x) => roundNumber(x), get: (x) => roundNumber(x) },
    is_active_company: { type: Boolean, default: true },
    status: {
      type: String,
      enum: ['pending', 'disabled', 'approved', 'rejected'],
      default: 'pending'
    },
    sold_count: { type: Number, default: 0 },
    stock: { type: Number, default: 0 },
    transportable: { type: Boolean, default: false },
    packaging_weight: Number,
    packaging_width: Number,
    packaging_length: Number,
    packaging_height: Number,
    is_free_transport: { type: Boolean, default: false },
    is_limited_stock: { type: Boolean, default: true },
    SKU: { type: String },
    is_lucky: Boolean,
    original_price: Number,
    sale_dates: [Date],
    sale_start_time: Date,
    sale_end_time: Date,
    refund_rate: {
      type: Number,
      default: 0,
      set: (x) => roundNumber(x, 4),
      get: (x) => roundNumber(x, 4)
    },
    warranty_information: String,
    promotion_refund_rate: {
      type: Number,
      default: 0,
      set: (x) => roundNumber(x, 4),
      get: (x) => roundNumber(x, 4)
    },
    promotion_discount_rate: {
      type: Number,
      default: 0,
      set: (x) => roundNumber(x, 4),
      get: (x) => roundNumber(x, 4)
    },
    discount_rate: {
      type: Number,
      default: 0,
      set: (x) => roundNumber(x, 4),
      get: (x) => roundNumber(x, 4)
    },
    global_promotion_refund_rate: {
      type: Number,
      default: 0,
      set: (x) => roundNumber(x, 4),
      get: (x) => roundNumber(x, 4)
    },
    global_promotion_discount_rate: {
      type: Number,
      default: 0,
      set: (x) => roundNumber(x, 4),
      get: (x) => roundNumber(x, 4)
    },
    total_refund_rate: {
      type: Number,
      default: function () {
        return roundNumber(
          this.global_promotion_refund_rate || this.promotion_refund_rate || this.refund_rate,
          4
        );
      },
      set: (x) => roundNumber(x, 4),
      get: (x) => roundNumber(x, 4)
    },
    discount: { type: Number, default: 0, set: (x) => roundNumber(x), get: (x) => roundNumber(x) },
    is_new: Boolean,
    origin: { type: String, trim: true, default: '' },
    company_updated_at: { type: Date, default: Date.now }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    es_extend: {
      result_type: {
        es_type: 'text',
        es_value: 'product'
      }
    }
  }
);

productSchema.index({ pure_name: 'text', is_active_company: 1, status: 1, company_id: 1 });

productSchema.virtual('productStorings', {
  ref: 's_product_storing',
  localField: '_id',
  foreignField: 'product_id'
});

productSchema.virtual('productStoring', {
  ref: 's_product_storing',
  localField: '_id',
  foreignField: 'product_id',
  justOne: true
});

productSchema.virtual('promotion', {
  ref: 's_promotion',
  localField: '_id',
  foreignField: 'product_ids',
  justOne: true
});

productSchema.virtual('company', {
  ref: 's_company',
  localField: 'company_id',
  foreignField: '_id',
  justOne: true
});

productSchema.virtual('category', {
  ref: 's_category',
  localField: 'type_category_id',
  foreignField: '_id',
  justOne: true
});

productSchema.virtual('company_category', {
  ref: 's_category',
  localField: 'company_category_id',
  foreignField: '_id',
  justOne: true
});

productSchema.virtual('sub_category', {
  ref: 's_category',
  localField: 'sub_category_id',
  foreignField: '_id',
  justOne: true
});

productSchema.virtual('is_on_sale').get(function () {
  return this.is_lucky && new Date() > this.sale_start_time && new Date() < this.sale_end_time;
});

productSchema.virtual('true_refund_rate').get(function () {
  return roundNumber((this.total_refund_rate * 9) / 10, 4);
});

productSchema.virtual('true_refund').get(function () {
  if (isNaN(this.refund)) return 0;
  return roundNumber((this.refund * 9) / 10);
});

productSchema.virtual('reaction', {
  ref: 's_product_reaction',
  localField: '_id',
  foreignField: 'product_id',
  justOne: true
});

productSchema.pre('save', function () {
  if (this.isModified('name')) {
    const n = this.name;
    this.pure_name = n
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D');
  }
});

const productModel = model('s_product', productSchema);
export default productModel;
