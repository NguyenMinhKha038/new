import { model, Schema } from 'mongoose';
import { BuyerStatus } from './buyer.config';

const buyerSchema = new Schema(
  {
    phone: {
      type: String,
      required: true
    },
    company_id: {
      type: Schema.Types.ObjectId,
      required: true
    },
    status: {
      type: String,
      required: true,
      default: BuyerStatus.Active,
      enum: Object.values(BuyerStatus)
    },
    order_counts: {
      type: Number,
      default: 0
    },
    is_buyer: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

export default model('s_buyer', buyerSchema);
