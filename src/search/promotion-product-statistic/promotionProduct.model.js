import { Schema, model } from 'mongoose';

const PromotionProductStatistic = new Schema(
  {
    promotion_id: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 's_promotion'
    },
    company_id: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 's_company'
    },
    product_id: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 's_product'
    },
    product_storing_id: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 's_product_storing'
    },
    store_id: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 's_store'
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
    total_quantity: {
      type: Number,
      default: 0
    }
  },
  { timestamps: true }
);

export default model('s_promotion_product_statistic', PromotionProductStatistic);
