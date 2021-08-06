import { model, Schema } from 'mongoose';

const globalPromotionRegistrationSchema = new Schema(
  {
    global_promotion_id: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'global_promotion'
    },
    company_id: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 's_company'
    },
    product_storing_ids: [
      {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 's_product'
      }
    ],
    status: {
      type: String,
      default: 'active',
      enum: ['active', 'disabled'],
      required: true
    },
    code: {
      type: String,
      unique: true,
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
    global_promotion_status: {
      type: String,
      required: true,
      default: 'active'
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);
globalPromotionRegistrationSchema.virtual('global_promotion', {
  ref: 'global_promotion',
  localField: 'global_promotion_id',
  foreignField: '_id',
  justOne: true
});
globalPromotionRegistrationSchema.virtual('product_storings', {
  ref: 's_product_storing',
  localField: 'product_storing_ids',
  foreignField: '_id',
  justOne: true
});
globalPromotionRegistrationSchema.virtual('company', {
  ref: 's_company',
  localField: 'company_id',
  foreignField: '_id',
  justOne: true
});

export default model('global_promotion_registration', globalPromotionRegistrationSchema);
