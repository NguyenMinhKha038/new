import { object } from '@hapi/joi';
import { Schema, model } from 'mongoose';
import { companyPermissionType } from './permission-group.config';

const workShiftSchema = new Schema({
  from: {
    type: Number,
    required: true
  },
  to: {
    type: Number,
    required: true
  }
});

const permissionGroupSchema = new Schema(
  {
    company_id: {
      type: Schema.Types.ObjectId,
      ref: 's_company',
      required: true,
      index: true
    },
    type: {
      type: [String],
      // maxlength:3,  // ? maxlength ????????????????/
      enum: Object.values(companyPermissionType)
    },
    user_id: {
      type: Schema.Types.ObjectId,
      ref: 'Users',
      required: true,
      unique: true
    },
    store_id: {
      type: Schema.Types.ObjectId,
      ref: 's_store'
      // required: true
    },
    warehouse_id: {
      type: Schema.Types.ObjectId,
      ref: 's_warehouse'
      // required: true
    },
    is_owner: {
      type: Boolean
    },
    status: {
      type: String,
      enum: ['active', 'disabled'],
      default: 'active'
    },
    device_token: {
      type: {
        mobile: String,
        web: String
      },
      default: {}
    },
    schedule: {
      type: {
        monday: [workShiftSchema],
        tuesday: [workShiftSchema],
        wednesday: [workShiftSchema],
        thursday: [workShiftSchema],
        friday: [workShiftSchema],
        saturday: [workShiftSchema],
        sunday: [workShiftSchema]
      }
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

permissionGroupSchema.virtual('company', {
  ref: 's_company',
  localField: 'company_id',
  foreignField: '_id',
  justOne: true
});

permissionGroupSchema.virtual('store', {
  ref: 's_store',
  localField: 'store_id',
  foreignField: '_id',
  justOne: true
});

permissionGroupSchema.virtual('warehouse', {
  ref: 's_warehouse',
  localField: 'warehouse_id',
  foreignField: '_id',
  justOne: true
});

permissionGroupSchema.virtual('user', {
  ref: 'Users',
  localField: 'user_id',
  foreignField: '_id',
  justOne: true
});

export default model('s_permission_group', permissionGroupSchema);
