import { model, Schema } from 'mongoose';

const companyActivitySchema = new Schema(
  {
    company_id: { type: Schema.Types.ObjectId },
    user_id: { type: Schema.Types.ObjectId },
    type: { type: String },
    description: { type: String },
    resource: { type: String },
    object_id: { type: Schema.Types.ObjectId, refPath: ' on_model' },
    data: { type: Object },
    on_model: { type: String },
    action: { type: String },
    parent_action_id: { type: Schema.Types.ObjectId }
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

companyActivitySchema.methods = {
  update(updates) {
    Object.assign(this, updates);
    return this.save();
  }
};

companyActivitySchema.virtual('staff_info', {
  ref: 's_permission_group',
  localField: 'user_id',
  foreignField: 'user_id',
  justOne: true,
  match: { status: 'active' }
});

companyActivitySchema.virtual('object', {
  refPath: 'on_model',
  localField: 'object_id',
  foreignField: '_id',
  justOne: true
});

const companyActivityModel = model('s_company_activity', companyActivitySchema);
export default companyActivityModel;
