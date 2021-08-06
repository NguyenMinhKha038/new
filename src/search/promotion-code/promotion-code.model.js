import { Schema, model } from 'mongoose';
import statisticService from '../statistic/statistic.service';

const promotionCodeSchema = new Schema(
  {
    user_id: {
      type: Schema.Types.ObjectId,
      ref: 'Users'
      // required: true
    },
    promotion_id: {
      type: Schema.Types.ObjectId,
      ref: 's_promotion'
    },
    global_promotion_id: {
      type: Schema.Types.ObjectId,
      ref: 'global_promotion'
    },
    company_id: {
      type: Schema.Types.ObjectId,
      ref: 's_company',
      required: true
    },
    store_id: {
      type: Schema.Types.ObjectId
    },
    product_id: {
      type: Schema.Types.ObjectId,
      ref: 's_product'
    },
    model_id: {
      type: Schema.Types.ObjectId
    },
    code: {
      type: String,
      unique: true,
      required: true
    },
    color: {
      type: String,
      default: '#ffffff'
    },
    date_used: {
      type: Date
    },
    status: {
      type: String,
      enum: ['active', 'used']
    },
    apply_count: {
      type: Number
    }
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    timestamps: true
  }
);

promotionCodeSchema.virtual('global_promotion', {
  ref: 'global_promotion',
  localField: 'global_promotion_id',
  foreignField: '_id',
  justOne: true
});
promotionCodeSchema.virtual('company', {
  ref: 's_company',
  localField: 'company_id',
  foreignField: '_id',
  justOne: true
});
promotionCodeSchema.virtual('product', {
  ref: 's_product',
  localField: 'product_id',
  foreignField: '_id',
  justOne: true
});

promotionCodeSchema.pre('save', function () {
  if (this.isNew) {
    statisticService.update({ total_promotion_code: 1 });
  }
});

export default model('s_promotion_codes', promotionCodeSchema);
