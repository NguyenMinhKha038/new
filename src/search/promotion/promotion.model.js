import { Schema, model } from 'mongoose';
import promotionConfig from './promotion.config';
import statisticService from '../statistic/statistic.service';
import promotionProductService from '../promotion-product-statistic/promotionProduct.service';
import companyService from '../company/company.service';
import companyLimitService from '../company/company-limit.service';
import promotionService from './promotion.service';
import { handleXss, removeAccents } from '../../commons/utils/utils';

const modelSchema = new Schema({
  model_id: {
    type: Schema.Types.ObjectId
  },
  unlimited: {
    type: Boolean
  },
  total: {
    type: Number
  },
  remain: {
    type: Number,
    default: function () {
      return this.total;
    }
  },
  model_images: {
    type: [String],
    required: true
  }
});

const productSchema = new Schema(
  {
    product_id: {
      type: Schema.Types.ObjectId,
      required: true
    },
    model_list: {
      type: [Object]
    },
    models: {
      type: [modelSchema],
      default: []
    },
    model_ids: {
      type: [String],
      default: []
    },
    model_scope: {
      type: String,
      enum: Object.values(promotionConfig.SCOPE)
    }
  },
  {
    toObject: { virtuals: true },
    toJSON: { virtuals: true }
  }
);

const promotionSchema = new Schema(
  {
    company_id: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 's_company'
    },
    store_ids: [
      {
        type: Schema.Types.ObjectId,
        ref: 's_store'
      }
    ],
    store_id: {
      type: Schema.Types.ObjectId
    },
    store_scope: {
      type: String,
      // required: true,
      enum: promotionConfig.SCOPE
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    pure_name: {
      type: String
    },
    description: {
      type: String,
      required: true
    },
    type: {
      type: String,
      required: true,
      enum: promotionConfig.TYPE_DISCOUNT,
      default: 'percent'
    },
    total_payment: {
      type: Number,
      default: 0
    },
    total_discount: {
      type: Number,
      default: 0
    },
    total_refund: {
      type: Number,
      default: 0
    },
    total_uses: {
      type: Number,
      default: 0
    },
    value: {
      type: Number,
      required: true,
      default: 0,
      minimum: 0,
      maximum: 0.99
    },
    refund: {
      type: Number,
      required: true,
      default: 0,
      minimum: 0,
      maximum: 0.99
    },
    product_scope: {
      type: String,
      required: true,
      enum: promotionConfig.SCOPE
    },
    product_ids: [
      {
        type: Schema.Types.ObjectId,
        ref: 's_product',
        index: true
      }
    ],
    expire_at: {
      type: Date,
      required: true
    },
    start_at: {
      type: Date,
      required: true
    },
    remain: {
      type: Number
      // required: true
    },
    unlimit: {
      type: Boolean
    },
    total: {
      type: Number
      // required: true
    },
    max_discount: {
      type: Number,
      default: -1
    },
    max_product_refund: {
      type: Number
    },
    max_product_discount: {
      type: Number
    },
    max_product_price: {
      type: Number
    },
    max_uses: {
      type: Number,
      default: 1,
      minimum: 0
    },
    code: {
      type: String,
      regex: /^[A-Z0-9]{6}$/,
      required: true,
      unique: true
    },
    conditions: [
      {
        type: {
          type: String,
          enum: promotionConfig.TYPE_CONDITIONS
        },
        value: {
          type: Number
        }
      }
    ],
    status: {
      type: String,
      required: true,
      enum: promotionConfig.STATUS,
      default: 'handling'
    },
    products: [productSchema],
    apply_status: {
      type: Boolean,
      default: false
    }
    // images
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

promotionSchema.virtual('_max_value').get(function () {
  return (this.max_price && this.max_price.price * (this.refund || this.value)) || 0;
});

productSchema.virtual('is_remain').get(function () {
  if (this.models.length === 0) return true;
  let isRemain = false;
  this.models.map((model) => {
    if (model.unlimited || model.remain > 0) {
      isRemain = true;
    }
  });
  return isRemain;
});

// promotionSchema.virtual('products.product', {
//   ref: 's_product',
//   localField: 'products._id',
//   foreignField: '_id',
//   justOne: true
// });
productSchema.virtual('product', {
  ref: 's_product',
  localField: 'product_id',
  foreignField: '_id',
  justOne: true
});
promotionSchema.virtual('store', {
  ref: 's_store',
  localField: 'store_id',
  foreignField: '_id',
  justOne: true
});
promotionSchema.virtual('company', {
  ref: 's_company',
  localField: 'company_id',
  foreignField: '_id',
  justOne: true
});

promotionSchema.virtual('max_price', {
  ref: 's_product',
  localField: 'product_ids',
  foreignField: '_id',
  options: {
    sort: {
      price: -1
    },
    select: 'price'
  },
  justOne: true
});

promotionSchema.virtual('converter_status').get(function () {
  return convertPromotionStatus(this.status, this.start_at, this.expire_at);
});

promotionSchema.pre('save', function () {
  if (this.isNew) {
    statisticService.update({ total_promotion: 1 });
    companyService.changeCount(this.company_id, { total_promotion: 1 });
    if (this.start_at < new Date()) companyLimitService.update(this.company_id);
    // if (this.product_scope === 'partial' && this.products && !this.unlimit) {
    //   this.products.forEach((item) => {
    //     item.remain = item.total;
    //   });
    // }
    if (this.products && this.products instanceof Array) {
      this.products.forEach((item) => {
        if (item.total >= 0) {
          item.remain = item.total;
        }
      });
    }
  }
  if (this.statistic_detail_product) {
    let datas = [],
      id = this._id;
    this.statistic_detail_product.forEach((item) => {
      let data = item.toObject();
      data.promotion_id = id;

      datas.push(data);
    });
    promotionProductService.insertMany(datas);
  }

  if (this.isModified('name')) {
    const n = handleXss(this.name);
    this.name = n;
    this.pure_name = removeAccents(n, true);
  }
});

promotionSchema.index({ pure_name: 'text' });

export default model('s_promotion', promotionSchema);

export function convertPromotionStatus(status, start_at, expire_at) {
  if (status === 'disabled' || status === 'handling') {
    return status;
  }
  const currentDate = new Date();
  if (currentDate < start_at) {
    return 'pending';
  }
  if (currentDate > expire_at) {
    return 'expired';
  }
  return 'active';
}
