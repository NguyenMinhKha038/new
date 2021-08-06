import { Schema, model } from 'mongoose';
import { Statuses, Types, Scopes } from './tag.config';
import { handleXss, removeAccents, removeFields } from '../../commons/utils/utils';

const tagSchema = new Schema(
  {
    status: { type: String, enum: Object.values(Statuses), default: Statuses.Active },
    type: { type: String, enum: Object.values(Types), required: true },
    scope: { type: String, enum: Object.values(Scopes), required: true },
    expiry_date: {
      type: Date,
      required: function () {
        return this.type === Types.Flash;
      }
    },
    name: { type: String, trim: true, required: true },
    pure_name: { type: String, trim: true },
    value: { type: String, trim: true, required: true },
    pure_value: { type: String, trim: true },
    description: { type: String, trim: true, default: '' },
    image_url: { type: String, trim: true },
    admin_id: { type: Schema.Types.ObjectId, ref: 'admins' },
    company_id: { type: Schema.Types.ObjectId, ref: 's_company' },
    store_id: { type: Schema.Types.ObjectId, ref: 's_store' },
    mall_id: { type: Schema.Types.ObjectId, ref: 's_mall' }
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

tagSchema.virtual('is_expired').get(function () {
  return (
    this.status === Statuses.Disabled ||
    (this.type === Types.Flash && this.expiry_date.getTime() < Date.now())
  );
});

tagSchema.virtual('company', {
  ref: 's_company',
  localField: 'company_id',
  foreignField: '_id',
  justOne: true
});

tagSchema.virtual('store', {
  ref: 's_store',
  localField: 'store_id',
  foreignField: '_id',
  justOne: true
});

tagSchema.virtual('mall', {
  ref: 's_mall',
  localField: 'mall_id',
  foreignField: '_id',
  justOne: true
});

tagSchema.virtual('admin', {
  ref: 'admins',
  localField: 'admin_id',
  foreignField: '_id',
  justOne: true
});

tagSchema.pre('save', function () {
  if (this.isModified('name')) {
    this.pure_name = removeAccents(this.name, true);
  }
  if (this.isModified('value')) {
    this.pure_value = removeAccents(this.value, true);
  }
});

tagSchema.pre('findOneAndUpdate', function () {
  if (this._update.name) {
    this._update.pure_name = removeAccents(this._update.name, true);
  }
  if (this._update.value) {
    this._update.pure_value = removeAccents(this._update.value, true);
  }
});

tagSchema.methods = {
  removeFields: removeFields
};

const tagModel = model('s_tag', tagSchema);
export default tagModel;
