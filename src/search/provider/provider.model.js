import { Schema, model } from 'mongoose';
import { Statuses } from './provider.config';
import { removeAccents, handleXss, removeFields } from '../../commons/utils/utils';

const providerSchema = new Schema(
  {
    name: {
      type: String,
      trim: true,
      required: true
    },
    pure_name: {
      type: String,
      trim: true
    },
    status: {
      type: String,
      required: true,
      default: Statuses.Active,
      enum: Object.values(Statuses)
    },
    // Company (which user added this provider is staff in)
    company_id: { type: Schema.Types.ObjectId, ref: 's_company' },
    // User added this provider
    user_id: { type: Schema.Types.ObjectId, ref: 'Users' },
    // This for case provider created by admin
    admin_id: { type: Schema.Types.ObjectId, ref: 'admins' },
    address: { type: String, trim: true, default: '' },
    location: {
      type: { type: String },
      coordinates: {
        type: []
      }
    },
    type: { type: String, enum: ['private', 'public'], default: 'public' }
  },
  {
    timestamps: true,
    toObject: { virtuals: true },
    toJSON: { virtuals: true }
  }
);

providerSchema.index({ pure_name: 'text' });

providerSchema.virtual('company', {
  ref: 's_company',
  localField: 'company_id',
  foreignField: '_id',
  select: 'status name address logo cover_image',
  justOne: true
});

providerSchema.virtual('admin', {
  ref: 'admins',
  localField: 'admin_id',
  foreignField: '_id',
  select: 'email name status',
  justOne: true
});

providerSchema.virtual('user', {
  ref: 'Users',
  localField: 'user_id',
  foreignField: '_id',
  select: 'name status',
  justOne: true
});

providerSchema.pre('save', function () {
  if (this.isModified('name')) {
    const n = this.name;
    this.pure_name = handleXss(removeAccents(n, true));
    this.name = handleXss(n);
  }
  if (this.isModified('address')) {
    const address = this.address;
    this.address = handleXss(address);
  }
});

providerSchema.methods = {
  removeFields: removeFields
};

export default model('s_provider', providerSchema);
