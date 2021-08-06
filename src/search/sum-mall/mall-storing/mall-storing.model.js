import { Schema, model } from 'mongoose';
import { Statuses, DeletedStatus } from '../mall-storing/mall-storing.config';
import elasticService from '../../../commons/elastic/elastic.service';
import { v7 } from 'mongoose-elasticsearch-xp';
import roundNumber from '../../../commons/utils/round-number';
import { removeFields, handleXss, removeAccents } from '../../../commons/utils/utils';
import productAttributeService from '../../product-attribute/product-attribute.service';
import categoryService from '../../category/category.service';
import mallStoringService from './mall-storing.service';
import productModel from '../../product/v2/product.model';

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
  status: { type: String, enum: Object.values(Statuses), default: Statuses.Active },
  name: { type: String, required: true },
  pure_name: { type: String },
  price: { type: Number },
  stock: { type: Number, default: 0 },
  on_sales_stock: { type: Number, default: 0 },
  SKU: { type: String, required: true },
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
  },
  batch_box_stock: { type: Number, default: 0 },
  os_box_stock: { type: Number, default: 0 },
  box_stock: { type: Number, default: 0 },
  stock_per_box: { type: Number, default: 1 },
  box_sold: { type: Number, default: 0 }
});

modelSchema.virtual('true_refund_rate').get(function () {
  return roundNumber((this.total_refund_rate * 9) / 10, 4);
});

