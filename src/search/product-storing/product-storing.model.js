import { Schema, model } from 'mongoose';
import elasticService from '../../commons/elastic/elastic.service';
import { v7 } from 'mongoose-elasticsearch-xp';
import productStoringService from './product-storing.service';
import roundNumber from '../../commons/utils/round-number';
import { Statuses, DeletedStatus } from './product-storing.config';
import { removeFields, handleXss, removeAccents } from '../../commons/utils/utils';
import productAttributeService from '../product-attribute/product-attribute.service';
import categoryService from '../category/category.service';
import {
  AccompaniedProductStatuses,
  AttributeStatuses,
  ModelStatuses
} from './v2/product-storing.config';
import productModel from '../product/v2/product.model';

// Product Attribute --
const attributeSchema = new Schema({
  product_attribute_id: { type: Schema.Types.ObjectId },
  name: { type: String, index: 'text' },
  pure_name: { type: String, index: 'text' },
  value: { type: String, default: '' },
  status: {
    type: String,
    enum: Object.values(AttributeStatuses),
    default: AttributeStatuses.Active
  }
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
    sold_count: { type: Number, default: 0 },
    status: {
      type: String,
      enum: Object.values(AccompaniedProductStatuses),
      default: AccompaniedProductStatuses.Active
    }
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
const modelSchema = new Schema(
  {
    model_id: { type: String },
    tier_index: { type: [Number] },
    status: { type: String, enum: Object.values(Statuses), default: Statuses.Active },
    is_limited_stock: { type: Boolean, default: true },
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
  },
  { toObject: { virtuals: true }, toJSON: { virtuals: true } }
);

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

// Product Storing --
const productStoringSchema = new Schema(
  {
    store_id: {
      type: Schema.Types.ObjectId,
      index: true,
      required: true,
      ref: 's_store',
      es_indexed: true,
      es_type: {
        _id: {
          es_type: 'keyword'
        },
        name: {
          es_type: 'text',
          es_analyzer: 'vi'
        },
        max_refund: {
          es_type: 'float'
        },
        max_discount: {
          es_type: 'float'
        },
        discount_rate: {
          es_type: 'float'
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
    company_id: {
      type: Schema.Types.ObjectId,
      ref: 's_company',
      index: true,
      required: true,
      es_indexed: true
    },
    is_active_product: {
      type: Boolean,
      default: true,
      required: true
    },
    transportable: {
      type: Boolean,
      default: true,
      es_indexed: true
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
    has_wholesale: { type: Boolean, default: false },
    stock_per_box: { type: Number, min: 1, default: 1 },
    batch_box_stock: { type: Number, default: 0 },
    os_box_stock: { type: Number, default: 0 },
    box_stock: { type: Number, default: 0 },
    stock: { type: Number, default: 0, es_type: 'integer', es_indexed: true },
    batch_stock: { type: Number, default: 0, es_type: 'integer', es_indexed: true },
    on_sales_stock: { type: Number, default: 0, es_type: 'integer', es_indexed: true },
    sold: { type: Number, min: 0, default: 0, es_indexed: true },
    is_active_store: {
      type: Boolean,
      default: true
    },
    is_active_company: {
      type: Boolean,
      default: true
    },
    active: {
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
      es_indexed: true
    },
    box_price: {
      type: Number,
      min: 0,
      es_indexed: true
    },
    refund_rate: {
      type: Number,
      default: 0,
      es_indexed: true
    },
    refund: {
      type: Number,
      default: 0,
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
      default: 0,
      es_indexed: true
    },
    is_limited_stock: {
      type: Boolean,
      default: true,
      es_indexed: true
    },
    is_lucky: { type: Boolean, es_indexed: true },
    options: [optionSchema],
    in_menu: { type: Boolean, default: false, es_indexed: true },
    groups: [{ type: Schema.Types.ObjectId, ref: 's_group' }],
    tags: [{ type: Schema.Types.ObjectId, ref: 's_tag' }],
    attributes: [attributeSchema],
    model_list: [modelSchema],
    product_template_id: { type: Schema.Types.ObjectId, ref: 's_product_template' },
    tier_variations: [
      {
        name: { type: String, required: true },
        values: { type: [String], default: [] }
      }
    ],
    category_path: { type: String },
    pure_category_path: { type: String },
    accompanied_products: [accompaniedProductSchema],
    has_accompanied_products: { type: Boolean, default: false },
    unit: { type: String, default: 'N/A' },
    origin: { type: String, trim: true, default: '' },
    is_directed_import: { type: Boolean, default: false }
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
          return (
            doc.is_active_store &&
            doc.is_active_product &&
            doc.is_active_company &&
            doc.status === Statuses.Active
          );
        }
      }
    }
  }
);

productStoringSchema.index({ name: 'text', pure_name: 'text' });
productStoringSchema.index({ company_id: 1, store_id: 1, product_id: 1 });

productStoringSchema.pre('save', async function () {
  this.has_accompanied_products = !!this.accompanied_products && !!this.accompanied_products.length;
  if (this.isNew) {
    this.category_id = this.sub_category_id || this.company_category_id || this.type_category_id;
  }
  if (this.isModified('accompanied_products')) {
    this.has_accompanied_products = this.accompanied_products && this.accompanied_products.length;
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

productStoringSchema.post('save', function () {
  productStoringService.indexElasticSearch({ _id: this.id });
});

productStoringSchema.post('findOneAndUpdate', function (doc) {
  productStoringService.indexElasticSearch({ _id: doc.id });
});

productStoringSchema.methods = {
  removeFields: removeFields
};

productStoringSchema.virtual('true_refund').get(function () {
  return roundNumber((this.refund * 9) / 10);
});
productStoringSchema.virtual('true_refund_rate').get(function () {
  return roundNumber((this.total_refund_rate * 9) / 10, 4);
});

productStoringSchema.virtual('in_stock').get(function () {
  return this.is_limited_stock === false || this.stock > 0;
});

productStoringSchema.virtual('store', {
  ref: 's_store',
  localField: 'store_id',
  foreignField: '_id',
  justOne: true
});

productStoringSchema.virtual('product', {
  ref: 's_product',
  localField: 'product_id',
  foreignField: '_id',
  justOne: true
});

productStoringSchema.virtual('promotion', {
  ref: 's_promotion',
  localField: 'product_id',
  foreignField: 'product_ids',
  justOne: true
});

productStoringSchema.virtual('global_promotion_registration', {
  ref: 'global_promotion_registration',
  localField: '_id',
  foreignField: 'product_storing_ids',
  justOne: true
});

productStoringSchema.virtual('promotion_total').get(function () {
  const { promotion_total } = getPromotionQuantity(this.promotion, this.product_id);
  return promotion_total;
});

productStoringSchema.virtual('promotion_remain').get(function () {
  const { promotion_remain } = getPromotionQuantity(this.promotion, this.product_id);
  return promotion_remain;
});

productStoringSchema.plugin(v7, {
  client: elasticService.client,
  onlyOnDemandIndexing: true
});

const productStoringModel = model('s_product_storing', productStoringSchema);
export default productStoringModel;
// --

export const productStoringOptions = {
  model: productStoringModel,
  query: {},
  populate: [
    {
      path: 'store_id',
      select: 'name address location max_refund max_discount discount_rate'
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

elasticService.init(productStoringOptions);

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
