import { Schema, model } from 'mongoose';

const smsSchema = new Schema(
  {
    code: {
      type: String
    },
    type: {
      type: String,
      enum: ['reset-password', 'register']
    },
    is_received: {
      type: Boolean
    }
  },
  { timestamps: true }
);

const userSmsSchema = new Schema({
  phone: {
    type: String,
    index: true,
    unique: true
  },
  messages: [smsSchema],
  network_provider: {
    type: String
  }
});

export default model('user_sms', userSmsSchema);
