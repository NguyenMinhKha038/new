import { Schema, model } from 'mongoose';
import { Statuses, DeletedStatus } from '../warehouse-storing/warehouse-storing.config';
import roundNumber from '../../commons/utils/round-number';
import { removeFields, handleXss, removeAccents } from '../../commons/utils/utils';
import productAttributeService from '../product-attribute/product-attribute.service';
import categoryService from '../category/category.service';
import productModel from '../product/v2/product.model';

// Product Attribute --
const attributeSchema = new Schema({
  product_attribute_id: { type: Schema.Types.ObjectId },
  name: { type: String, index: 'text' },
  pure_name: { type: String, index: 'text' },
  value: { type: String, default: '' }
});

attributeSchema.pre('save', async function () {
  const attributeId = this.product_attribute_id;
  let attribute = this;
  if (!attribute.name) {
    attribute = await productAttributeService.findOne({ _id: attributeId, status: 'active' });
    if (!attribute) {
      throw new Error('product attribute not found');
    }
  }
  this.name = handleXss(attribute.name);
  this.pure_name = removeAccents(this.name);
});

attributeSchema.virtual('product_attribute', {
  ref: 's_product_attribute',
  localField: 'product_attribute_id',
  foreignField: '_id',
  justOne: true
});

attributeSchema.virtual('detail', {
  ref: 's_product_attribute',
  localField: 'product_attribute_id',
  foreignField: '_id',
  justOne: true
});
// --

// Accompanied Product --
const accompaniedProductSchema = new Schema(
  {
    id: { type: Schema.Types.ObjectId, ref: 's_product_v2' },
    product_id: { type: Schema.Types.ObjectId, ref: 's_product_v2' },
    product_storing_id: { type: Schema.Types.ObjectId, ref: 's_product_storing', required: true },
    model_id: { type: Schema.Types.ObjectId },
    price: { type: Number, default: 0 },
    on_sales_stock: { type: Number, default: 0 },
    sold_count: { type: Number, default: 0 }
  },
  { toObject: { virtuals: true }, toJSON: { virtuals: true } }
);

accompaniedProductSchema.pre('save', function () {
  if (this.isModified('id')) {
    this.product_id = this.id;
  } else if (this.isModified('product_id')) {
    this.id = this.product_id;
  }
});

accompaniedProductSchema.virtual('product', {
  ref: 's_product_v2',
  localField: 'product_id',
  foreignField: '_id',
  justOne: true
});

accompaniedProductSchema.virtual('product_storing', {
  ref: 's_product_storing',
  localField: 'product_storing_id',
  foreignField: '_id',
  justOne: true
});
// --

// Product Model (of variations) --
const modelSchema = new Schema({
  model_id: { type: String },
  tier_index: { type: [Number] },
  status: { type: String, enum: Object.values(Statuses), default: Statuses.Active },
  name: { type: String, required: true },
  pure_name: { type: String },
  price: { type: Number },
  box_price: { type: Number },
  batch_box_stock: { type: Number, default: 0 },
  os_box_stock: { type: Number, default: 0 },
  box_stock: { type: Number, default: 0 },
  stock_per_box: { type: Number, default: 1 },
  stock: { type: Number, default: 0 },
  on_sales_stock: { type: Number, default: 0 },
  SKU: { type: String },
  images: { type: [String] },
  sold_count: { type: Number, default: 0 },
  refund: { type: Number, set: (x) => roundNumber(x), get: (x) => roundNumber(x) },
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
});

modelSchema.pre('save', async function () {
  const parent = this.ownerDocument();

  const product = await productModel.findById(parent.product_id);

  if (this.isNew) {
    this.model_id = this.model_id || this._id.toString();
  }
  this.name = handleXss(this.name);
  this.pure_name = removeAccents(this.name);

  if (this.isModified('on_sales_stock') || this.isModified('stock')) {
    const stock = this.stock;
    const onSalesStock = this.on_sales_stock;
    this.stock = stock >= 0 ? stock : 0;
    this.on_sales_stock = onSalesStock >= 0 ? onSalesStock : 0;
  }
  if (
    this.isModified('stock_per_box') ||
    this.isModified('batch_stock') ||
    this.isModified('on_sales_stock') ||
    this.isModified('stock') ||
    this.isModified('has_wholesale')
  ) {
    if (!this.stock_per_box) {
      this.stock_per_box = product.stock_per_box;
    }
    // this.box_price = this.has_wholesale ? this.box_price : this.price || this.model_list[0].price;
    this.stock_per_box = product.has_wholesale ? this.stock_per_box : 1;
    this.batch_box_stock = Math.floor(this.batch_stock / this.stock_per_box);
    this.os_box_stock = Math.floor(this.on_sales_stock / this.stock_per_box);
    this.box_stock = this.batch_box_stock + this.os_box_stock;
  }
});

modelSchema
  .virtual('batch_stock')
  .get(function () {
    return this.stock;
  })
  .set(function (stock) {
    this.set({ stock });
  });
// --
modelSchema.virtual('true_refund_rate').get(function () {
  return roundNumber((this.total_refund_rate * 9) / 10, 4);
});

