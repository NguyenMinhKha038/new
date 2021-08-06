import { Schema, model } from 'mongoose';
import random from 'crypto-random-string';

const paymentCodeSchema = new Schema(
  {
    user_id: {
      type: Schema.Types.ObjectId,
      required: true
    },
    code: {
      type: Number,
      index: true,
      default: function () {
        return (
          random({ characters: '123456789', length: 1 }) +
          random({ characters: '0123456789', length: 11 })
        );
      }
    },
    expiresAt: {
      type: Date,
      default: function () {
        return Date.now() + 60 * 1000;
      },
      expires: 60
    }
  },
  { timestamps: true, toObject: { virtuals: true }, toJSON: { virtuals: true } }
);

paymentCodeSchema.virtual('is_valid').get(function () {
  if (this.expiresAt > Date.now()) return true;
  return false;
});

export default model('s_payment_code', paymentCodeSchema);
