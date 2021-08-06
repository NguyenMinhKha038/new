import { Schema, model } from 'mongoose';
import { CheckingPlaces, CheckingTypes, Statuses } from './stock-checking.config';

const stockCheckingSchema = new Schema(
  {
    status: {
      type: String,
      enum: Object.values(Statuses),
      default: Statuses.Pending
    },
    checking_date: {
      type: Date
    },
    completed_date: {
      type: Date
    },
    staff_id: {
      type: Schema.Types.ObjectId
    },
    company_id: {
      type: Schema.Types.ObjectId
    },
    store_id: {
      type: Schema.Types.ObjectId
    },
    warehouse_id: {
      type: Schema.Types.ObjectId
    },
    mall_id: {
      type: Schema.Types.ObjectId
    },
    checking_place: {
      type: String,
      enum: Object.values(CheckingPlaces),
      required: true
    },
    checking_place_id: {
      type: Schema.Types.ObjectId,
      required: true
    },
    type: {
      type: String,
      enum: Object.values(CheckingTypes)
    },
    category_id: {
      type: Schema.Types.ObjectId
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

stockCheckingSchema.virtual('staff', {
  ref: 'Users',
  localField: 'staff_id',
  foreignField: '_id',
  justOne: true
});

stockCheckingSchema.virtual('company', {
  ref: 's_company',
  localField: 'company_id',
  foreignField: '_id',
  justOne: true
});

stockCheckingSchema.virtual('store', {
  ref: 's_store',
  localField: 'store_id',
  foreignField: '_id',
  justOne: true
});

stockCheckingSchema.virtual('warehouse', {
  ref: 's_warehouse',
  localField: 'warehouse_id',
  foreignField: '_id',
  justOne: true
});

stockCheckingSchema.virtual('mall', {
  ref: 's_mall',
  localField: 'mall_id',
  foreignField: '_id',
  justOne: true
});

stockCheckingSchema.virtual('category', {
  ref: 's_category',
  localField: 'category_id',
  foreignField: '_id',
  justOne: true
});

export default model('s_stock_checking', stockCheckingSchema);
