import { model, Mongoose, Schema, Types } from 'mongoose';
import { handleXss, removeAccents } from '../../../commons/utils/utils';
import { Statuses, ProviderStatuses } from './product.config';
import { v4 as uuidv4 } from 'uuid';
import roundNumber from '../../../commons/utils/round-number';
import productAttributeService from '../../product-attribute/product-attribute.service';

const attributeSchema = new Schema(
  {
    product_attribute_id: { type: Schema.Types.ObjectId },
    name: { type: String },
    display_name: { type: String },
    pure_name: { type: String, trim: true },
    value: { type: String }
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

const unknownAttributeSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  value: {
    type: String
  }
});

attributeSchema.pre('save', async function () {
  if (this.name) {
    const attributeId = this.product_attribute_id;
    const attribute = await productAttributeService.findOne({ query: { _id: attributeId } });
    this.name = attribute.name;
    this.pure_name = attribute.pure_name;
  }
});

attributeSchema.virtual('product_attribute', {
  ref: 's_product_attribute',
  localField: 'product_attribute_id',
  foreignField: '_id',
  justOne: true
});

const accompaniedProductSchema = new Schema(
  {
    id: { type: Schema.Types.ObjectId, ref: 's_product_v2', required: true },
    model_id: { type: Schema.Types.ObjectId },
    price: { type: Number },
    on_sales_stock: { type: Number },
    sold_count: { type: Number, default: 0 }
  },
  { toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

accompaniedProductSchema.virtual('product', {
  ref: 's_product_v2',
  localField: 'id',
  foreignField: '_id',
  justOne: true
});

const providerSchema = new Schema(
  {
    provider_id: { type: Schema.Types.ObjectId, required: true },
    status: {
      type: String,
      enum: Object.values(ProviderStatuses),
      default: ProviderStatuses.Active
    }
  },
  { toJSON: { virtuals: true }, toObject: { virtuals: true } }
);
providerSchema.virtual('provider', {
  ref: 's_provider',
  localField: 'provider_id',
  foreignField: '_id',
  justOne: true
});

const modelSchema = new Schema(
  {
    model_id: {
      type: String
    },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    box_price: { type: Number },
    batch_box_stock: { type: Number, default: 0 },
    os_box_stock: { type: Number, default: 0 },
    box_stock: { type: Number, default: 0 },
    stock_per_box: { type: Number },
    stock: { type: Number, default: 0 },
    on_sales_stock: { type: Number, default: 0 },
    is_limited_stock: { type: Boolean, default: true },
    SKU: { type: String, default: uuidv4() },
    tier_index: { type: [Number] },
    images: { type: [String] },
    sold_count: { type: Number, default: 0 },
    refund: { type: Number, set: (x) => roundNumber(x), get: (x) => roundNumber(x), default: 0 },
    refund_rate: {
      type: Number,
      default: 0,
      set: (x) => roundNumber(x, 4),
      get: (x) => roundNumber(x, 4)
    },
    discount: { type: Number, default: 0, set: (x) => roundNumber(x), get: (x) => roundNumber(x) },
    discount_rate: {
      type: Number,
      default: 0,
      set: (x) => roundNumber(x, 4),
      get: (x) => roundNumber(x, 4)
    },
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
    }
  },
  { toObject: { virtuals: true }, toJSON: { virtuals: true } }
);
modelSchema.pre('save', function () {
  const parent = this.ownerDocument();
  if (this.isNew) {
    this.model_id = this._id.toString();
  }
  if (!this.box_price) {
    this.box_price = this.price;
  }
  this.refund = roundNumber(this.price * this.refund_rate);
  if (!this.stock_per_box) {
    this.stock_per_box = parent.stock_per_box;
  }
  this.stock_per_box = parent.has_wholesale ? parent.stock_per_box : 1;
  this.batch_box_stock = Math.floor(this.batch_stock / this.stock_per_box);
  this.os_box_stock = Math.floor(this.on_sales_stock / this.stock_per_box);
  this.box_stock = this.batch_box_stock + this.os_box_stock;
});
modelSchema.virtual('true_refund_rate').get(function () {
  return roundNumber((this.total_refund_rate * 9) / 10, 4);
});

modelSchema.virtual('true_refund').get(function () {
  return roundNumber((this.refund * 9) / 10);
});

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
    product_template_id: { type: Schema.Types.ObjectId, required: true, ref: 's_product_template' },
    tier_variations: [
      {
        name: { type: String, required: true },
        values: { type: [String], default: [] }
      }
    ],
    attributes: [attributeSchema],
    unknown_attributes: [unknownAttributeSchema],
    model_list: [modelSchema],
    category_path: {
      type: String,
      trim: true
    },
    pure_category_path: {
      type: String,
      trim: true
    },
    accompanied_products: [accompaniedProductSchema],
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
    refund: {
      type: Number,
      set: (x) => roundNumber(x),
      get: (x) => roundNumber(x),
      default: 0
    },
    is_active_company: { type: Boolean, default: true },
    status: {
      type: String,
      enum: Object.values(Statuses),
      default: Statuses.Pending
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
    SKU: { type: String, default: uuidv4() },
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
    company_updated_at: { type: Date, default: Date.now },
    unit: { type: String, default: '' },
    box_unit: { type: String, default: '' },
    has_wholesale: { type: Boolean, default: false },
    stock_per_box: { type: Number, default: 1 },
    box_price: { type: Number },
    batch_box_stock: { type: Number, default: 0 },
    os_box_stock: { type: Number, default: 0 },
    box_stock: { type: Number, default: 0 },
    providers: [providerSchema]
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    collection: 's_products',
    es_extend: {
      result_type: {
        es_type: 'text',
        es_value: 'product'
      }
    }
  }
);

