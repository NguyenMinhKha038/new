import { Schema, model } from 'mongoose';

const notificationSchema = new Schema(
  {
    user_id: Schema.Types.ObjectId,
    company_id: Schema.Types.ObjectId,
    title: String,
    platform: { type: String, enum: ['web', 'mobile'] },
    mall_id: Schema.Types.ObjectId,
    warehouse_id: Schema.Types.ObjectId,
    to: { type: String, enum: ['company', 'user', 'mall'] },
    object_id: { type: Schema.Types.ObjectId, refPath: 'onModel' },
    onModel: {
      type: String
    },
    type: String,
    // *
    message: String,
    is_read: { type: Boolean, default: false }
  },
  { timestamps: true }
);

export default model('s_notification', notificationSchema);
