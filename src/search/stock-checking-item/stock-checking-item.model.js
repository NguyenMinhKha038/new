import { Schema, model } from 'mongoose';
import { Statuses } from './stock-checking-item.config';

const stockCheckingItemSchema = new Schema(
  {
    status: {
      type: String,
      enum: Object.values(Statuses),
      default: Statuses.Pending
    },
    stock_checking_id: {
      type: Schema.Types.ObjectId,
      required: true
    },
    model_id: {
      type: Schema.Types.ObjectId,
      default: null
    },
    warehouse_storing_id: {
      type: Schema.Types.ObjectId
    },
    mall_storing_id: {
      type: Schema.Types.ObjectId
    },
    product_storing_id: {
      type: Schema.Types.ObjectId
    },
    storing_id: {
      type: Schema.Types.ObjectId,
      required: true
    },
    product_id: {
      type: Schema.Types.ObjectId,
      required: true
    },
    stock: {
      type: Number,
      default: 0
    },
    actual_stock: {
      type: Number,
      default: 0
    },
    name: {
      type: String
    },
    difference_stock: {
      type: Number,
      default: 0
    },
    good_condition: {
      type: Number,
      default: 0
    },
    medium_condition: {
      type: Number,
      default: 0
    },
    poor_condition: {
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

stockCheckingItemSchema.virtual('stock_checking', {
  ref: 's_stock_checking',
  localField: 'stock_checking_id',
  foreignField: '_id',
  justOne: true
});
stockCheckingItemSchema.virtual('warehouse_storing', {
  ref: 's_warehouse_storing',
  localField: 'warehouse_storing_id',
  foreignField: '_id',
  justOne: true
});

stockCheckingItemSchema.virtual('product_storing', {
  ref: 's_product_storing',
  localField: 'product_storing_id',
  foreignField: '_id',
  justOne: true
});
stockCheckingItemSchema.virtual('mall_storing', {
  ref: 's_mall_storing',
  localField: 'mall_storing_id',
  foreignField: '_id',
  justOne: true
});
stockCheckingItemSchema.virtual('product', {
  ref: 's_product_v2',
  localField: 'product_id',
  foreignField: '_id',
  justOne: true
});

stockCheckingItemSchema.pre('save', function () {
  if (this.stock && this.actual_stock)
    this.difference_stock = Math.abs(this.stock - this.actual_stock);
  next();
});

export default model('s_stock_checking_item', stockCheckingItemSchema);
