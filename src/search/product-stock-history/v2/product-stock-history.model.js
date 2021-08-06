import { Schema, model } from 'mongoose';
import { Types, Statuses, RelateTo } from './product-stock-history.config';
import { MovingTypes, InitPlaceOfStock, ExportTypes } from '../../goods-batch/goods-batch.config';

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
    product_storing_id: {
      type: Schema.Types.ObjectId,
      ref: 's_product_storing'
    },
    mall_storing_id: {
      type: Schema.Types.ObjectId,
      ref: 's_mall_storing'
    },
    delta_quantity: {
      type: Number,
      required: true
    },
    product_storing_snapshot: {
      is_limited_stock: { type: Boolean },
      stock: { type: Number },
      on_sales_stock: { type: Number },
      batch_stock: { type: Number }
    },
    mall_storing_snapshot: {
      is_limited_stock: { type: Boolean },
      stock: { type: Number },
      on_sales_stock: { type: Number },
      batch_stock: { type: Number }
    },
    status: { type: String, enum: [Statuses.Completed], default: Statuses.Completed }
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

productSchema.pre('save', function () {
  this.product_id = this.id;
});

productSchema.virtual('product_storing', {
  ref: 's_product_storing',
  localField: 'product_storing_id',
  foreignField: '_id',
  justOne: true
});

productSchema.virtual('product', {
  ref: 's_product',
  localField: 'id',
  foreignField: '_id',
  justOne: true
});

productSchema.virtual('mall_storing', {
  ref: 's_mall_storing',
  localField: 'mall_storing_id',
  foreignField: '_id',
  justOne: true
});