modelSchema.virtual('true_refund').get(function () {
  return roundNumber((this.refund * 9) / 10);
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
// --

// Option --
const optionSchema = new Schema(
  {
    option_id: { type: Schema.Types.ObjectId, ref: 's_selling_option', required: true },
    required: { type: Boolean, default: false },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' }
  },
  { toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

optionSchema
  .virtual('id')
  .get(function () {
    return this.option_id;
  })
  .set(function (oid) {
    this.option_id = oid;
  });

optionSchema.virtual('option', {
  ref: 's_selling_option',
  localField: 'option_id',
  foreignField: '_id',
  justOne: true
});

optionSchema.virtual('detail', {
  ref: 's_selling_option',
  localField: 'option_id',
  foreignField: '_id',
  justOne: true
});
// --

// Mall Storing --
const mallStoringSchema = new Schema(
  {
    mall_id: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 's_mall',
      es_indexed: true,
      es_type: {
        _id: {
          es_type: 'keyword'
        },
        name: {
          es_type: 'text',
          es_analyzer: 'vi'
        },
        address: {
          es_type: {
            province: {
              es_type: 'text',
              es_analyzer: 'vi'
            },
            district: {
              es_type: 'text',
              es_analyzer: 'vi'
            },
            ward: {
              es_type: 'text',
              es_analyzer: 'vi'
            },
            text: {
              es_type: 'text',
              es_analyzer: 'vi'
            },
            province_code: {
              es_type: 'text'
            },
            district_code: {
              es_type: 'text'
            },
            ward_code: {
              es_type: 'text'
            }
          }
        }
      }
    },
    is_active_product: {
      type: Boolean,
      default: false
    },
    is_active_mall: {
      type: Boolean,
      default: true
    },
    status: {
      type: String,
      enum: [...Object.values(Statuses), DeletedStatus],
      default: Statuses.Active
    },
    product_id: {
      required: true,
      index: true,
      es_indexed: true,
      es_type: {
        thumbnail: {
          es_type: 'text'
        },
        name: {
          es_type: 'text',
          es_analyzer: 'vi'
        },
        _id: {
          es_type: 'keyword'
        },
        pid: {
          es_type: 'text',
          es_analyzer: 'word_ngram'
        },
        price: {
          es_type: 'float'
        },
        refund: {
          es_type: 'float'
        },
        refund_rate: {
          es_type: 'float'
        },
        company_category_id: {
          es_type: {
            _id: {
              es_type: 'text'
            },
            name: {
              es_type: 'text',
              es_analyzer: 'vi'
            }
          }
        },
        sub_category_id: {
          es_type: {
            _id: {
              es_type: 'text'
            },
            name: {
              es_type: 'text',
              es_analyzer: 'vi'
            }
          }
        },
        type_category_id: {
          es_type: {
            _id: {
              es_type: 'text'
            },
            name: {
              es_type: 'text',
              es_analyzer: 'vi'
            }
          }
        }
      },
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
    stock: { type: Number, default: 0, es_type: 'integer', es_indexed: true },
    batch_stock: { type: Number, default: 0, es_type: 'integer', es_indexed: true },
    on_sales_stock: { type: Number, default: 0, es_type: 'integer', es_indexed: true },
    sold: { type: Number, min: 0, default: 0, es_indexed: true },
    price: {
      type: Number,
      es_indexed: true
    },
    refund_rate: {
      type: Number,
      es_indexed: true
    },
    refund: {
      type: Number,
      es_indexed: true
    },
    promotion_refund_rate: {
      type: Number,
      default: 0,
      es_indexed: true
    },
    global_promotion_refund_rate: {
      type: Number,
      default: 0,
      es_indexed: true
    },
    global_promotion_discount_rate: {
      type: Number,
      default: 0,
      es_indexed: true
    },
    total_refund_rate: {
      type: Number,
      default: 0,
      es_indexed: true
    },
    promotion_discount_rate: {
      type: Number,
      default: 0,
      es_indexed: true
    },
    discount_rate: {
      type: Number,
      default: 0,
      es_indexed: true
    },
    discount: {
      type: Number,
      es_indexed: true
    },
    is_limited_stock: {
      type: Boolean,
      default: true,
      es_indexed: true
    },
    is_lucky: { type: Boolean, es_indexed: true },
    options: [optionSchema],
    in_menu: { type: Boolean, default: false },
    groups: [{ type: Schema.Types.ObjectId, ref: 's_group' }],
    tags: [{ type: Schema.Types.ObjectId, ref: 's_tag' }],
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
    toObject: { virtuals: true },
    es_extend: {
      result_type: {
        es_type: 'text',
        es_value: 'product'
      },
      coordinates: {
        es_type: 'geo_point',
        es_value: function (doc) {
          return doc.store_id.location.coordinates;
        }
      },
      true_refund: {
        es_type: 'long',
        es_value: function (doc) {
          return Math.round((doc.refund * 9) / 10);
        }
      },
      showable: {
        es_type: 'boolean',
        es_value: function (doc) {
          return doc.is_active_mall && doc.is_active_product && doc.status === Statuses.Active;
        }
      }
    }
  }
);

mallStoringSchema.index({ name: 'text', pure_name: 'text' });
mallStoringSchema.index({ mall_id: 1, product_id: 1 });

mallStoringSchema.pre('save', async function () {
  this.has_accompanied_products = !!this.accompanied_products && !!this.accompanied_products.length;
  if (this.isNew) {
    this.category_id = this.sub_category_id || this.company_category_id || this.type_category_id;
  }
  if (this.isModified('accompanied_products')) {
    this.has_accompanied_products = this.accompanied_products && this.accompanied_products.length;
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
      this.pure_category_path = removeAccents(this.category_path);
    }
  } else if (this.isModified('category_path')) {
    this.pure_category_path = removeAccents(this.category_path);
  }
});

mallStoringSchema.post('save', function () {
  mallStoringService.indexElasticSearch({ _id: this.id });
});

mallStoringSchema.post('findOneAndUpdate', function (doc) {
  mallStoringService.indexElasticSearch({ _id: doc.id });
});

mallStoringSchema.virtual('true_refund').get(function () {
  return roundNumber((this.refund * 9) / 10);
});

mallStoringSchema.virtual('true_refund_rate').get(function () {
  return roundNumber((this.total_refund_rate * 9) / 10, 4);
});

mallStoringSchema.virtual('in_stock').get(function () {
  return this.is_limited_stock === false || this.stock > 0;
});

mallStoringSchema.virtual('active').get(function () {
  return this.status === Statuses.Active;
});

mallStoringSchema.virtual('mall', {
  ref: 's_mall',
  localField: 'mall_id',
  foreignField: '_id',
  justOne: true
});

mallStoringSchema.virtual('product', {
  ref: 's_product',
  localField: 'product_id',
  foreignField: '_id',
  justOne: true
});

mallStoringSchema.virtual('detail', {
  ref: 's_product',
  localField: 'product_id',
  foreignField: '_id',
  justOne: true
});

mallStoringSchema.virtual('promotion', {
  ref: 's_promotion',
  localField: 'product_id',
  foreignField: 'product_ids',
  justOne: true
});

mallStoringSchema.virtual('global_promotion_registration', {
  ref: 'global_promotion_registration',
  localField: '_id',
  foreignField: 'product_storing_ids',
  justOne: true
});

mallStoringSchema.plugin(v7, {
  client: elasticService.client,
  onlyOnDemandIndexing: true
});

mallStoringSchema.methods = {
  removeFields: removeFields
};

const mallStoringModel = model('s_mall_storing', mallStoringSchema);
export default mallStoringModel;
// --

export const mallStoringOptions = {
  model: mallStoringModel,
  query: {},
  populate: [
    {
      path: 'mall_id',
      select: 'name status address location'
    },
    {
      path: 'product_id',
      select:
        'name company_category_id sub_category_id type_category_id price refund_rate refund thumbnail pid',
      populate: [
        { path: 'company_category_id', select: 'name' },
        { path: 'sub_category_id', select: 'name' },
        { path: 'type_category_id', select: 'name' }
      ]
    }
  ]
};

elasticService.init(mallStoringOptions);
