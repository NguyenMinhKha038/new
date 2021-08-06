import { Schema, model } from 'mongoose';
import paymentConfig from './payment.config';

const paymentSchema = new Schema(
  {
    user_id: {
      type: Schema.Types.ObjectId,
      ref: 'Users',
      required: true
    },
    type: {
      type: String,
      required: true,
      enum: paymentConfig.PAYMENT_TYPE
    },
    value: {
      type: Number,
      required: true
    },
    old_balance: {
      type: Number,
      required: true
    },
    new_balance: {
      type: Number,
      required: true
    },
    status: {
      type: String,
      enum: paymentConfig.STATUS,
      default: 'pending'
    }
  },
  {
    timestamps: true
  }
);

export default model('s_payments', paymentSchema);