const batchSchema = new Schema(
  {
    id: {
      // shorted version
      type: Schema.Types.ObjectId,
      ref: 's_goods_batch'
      // required: function () {
      //   return this.parent().type !== Types.Move;
      // }
    },
    batch_id: {
      // clear version
      type: Schema.Types.ObjectId,
      ref: 's_goods_batch'
    },
    batch_code: {
      type: String,
      trim: true
      // required: function () {
      //   return this.parent().type !== Types.Move;
      // }
    },
    product_id: { type: Schema.Types.ObjectId, ref: 's_product', required: true },
    model_id: { type: Schema.Types.ObjectId },
    from_delta_quantity: { type: Number, required: true },
    different_move_quantity: { type: Number, default: 0 },
    request_move_quantity: {
      type: Number,
      required: function () {
        return this.parent().type === Types.Move;
      }
    },
    from_warehouse_storing_id: {
      type: Schema.Types.ObjectId,
      ref: 's_warehouse',
      required: function () {
        return (this.parent().moving_type + '').startsWith('warehouse');
      }
    },
    to_warehouse_storing_id: {
      type: Schema.Types.ObjectId,
      ref: 's_warehouse'
    },
    from_mall_storing_id: {
      type: Schema.Types.ObjectId,
      ref: 's_mall',
      required: function () {
        return (this.parent().moving_type + '').startsWith('mall');
      }
    },
    to_mall_storing_id: {
      type: Schema.Types.ObjectId,
      ref: 's_mall'
    },
    from_product_storing_id: {
      type: Schema.Types.ObjectId,
      ref: 's_product_storing',
      required: function () {
        return (this.parent().moving_type + '').startsWith('store');
      }
    },
    to_product_storing_id: {
      type: Schema.Types.ObjectId,
      ref: 's_product_storing'
    },
    from_warehouse_storing_snapshot: {
      is_limited_stock: { type: Boolean },
      stock: { type: Number },
      on_sales_stock: { type: Number },
      batch_stock: { type: Number }
    },
    to_warehouse_storing_snapshot: {
      is_limited_stock: { type: Boolean },
      stock: { type: Number },
      on_sales_stock: { type: Number },
      batch_stock: { type: Number }
    },
    from_mall_storing_snapshot: {
      is_limited_stock: { type: Boolean },
      stock: { type: Number },
      on_sales_stock: { type: Number },
      batch_stock: { type: Number }
    },
    to_mall_storing_snapshot: {
      is_limited_stock: { type: Boolean },
      stock: { type: Number },
      on_sales_stock: { type: Number },
      batch_stock: { type: Number }
    },
    from_product_storing_snapshot: {
      is_limited_stock: { type: Boolean },
      stock: { type: Number },
      on_sales_stock: { type: Number },
      batch_stock: { type: Number }
    },
    to_product_storing_snapshot: {
      is_limited_stock: { type: Boolean },
      stock: { type: Number },
      on_sales_stock: { type: Number },
      batch_stock: { type: Number }
    },
    status: {
      type: String,
      enum: Object.values(Statuses),
      default: function () {
        if (this.parent().type === Types.Move) {
          return Statuses.Pending;
        }

        return Statuses.Completed;
      }
    },
    original_batch_id: {
      type: Schema.Types.ObjectId,
      ref: 's_goods_batch',
      default: function () {
        return this.id;
      }
    }
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

batchSchema.pre('save', function () {
  if (this.isModified('id')) {
    this.batch_id = this.id;
  }
});

batchSchema
  .virtual('from_store_storing_id')
  .get(function () {
    return this.from_product_storing_id;
  })
  .set(function (id) {
    this.set({ from_product_storing_id: id });
  });

batchSchema
  .virtual('to_store_storing_id')
  .get(function () {
    return this.to_product_storing_id;
  })
  .set(function (id) {
    this.set({ to_product_storing_id: id });
  });

batchSchema.virtual('from_product_storing', {
  ref: 's_product_storing',
  localField: 'from_product_storing_id',
  foreignField: '_id',
  justOne: true
});

batchSchema.virtual('to_product_storing', {
  ref: 's_product_storing',
  localField: 'to_product_storing_id',
  foreignField: '_id',
  justOne: true
});

batchSchema.virtual('from_store_storing', {
  ref: 's_product_storing',
  localField: 'from_product_storing_id',
  foreignField: '_id',
  justOne: true
});

batchSchema.virtual('to_store_storing', {
  ref: 's_product_storing',
  localField: 'to_product_storing_id',
  foreignField: '_id',
  justOne: true
});

batchSchema.virtual('from_warehouse_storing', {
  ref: 's_warehouse_storing',
  localField: 'from_warehouse_storing_id',
  foreignField: '_id',
  justOne: true
});

batchSchema.virtual('to_warhouse_storing', {
  ref: 's_warehouse_storing',
  localField: 'to_warehouse_storing_id',
  foreignField: '_id',
  justOne: true
});

batchSchema.virtual('from_mall_storing', {
  ref: 's_mall_storing',
  localField: 'from_mall_storing_id',
  foreignField: '_id',
  justOne: true
});

batchSchema.virtual('to_mall_storing', {
  ref: 's_mall_storing',
  localField: 'to_mall_storing_id',
  foreignField: '_id',
  justOne: true
});

batchSchema
  .virtual('from_store_storing_snapshot')
  .get(function () {
    return this.from_product_storing_snapshot;
  })
  .set(function (snapshot) {
    this.set({ from_product_storing_snapshot: snapshot });
  });

batchSchema
  .virtual('to_store_storing_snapshot')
  .get(function () {
    return this.to_product_storing_snapshot;
  })
  .set(function (snapshot) {
    this.set({ to_product_storing_snapshot: snapshot });
  });

batchSchema.virtual('product', {
  ref: 's_product',
  localField: 'product_id',
  foreignField: '_id',
  justOne: true
});

batchSchema.virtual('batch', {
  ref: 's_goods_batch',
  localField: 'batch_id',
  foreignField: '_id',
  justOne: true
});

batchSchema.virtual('original_batch', {
  ref: 's_goods_batch',
  localField: 'original_batch_id',
  foreignField: '_id',
  justOne: true
});

const userSchema = new Schema(
  {
    user_id: { type: Schema.Types.ObjectId, ref: 'Users' },
    name: { type: String },
    phone: { type: String },
    status: { type: String },
    is_company: { type: Boolean },
    is_owner: { type: Boolean },
    mall_id: { type: Schema.Types.ObjectId },
    warehouse_id: { type: Schema.Types.ObjectId },
    company_id: { type: Schema.Types.ObjectId },
    store_id: { type: Schema.Types.ObjectId },
    staff_of: [{ type: String, enum: Object.values(InitPlaceOfStock) }],
    perform_as: {
      type: String,
      enum: Object.values(InitPlaceOfStock),
      required: function () {
        return this.parent().type === Types.Move;
      }
    },
    perform_as_id: {
      type: Schema.Types.ObjectId,
      required: function () {
        return this.parent().type === Types.Move;
      }
    },
    type: []
  },
  { timestamps: true, toObject: { virtuals: true }, toJSON: { virtuals: true } }
);

userSchema.virtual('user', {
  ref: 'Users',
  localField: 'user_id',
  foreignField: '_id',
  justOne: true
});

const productStockHistorySchema = new Schema(
  {
    products: [productSchema],
    batches: [batchSchema],
    requester: userSchema,
    approver: userSchema,
    confirmor: userSchema,
    user_id: {
      type: Schema.Types.ObjectId,
      ref: 'users'
    },
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
    from_mall_id: {
      type: Schema.Types.ObjectId,
      index: true,
      ref: 's_mall'
    },
    to_mall_id: {
      type: Schema.Types.ObjectId,
      index: true,
      ref: 's_mall'
    },
    from_warehouse_id: {
      type: Schema.Types.ObjectId,
      index: true,
      ref: 's_mall'
    },
    to_warehouse_id: {
      type: Schema.Types.ObjectId,
      index: true,
      ref: 's_mall'
    },
    company_id: {
      type: Schema.Types.ObjectId,
      ref: 's_company'
      // required: true,
      // index: true
    },
    notes: [{ type: String, trim: true }],
    moving_notes: {
      request_note: { type: String, trim: true, default: '' },
      approve_note: { type: String, trim: true, default: '' },
      confirm_note: { type: String, trim: true, default: '' }
    },
    type: {
      type: String,
      enum: Object.values(Types),
      required: true
    },
    moving_type: {
      type: String,
      enum: Object.values(MovingTypes)
    },
    status: {
      type: String,
      enum: Object.values(Statuses),
      default: function () {
        return this.type === Types.Move ? Statuses.Pending : Statuses.Completed;
      }
    },
    transaction_id: { type: Schema.Types.ObjectId },
    on_model: { type: String, enum: ['s_order'] },
    relate_to: { type: String, enum: Object.values(RelateTo) },
    need_approved: {
      type: Boolean,
      default: function () {
        return this.type === Types.Move;
      }
    },
    export_type: {
      type: String,
      enum: Object.values(ExportTypes),
      required: function () {
        return this.type === Types.Export;
      }
    },
    from_entity_id: { type: Schema.Types.ObjectId },
    to_entity_id: { type: Schema.Types.ObjectId },
    confirmed_difference: { type: Boolean, default: false },
    need_confirm_difference: { type: Boolean, default: false },
    approvedAt: { type: Date },
    confirmedAt: { type: Date }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    collection: 's_product_stock_histories'
  }
);

productStockHistorySchema.virtual('user', {
  ref: 'Users',
  localField: 'user_id',
  foreignField: '_id',
  justOne: true,
  select: 'address level name pure_name real_name status phone avatar'
});

productStockHistorySchema.virtual('from_store', {
  ref: 's_store',
  localField: 'from_store_id',
  foreignField: '_id',
  justOne: true
});

productStockHistorySchema.virtual('to_store', {
  ref: 's_store',
  localField: 'to_store_id',
  foreignField: '_id',
  justOne: true
});

productStockHistorySchema.virtual('from_warehouse', {
  ref: 's_warehouse',
  localField: 'from_warehouse_id',
  foreignField: '_id',
  justOne: true
});

productStockHistorySchema.virtual('to_warehouse', {
  ref: 's_warehouse',
  localField: 'to_warehouse_id',
  foreignField: '_id',
  justOne: true
});

productStockHistorySchema.virtual('from_mall', {
  ref: 's_mall',
  localField: 'from_mall_id',
  foreignField: '_id',
  justOne: true
});

productStockHistorySchema.virtual('to_mall', {
  ref: 's_mall',
  localField: 'to_mall_id',
  foreignField: '_id',
  justOne: true
});

productStockHistorySchema.virtual('transaction', {
  refPath: 'on_model',
  localField: 'transaction_id',
  foreignField: '_id',
  justOne: true
});

productStockHistorySchema.virtual('total_request_stocks').get(function () {
  if (!Array.isArray(this.batches)) return 0;

  let total = 0;
  for (const batch of this.batches) {
    total += batch.request_move_quantity;
  }
  return total;
});

productStockHistorySchema.virtual('total_moved_stocks').get(function () {
  if (!Array.isArray(this.batches)) return 0;

  let total = 0;
  for (const batch of this.batches) {
    total += Math.abs(batch.from_delta_quantity);
  }
  return total;
});

productStockHistorySchema
  .virtual('note')
  .get(function () {
    return this.notes && this.notes.length ? this.notes[0] : '';
  })
  .set(function (note) {
    if (note) {
      this.notes && this.notes.unshift(note);
      const notes = this.notes || [];
      this.set({ notes });
    }
  });

productStockHistorySchema
  .virtual('request_note')
  .get(function () {
    return this.moving_notes.request_note;
  })
  .set(function (note) {
    const moving_notes = { ...this.moving_notes, request_note: note };
    this.set({ moving_notes });
  });

productStockHistorySchema
  .virtual('confirm_note')
  .get(function () {
    return this.moving_notes.confirm_note;
  })
  .set(function (note) {
    const moving_notes = { ...this.moving_notes, confirm_note: note };
    this.set({ moving_notes });
  });

productStockHistorySchema
  .virtual('approve_note')
  .get(function () {
    return this.moving_notes.approve_note;
  })
  .set(function (note) {
    const moving_notes = { ...this.moving_notes, approve_note: note };
    this.set({ moving_notes });
  });

productStockHistorySchema.pre('save', function () {
  if (this.isNew) {
    this.from_entity_id = this.from_store_id || this.from_warehouse_id || this.from_mall_id;

    const toEntityId = this.to_store_id || this.to_warehouse_id || this.to_mall_id;
    if (toEntityId) {
      this.to_entity_id = toEntityId;
    }
  }
  if (this.type === Types.Move) {
    this.need_confirm_difference =
      !this.confirmed_difference &&
      this.status === Statuses.Completed &&
      this.batches.some((batch) => batch.different_move_quantity > 0);
  }
});

export default model('s_product_stock_history_v2', productStockHistorySchema);
