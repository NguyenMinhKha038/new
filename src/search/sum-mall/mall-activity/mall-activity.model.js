import { model, Schema } from 'mongoose';

const mallActivitySchema = new Schema(
  {
    mall_id: { type: Schema.Types.ObjectId },
    user_id: { type: Schema.Types.ObjectId },
    type: { type: String },
    description: { type: String },
    resource: { type: String },
    object_ids: { type: [Schema.Types.ObjectId], refPath: 'on_model' },
    data: { type: Object },
    on_model: { type: String },
    action: { type: String },
    parent_action_id: { type: Schema.Types.ObjectId }
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

mallActivitySchema.virtual('object', {
  refPath: 'on_model',
  localField: 'object_id',
  foreignField: '_id',
  justOne: true
});

export default model('s_mall_activity', mallActivitySchema);
