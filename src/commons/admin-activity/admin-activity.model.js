import { Schema, model } from 'mongoose';
import adminConfig from './admin-activity.config';

const adminActivityShema = new Schema(
  {
    admin_id: { type: Schema.Types.ObjectId, ref: 'admins', required: true },
    type: { type: String, enum: adminConfig.ActionTypes, required: true },
    resource: { type: String },
    object_id: { type: Schema.Types.ObjectId },
    updated_fields: [String],
    snapshot: { type: Object },
    on_model: { type: String },
    parent_action_id: { type: Schema.Types.ObjectId }
  },
  {
    timestamps: true,
    collection: 'admin_activities',
    toObject: { virtuals: true },
    toJSON: { virtuals: true }
  }
);

adminActivityShema.virtual('admin', {
  ref: 'admins',
  localField: 'admin_id',
  foreignField: '_id'
});

adminActivityShema.index({ admin_id: 1, createdAt: 1 });

export default model('admin_activity', adminActivityShema);
