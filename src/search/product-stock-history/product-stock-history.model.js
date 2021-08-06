import { Schema, model } from 'mongoose';
import { Types, Statuses, RelateTo } from './product-stock-history.config';
import { handleXss, removeAccents } from '../../commons/utils/utils';
import { MovingTypesExtra, RequesterTypes } from '../stock/stock.config';
import permissionGroupService from '../permission-group/permission-group.service';
import providerService from '../provider/provider.service';

// This schema used for multi move stock request
const productSchema = new Schema(
  {
    id: {
      // shorted version
      type: Schema.Types.ObjectId,
      ref: 's_product'
    },
    product_id: {
      // clear version
      type: Schema.Types.ObjectId,
      ref: 's_product'
    },
    from_product_storing_id: {
      type: Schema.Types.ObjectId,
      ref: 's_product_storing'
    },
    to_product_storing_id: {
      type: Schema.Types.ObjectId,
      ref: 's_product_storing'
    },
    from_delta_quantity: {
      type: Number,
      required: true
    },
    request_move_quantity: { type: Number },
    from_storing_snapshot: {
      is_active_product: { type: Boolean },
      is_active_store: { type: Boolean },
      is_active_company: { type: Boolean },
      is_limited_stock: { type: Boolean },
      transportable: { type: Boolean },
      stock: { type: Number }
    },
    to_storing_snapshot: {
      is_active_product: { type: Boolean },
      is_active_store: { type: Boolean },
      is_active_company: { type: Boolean },
      is_limited_stock: { type: Boolean },
      transportable: { type: Boolean },
      stock: { type: Number }
    },
    status: {
      type: String,
      enum: Statuses,
      default: 'pending'
    }
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

productSchema.pre('save', function () {
  this.product_id = this.id;
});

productSchema.virtual('from_product_storing', {
  ref: 's_product_storing',
  localField: 'from_product_storing_id',
  foreignField: '_id',
  justOne: true
});

productSchema.virtual('to_product_storing', {
  ref: 's_product_storing',
  localField: 'to_product_storing_id',
  foreignField: '_id',
  justOne: true
});

productSchema.virtual('product', {
  ref: 's_product',
  localField: 'id',
  foreignField: '_id',
  justOne: true
});

const productStockSchema = new Schema(
  {
    products: [productSchema],
    from_store_id: {
      type: Schema.Types.ObjectId,
      index: true,
      ref: 's_store'
    },
    to_store_id: {
      type: Schema.Types.ObjectId,
      index: true,
      ref: 's_store'
    },
    company_id: {
      type: Schema.Types.ObjectId,
      ref: 's_company',
      required: true,
      index: true
    },
    // Used for update, import, export notes
    note: {
      type: String,
      trim: true,
      default: ''
    },
    // Used for request, approve, confirm notes
    notes: {
      request_note: { type: String, trim: true, default: '' },
      approve_note: { type: String, trim: true, default: '' },
      confirm_note: { type: String, trim: true, default: '' }
    },
    type: {
      type: String,
      enum: Types
    },
    performed_by_id: {
      // requester
      type: Schema.Types.ObjectId,
      ref: 'users'
    },
    performed_store_id: {
      type: Schema.Types.ObjectId,
      ref: 'users'
    },
    performed_by_owner: {
      type: Boolean,
      default: false
    },
    handled_by_id: {
      type: Schema.Types.ObjectId,
      ref: 'users'
    },
    approved_by_id: {
      type: Schema.Types.ObjectId,
      ref: 'users'
    },
    user_id: {
      //buy user
      type: Schema.Types.ObjectId,
      ref: 'users'
    },
    status: {
      type: String,
      enum: Statuses,
      default: 'completed'
    },
    transaction_id: { type: Schema.Types.ObjectId },
    on_model: { type: String, enum: ['s_order'] },
    moving_type: {
      type: String,
      enum: Object.values(MovingTypesExtra)
    },
    need_approved: { type: Boolean, default: false },
    requester_type: { type: String, enum: RequesterTypes, default: 'store' },
    relate_to: { type: String, enum: RelateTo }
    // provider: { type: String, trim: true },
    // provider_id: { type: Schema.Types.ObjectId, ref: 's_provider' }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    collection: 's_product_stock_histories'
  }
);

productStockSchema.virtual('performed_by', {
  ref: 'Users',
  localField: 'performed_by_id',
  foreignField: '_id',
  justOne: true,
  select: 'address level name pure_name real_name status phone avatar'
});

productStockSchema.virtual('handled_by', {
  ref: 'Users',
  localField: 'handled_by_id',
  foreignField: '_id',
  justOne: true,
  select: 'address level name pure_name real_name status phone avatar'
});

productStockSchema.virtual('approved_by', {
  ref: 'Users',
  localField: 'approved_by_id',
  foreignField: '_id',
  justOne: true,
  select: 'address level name pure_name real_name status phone avatar'
});

productStockSchema.virtual('user', {
  ref: 'Users',
  localField: 'user_id',
  foreignField: '_id',
  justOne: true,
  select: 'address level name pure_name real_name status phone avatar'
});

productStockSchema.virtual('from_store', {
  ref: 's_store',
  localField: 'from_store_id',
  foreignField: '_id',
  justOne: true
});

productStockSchema.virtual('to_store', {
  ref: 's_store',
  localField: 'to_store_id',
  foreignField: '_id',
  justOne: true
});

productStockSchema.virtual('transaction', {
  refPath: 'on_model',
  localField: 'transaction_id',
  foreignField: '_id',
  justOne: true
});

productStockSchema.virtual('total_request_stocks').get(function () {
  let total = 0;
  for (const product of this.products) {
    total += product.request_move_quantity;
  }
  return total;
});

productStockSchema.virtual('total_moved_stocks').get(function () {
  let total = 0;
  for (const product of this.products) {
    total += Math.abs(product.from_delta_quantity);
  }
  return total;
});

productStockSchema.pre('save', async function () {
  // Handle xss for fields `note`, `notes` & `provider`
  if (this.isModified('notes')) {
    for (const [key, val] of Object.entries(this.notes)) {
      const note = handleXss(val);
      this.notes[key] = note;
    }
  }
  const historyStatus = this.status;
  if (this.isModified('status') && this.type !== 'move') {
    this.products.forEach((product) => {
      product.status = historyStatus;
    });
  }
  if (this.isModified('note')) {
    this.note = handleXss(this.note);
  }

  // Map fields `performed_by_owner`, `performed_store_id`
  if (this.isModified('performed_by_id')) {
    const permission = await permissionGroupService.findOneActive({
      user_id: this.performed_by_id,
      company_id: this.company_id
    });

    if (permission) {
      const { is_owner = false, store_id } = permission;
      this.performed_by_owner = is_owner;
      store_id && (this.performed_store_id = store_id);
    }
  }
});

const productStockHistoryModel = model('s_product_stock_history', productStockSchema);
export default productStockHistoryModel;
