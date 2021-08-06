import { model, Schema } from 'mongoose';
import {
  GlobalPromotionValueType,
  GlobalPromotionStatuses,
  GlobalPromotionType
} from './global-promotion.config';
const globalPromotionSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      index: { text: true }
    },
    description: {
      type: String,
      required: true
    },
    value_type: {
      type: String,
      required: true,
      enum: Object.values(GlobalPromotionValueType)
    },
    value: {
      type: Number,
      required: true,
      min: 0
    },
    refund: {
      type: Number,
      required: true,
      min: 0,
      max: 0.99,
      default: 0
    },
    status: {
      type: String,
      required: true,
      enum: Object.values(GlobalPromotionStatuses),
      default: GlobalPromotionStatuses.pending
    },
    code: {
      type: String,
      required: true,
      unique: true,
      regex: /^[A-Z0-9]{6}$/
    },
    categories: {
      type: [Schema.Types.ObjectId],
      ref: 's_category',
      index: true
    },
    register_at: {
      type: Date,
      required: true
    },
    start_at: {
      type: Date,
      required: true
    },
    expire_at: {
      type: Date,
      required: true
    },
    max_company: {
      type: Number
    },
    images: {
      type: String,
      trim: true
    },
    count_company: {
      type: Number,
      default: 0
    },
    min_order_value: {
      type: Number,
      required: true
    },
    max_discount: {
      type: Number,
      required: true
    },
    pure_name: {
      type: String,
      trim: true,
      index: { text: true }
    },
    is_all_categories: {
      type: Boolean,
      required: true
    },
    is_limit_company: {
      type: Boolean,
      required: true
    },
    apply_status: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

globalPromotionSchema.virtual('happen_status').get(function () {
  if (new Date().getTime() < new Date(this.register_at).getTime()) {
    return 'upcoming';
  } else if (new Date().getTime() < new Date(this.start_at).getTime()) {
    return 'registering';
  } else if (new Date().getTime() < new Date(this.expire_at).getTime()) {
    return 'running';
  } else {
    return 'ended';
  }
});
globalPromotionSchema.pre('save', function () {
  if (this.isModified('name')) {
    const n = this.name;
    this.pure_name = n
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D');
  }
});

export default model('global_promotion', globalPromotionSchema);
