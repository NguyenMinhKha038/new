import { Schema, model } from 'mongoose';
import { Statuses } from './warehouse.config';
import { removeAccents, handleXss, removeFields } from '../../commons/utils/utils';

const warehouseSchema = new Schema(
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
    address: {
      type: {
        province: String,
        district: String,
        ward: String,
        text: String,
        province_code: String,
        district_code: String,
        ward_code: String
      },
      required: true
    },
    company_id: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 's_company',
      index: true
    },
    type_category_id: {
      type: Schema.Types.ObjectId,
      ref: 's_category'
    },
    company_category_id: {
      type: Schema.Types.ObjectId,
      ref: 's_category'
    },
    manager_id: {
      type: Schema.Types.ObjectId,
      ref: 'Users',
      required: true
    },
    location: {
      type: { type: String },
      coordinates: {
        type: []
      }
    },
    status: {
      type: String,
      enum: Object.values(Statuses),
      default: Statuses.Active
    },
    is_active_company: {
      type: Boolean,
      default: false
    },
    total_staff: {
      type: Number,
      default: 0,
      select: false
    },
    total_product: {
      type: Number,
      default: 0
    },
    active_product: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

warehouseSchema.methods = {
  removeFields: removeFields
};

warehouseSchema.index({ location: '2dsphere' });
warehouseSchema.index({ pure_name: 'text' });

warehouseSchema.virtual('company', {
  ref: 's_company',
  localField: 'company_id',
  foreignField: '_id',
  justOne: true
});

warehouseSchema.virtual('manager', {
  ref: 'Users',
  localField: 'manager_id',
  foreignField: '_id',
  justOne: true
});

warehouseSchema.virtual('normalizedAddress').get(function () {
  return (
    this.address &&
    `${this.address.text}, ${this.address.ward}, ${this.address.district}, ${this.address.province}`
  );
});

warehouseSchema.pre('save', function () {
  if (this.isModified('name')) {
    const n = handleXss(this.name);
    this.name = n;
    this.pure_name = removeAccents(n, true);
  }
});

warehouseSchema.pre('findOneAndUpdate', function () {
  if (this._update.name) {
    const n = handleXss(this._update.name);
    this._update.name = n;
    this._update.pure_name = removeAccents(n, true);
  }
});

const warehouseModel = model('s_warehouse', warehouseSchema);
export default warehouseModel;
