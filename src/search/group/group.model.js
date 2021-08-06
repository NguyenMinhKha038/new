import { Schema, model } from 'mongoose';
import { Statuses, Types, Scopes } from './group.config';
import { handleXss, removeAccents, removeFields } from '../../commons/utils/utils';

const groupSchema = new Schema(
  {
    status: { type: String, enum: Object.values(Statuses), default: Statuses.Active },
    is_important: { type: Boolean, default: false },
    name: { type: String, trim: true, required: true },
    pure_name: { type: String, trim: true },
    value: { type: String, trim: true, required: true },
    pure_value: { type: String, trim: true },
    description: { type: String, trim: true, default: '' },
    image_url: { type: String, trim: true },
    admin_id: { type: Schema.Types.ObjectId, ref: 'admins' },
    company_id: { type: Schema.Types.ObjectId, ref: 's_company' },
    store_id: { type: Schema.Types.ObjectId, ref: 's_store' },
    mall_id: { type: Schema.Types.ObjectId, ref: 's_mall' },
    total_product: { type: Number, default: 0 },
    has_product: { type: Boolean, default: false }
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

groupSchema.virtual('company', {
  ref: 's_company',
  localField: 'company_id',
  foreignField: '_id',
  justOne: true
});

groupSchema.virtual('store', {
  ref: 's_store',
  localField: 'store_id',
  foreignField: '_id',
  justOne: true
});

groupSchema.virtual('mall', {
  ref: 's_mall',
  localField: 'mall_id',
  foreignField: '_id',
  justOne: true
});

groupSchema.virtual('admin', {
  ref: 'admins',
  localField: 'admin_id',
  foreignField: '_id',
  justOne: true
});

groupSchema.pre('save', function () {
  if (this.isModified('name')) {
    this.pure_name = removeAccents(this.name, true);
  }
  if (this.isModified('value')) {
    this.pure_value = removeAccents(this.value, true);
  }
  if (this.isModified('total_product')) {
    this.has_product = this.total_product > 0;
  }
});

groupSchema.pre('findOneAndUpdate', function () {
  if (this._update.name) {
    this._update.pure_name = removeAccents(this._update.name, true);
  }
  if (this._update.value) {
    this._update.pure_value = removeAccents(this._update.value, true);
  }
});

groupSchema.methods = {
  removeFields: removeFields
};

const groupModel = model('s_group', groupSchema);
export default groupModel;
