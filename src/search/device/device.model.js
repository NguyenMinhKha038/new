import { Schema, model } from 'mongoose';

const deviceSchema = new Schema({
  user_id: Schema.Types.ObjectId,
  company_id: Schema.Types.ObjectId,
  store_id: Schema.Types.ObjectId,
  company_role: {
    type: [String]
  },
  mall_id: Schema.Types.ObjectId,
  mall_role: {
    type: [String]
  },
  warehouse_id: Schema.Types.ObjectId,
  device_id: { type: String, trim: true },
  type: { type: String, enum: ['user', 'guest', 'company', 'mall'] },
  model: String,
  platform: { type: String, enum: ['web', 'mobile'] },
  token: String,
  expiresAt: {
    type: Date,
    default: function () {
      return Date.now() + 7 * 24 * 60 * 60 * 1000;
    },
    expires: 5
  }
});

export default model('s_device', deviceSchema);
