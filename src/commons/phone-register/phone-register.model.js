import { Schema, model } from 'mongoose';

const schema = new Schema(
  {
    phone: {
      type: String,
      required: true
    },
    expired_time: {
      type: Date
    },
    code: {
      type: String
    },
    token: {
      type: String
    },
    wrong_times: {
      type: Number,
      default: 0,
      select: false
    }
  },
  {
    timestamps: true
  }
);

export default model('phone-register', schema);