productSchema.index({ pure_name: 'text', is_active_company: 1, status: 1, company_id: 1, SKU: 1 });

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

productSchema.virtual('product_template', {
  ref: 's_product_template',
  localField: 'product_template_id',
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
  return roundNumber((this.refund * 9) / 10);
});

productSchema.virtual('reaction', {
  ref: 's_product_reaction',
  localField: '_id',
  foreignField: 'product_id',
  justOne: true
});

productSchema.pre('save', async function () {
  const docBeforeSave = await productModel.findById(this._id);

  // update default model if default model already existed
  if (docBeforeSave && !this.tier_variations.length && docBeforeSave.model_list[0]) {
    const prevDefaultModelId = docBeforeSave.model_list[0]._id;
    const defaultModel = {
      _id: prevDefaultModelId,
      model_id: prevDefaultModelId,
      name: 'Default',
      SKU: this.SKU,
      price: this.price,
      box_price: this.has_wholesale ? this.box_price : this.price,
      stock_per_box: this.has_wholesale ? this.stock_per_box : 1,
      batch_box_stock: Math.floor(this.batch_stock / this.stock_per_box),
      os_box_stock: Math.floor(this.on_sales_stock / this.stock_per_box),
      box_stock: this.batch_box_stock + this.os_box_stock,
      refund_rate: this.refund_rate,
      refund: roundNumber(this.price * this.refund_rate),
      is_limited_stock: this.is_limited_stock
    };
    this.model_list = [defaultModel];
  } else if (this.isModified('model_list') && !this.model_list.length) {
    const id = Types.ObjectId();
    const defaultModel = {
      _id: id,
      model_id: id,
      name: 'Default',
      SKU: this.SKU,
      price: this.price,
      box_price: this.has_wholesale ? this.box_price : this.price,
      stock_per_box: this.has_wholesale ? this.stock_per_box : 1,
      batch_box_stock: Math.floor(this.batch_stock / this.stock_per_box),
      os_box_stock: Math.floor(this.on_sales_stock / this.stock_per_box),
      box_stock: this.batch_box_stock + this.os_box_stock,
      refund_rate: this.refund_rate,
      refund: roundNumber(this.price * this.refund_rate),
      is_limited_stock: this.is_limited_stock
    };
    this.model_list = [...this.model_list, defaultModel];
  }
  delete this.box_price;
  if (!this.has_wholesale) {
    this.model_list = this.model_list.map((model) => {
      model.set('box_price', model.price);
      return model;
    });
  }
  if (!this.price) {
    this.price = this.model_list[0].price;
    this.refund = this.model_list[0].refund;
  }

  if (this.isModified('name')) {
    const n = handleXss(this.name);
    this.pure_name = removeAccents(n);
  }

  if (
    this.isModified('stock_per_box') ||
    this.isModified('batch_stock') ||
    this.isModified('on_sales_stock') ||
    this.isModified('has_wholesale')
  ) {
    // this.box_price = this.has_wholesale ? this.box_price : this.price || this.model_list[0].price;
    this.stock_per_box = this.has_wholesale ? this.stock_per_box : 1;
    this.batch_box_stock = Math.floor(this.batch_stock / this.stock_per_box);
    this.os_box_stock = Math.floor(this.on_sales_stock / this.stock_per_box);
    this.box_stock = this.batch_box_stock + this.os_box_stock;
  }
});

productSchema.pre('findOneAndUpdate', function (next) {
  if (this.getUpdate().name) {
    const n = handleXss(this.getUpdate().name);
    this.getUpdate().pure_name = removeAccents(n);
  }
  next();
});

const productModel = model('s_product_v2', productSchema);
export default productModel;