modelSchema.virtual('true_refund').get(function () {
  return roundNumber((this.refund * 9) / 10);
});
// Warehouse Storing --
const warehouseStoringSchema = new Schema(
  {
    company_id: {
      type: Schema.Types.ObjectId,
      ref: 's_company',
      required: true
    },
    warehouse_id: {
      type: Schema.Types.ObjectId,
      ref: 's_company',
      required: true
    },
    is_active_product: {
      type: Boolean,
      default: false,
      required: true
    },
    is_active_warehouse: {
      type: Boolean,
      default: false,
      required: true
    },
    transportable: {
      type: Boolean,
      default: true
    },
    product_id: {
      required: true,
      type: Schema.Types.ObjectId,
      ref: 's_product'
    },
    type_category_id: { type: Schema.Types.ObjectId, ref: 's_category' },
    company_category_id: { type: Schema.Types.ObjectId, ref: 's_category' },
    sub_category_id: { type: Schema.Types.ObjectId, ref: 's_category' },
    category_id: {
      type: Schema.Types.ObjectId,
      ref: 's_category'
    },
    has_wholesale: { type: Boolean, default: false },
    stock_per_box: { type: Number, min: 1, default: 1 },
    batch_box_stock: { type: Number, default: 0 },
    os_box_stock: { type: Number, default: 0 },
    box_stock: { type: Number, default: 0 },
    stock: { type: Number, default: 0 },
    batch_stock: { type: Number, default: 0 },
    on_sales_stock: { type: Number, default: 0 },
    // sold: { type: Number, min: 0, default: 0 },
    is_active_company: {
      type: Boolean,
      default: true
    },
    status: {
      type: String,
      enum: [...Object.values(Statuses), DeletedStatus],
      default: Statuses.Active
    },
    price: {
      type: Number,
      default: 0
    },
    refund_rate: {
      type: Number,
      default: 0
    },
    refund: {
      type: Number,
      default: 0
    },
    promotion_refund_rate: {
      type: Number,
      default: 0
    },
    global_promotion_refund_rate: {
      type: Number,
      default: 0
    },
    global_promotion_discount_rate: {
      type: Number,
      default: 0
    },
    total_refund_rate: {
      type: Number,
      default: 0
    },
    promotion_discount_rate: {
      type: Number,
      default: 0
    },
    discount_rate: {
      type: Number,
      default: 0
    },
    discount: {
      type: Number,
      default: 0
    },
    is_limited_stock: {
      type: Boolean,
      default: true
    },
    is_lucky: { type: Boolean },
    attributes: [attributeSchema],
    model_list: [modelSchema],
    product_template_id: { type: Schema.Types.ObjectId, ref: 's_product_template' },
    tier_variation: [
      {
        name: { type: String, required: true },
        values: { type: [String], default: [] }
      }
    ],
    category_path: { type: String },
    pure_category_path: { type: String },
    accompanied_products: [accompaniedProductSchema],
    has_accompanied_products: { type: Boolean, default: false }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

warehouseStoringSchema.index({ name: 'text', pure_name: 'text' });
warehouseStoringSchema.index({ company_id: 1, product_id: 1 });

warehouseStoringSchema.pre('save', async function () {
  if (!this.category_path) {
    const category = await categoryService.findOne(
      { _id: this.category_id, status: 'active' },
      null,
      { populate: 'type_category company_category sub_category' }
    );
    if (category) {
      const c1 = category.type_category.name;
      const c2 = category.company_category ? `/${category.company_category.name}` : '';
      const c3 = category.sub_category ? `/${category.sub_category.name}` : '';
      this.category_path = c1 + c2 + c3;
    }
  } else if (this.isModified('category_path')) {
    this.pure_category_path = removeAccents(this.category_path);
  }

  if (
    this.isModified('batch_stock') ||
    this.isModified('on_sales_stock') ||
    this.isModified('stock')
  ) {
    const stock = this.stock;
    const batchStock = this.batch_stock;
    const onSalesStock = this.on_sales_stock;
    this.stock = stock >= 0 ? stock : 0;
    this.batch_stock = batchStock >= 0 ? batchStock : 0;
    this.on_sales_stock = onSalesStock >= 0 ? onSalesStock : 0;
  }

  if (
    this.isModified('stock_per_box') ||
    this.isModified('batch_stock') ||
    this.isModified('on_sales_stock')
  ) {
    this.stock_per_box = this.has_wholesale ? this.stock_per_box : 1;
    this.batch_box_stock = Math.floor(this.batch_stock / this.stock_per_box);
    this.os_box_stock = Math.floor(this.on_sales_stock / this.stock_per_box);
    this.box_stock = this.batch_box_stock + this.os_box_stock;
  }
});

warehouseStoringSchema.virtual('true_refund').get(function () {
  return roundNumber((this.refund * 9) / 10);
});

warehouseStoringSchema.virtual('true_refund_rate').get(function () {
  return roundNumber((this.total_refund_rate * 9) / 10, 4);
});

warehouseStoringSchema.virtual('in_stock').get(function () {
  return this.is_limited_stock === false || this.stock > 0;
});

warehouseStoringSchema.virtual('active').get(function () {
  return this.status === Statuses.Active;
});

warehouseStoringSchema.virtual('product', {
  ref: 's_product',
  localField: 'product_id',
  foreignField: '_id',
  justOne: true
});

warehouseStoringSchema.virtual('detail', {
  ref: 's_product',
  localField: 'product_id',
  foreignField: '_id',
  justOne: true
});

warehouseStoringSchema.methods = {
  removeFields: removeFields
};

const warehouseStoringModel = model('s_warehouse_storing', warehouseStoringSchema);
export default warehouseStoringModel;
// --
