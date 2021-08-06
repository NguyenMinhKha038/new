import { Schema, model } from 'mongoose';
import { Statuses } from './menu.config';

const productSchema = new Schema(
  {
    product_id: { type: Schema.Types.ObjectId, ref: 's_product' },
    product_storing_id: { type: Schema.Types.ObjectId, ref: 's_product_storing' },
    status: { type: String, enum: ['active', 'disabled'], default: 'active' },
    options: [{ type: Schema.Types.ObjectId, ref: 's_selling_option' }],
    sold: { type: Number, default: 0 },
    tags: [String]
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

productSchema.virtual('product', {
  ref: 's_product',
  localField: 'product_id',
  foreignField: '_id',
  justOne: true
});

productSchema.virtual('product_storing', {
  ref: 's_product_storing',
  localField: 'product_storing_id',
  foreignField: '_id',
  justOne: true
});

const menuSchema = new Schema(
  {
    status: { type: String, enum: Object.values(Statuses), default: Statuses.Active },
    company_id: { type: Schema.Types.ObjectId },
    user_id: { type: Schema.Types.ObjectId, required: true },
    store_id: { type: Schema.Types.ObjectId },
    products: { type: [productSchema], default: [] }
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

menuSchema.virtual('store', {
  ref: 's_store',
  localField: 'store_id',
  foreignField: '_id',
  justOne: true
});

menuSchema.virtual('company', {
  ref: 's_company',
  localField: 'company_id',
  foreignField: '_id',
  justOne: true
});

menuSchema.virtual('user', {
  ref: 'Users',
  localField: 'user_id',
  foreignField: '_id',
  justOne: true
});

const menuModel = model('s_menu', menuSchema);
export default menuModel;
