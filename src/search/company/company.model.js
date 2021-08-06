import { model, Schema } from 'mongoose';
import statisticService from '../statistic/statistic.service';
import logisticsHandler from '../logistics/logistics.handler';
import { omit } from 'lodash';
import { CompanySensitiveFields } from './company.config';
import { handleXss, removeAccents } from '../../commons/utils/utils';

const companySchema = new Schema(
  {
    user_id: {
      type: Schema.Types.ObjectId,
      ref: 'Users',
      required: true
    },
    name: {
      type: String,
      trim: true,
      required: true
    },
    pure_name: {
      type: String,
      trim: true
    },
    phone_number: {
      type: String
    },
    email: { type: String, trim: true },
    business_registration_form: {
      type: [String]
    },
    representer: {
      type: String,
      required: true
    },
    cover_image: { type: String },
    logo: { type: String },
    tax_code: {
      type: String,
      trim: true
    },
    wallet: {
      type: Number,
      min: 0,
      required: true,
      default: 0,
      select: false
    },
    locked_wallet: {
      type: Number,
      min: 0,
      required: true,
      default: 0,
      select: false
    },
    refund_fund: {
      type: Number,
      min: 0,
      default: 0,
      select: false
    },
    images: {
      type: [String],
      default: [],
      validate: [imagesLimit, 'max 5']
    },
    // * type: 1
    type_category_id: {
      type: Schema.Types.ObjectId,
      ref: 's_category'
    },
    // * type: 2
    category_id: {
      type: Schema.Types.ObjectId,
      ref: 's_category'
    },
    //* relate to limit
    level: {
      type: Number,
      default: 1
    },
    status: {
      type: String,
      required: true,
      default: 'pending',
      enum: ['approved', 'rejected', 'pending', 'disabled', 'suspend']
    },
    total_rate: {
      type: Number,
      default: 0
    },
    max_refund: {
      type: Number,
      default: 0
    },
    max_discount: {
      type: Number,
      default: 0
    },
    rates_count: {
      type: Number,
      default: 0
    },
    likes_count: {
      type: Number,
      default: 0
    },
    follows_count: {
      type: Number,
      default: 0
    },
    views_count: {
      type: Number,
      default: 0
    },
    shares_count: {
      type: Number,
      default: 0
    },
    comments_count: {
      type: Number,
      default: 0
    },
    total_refund: {
      type: Number,
      default: 0,
      select: false
    },
    total_discount: {
      type: Number,
      default: 0,
      select: false
    },
    total_pay: {
      type: Number,
      default: 0,
      select: false
    },
    total_product: {
      type: Number,
      default: 0
    },
    active_product: {
      type: Number,
      default: 0
    },
    total_revenue: {
      type: Number,
      default: 0,
      select: false
    },
    total_order: {
      type: Number,
      default: 0,
      select: false
    },
    total_store: {
      type: Number,
      default: 0
    },
    total_staff: {
      type: Number,
      default: 1,
      select: false
    },
    total_deposit: {
      type: Number,
      default: 0
    },
    total_withdraw: {
      type: Number,
      default: 0
    },
    total_promotion: {
      type: Number,
      default: 0
    },
    address: {
      type: String
    },
    notification_status: {
      type: Number,
      enum: [0, 1, 2, 3, 4, 5, 6],
      default: 0
    },
    pin: {
      type: String,
      select: false
    },
    active_pin: {
      type: Boolean,
      default: false
    },
    chat_username: String,
    chat_password: String,
    balance_limit: Number,
    online_sales: {
      type: Boolean
    },
    is_lucky: Boolean,
    admin_note: String,
    staff_register_schedule: {
      type: Boolean,
      required: true,
      default: false
    }
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

companySchema.methods = {
  transform() {
    return omit(this.toObject(), CompanySensitiveFields);
  }
};

companySchema.index({ pure_name: 'text' });

companySchema.virtual('reaction', {
  ref: 's_company_reaction',
  localField: '_id',
  foreignField: 'company_id',
  justOne: true
});

function imagesLimit(val) {
  return val.length <= 5;
}

companySchema.virtual('avg_rate').get(function () {
  return +(this.total_rate / this.rates_count).toFixed(2);
});

companySchema.virtual('is_company').get(function () {
  return true;
});

companySchema.pre('save', function () {
  if (this.isModified('name')) {
    const n = handleXss(this.name);
    this.name = n;
    this.pure_name = removeAccents(n, true);
  }
  if (this.isNew) statisticService.update({ total_company: 1 });
  if (this.isNew || this.isModified('online_sales'))
    logisticsHandler.switch(this._id, this.online_sales);
});

companySchema.pre('findOneAndUpdate', function () {
  if (this._update.name) {
    const n = handleXss(this._update.name);
    this._update.name = n;
    this._update.pure_name = removeAccents(n, true);
  }
});

export default model('s_company', companySchema);
