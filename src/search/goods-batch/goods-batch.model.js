import { Schema, model } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import goodsBatchHelper from './goods-batch.helper';
import { Statuses, PlaceOfStock } from './goods-batch.config';
import { removeFields, pickFields } from '../../commons/utils/utils';

export const goodsBatchSchema = new Schema(
  {
    status: { type: String, enum: Object.values(Statuses), default: Statuses.Active },
    is_temporary: { type: Boolean, default: false },
    on_sales: { type: Boolean, default: false },
    transportable: { type: Boolean, default: true },
    batch_code: { type: String, default: () => uuidv4() },
    product_id: { type: Schema.Types.ObjectId, ref: 's_product', required: true },
    model_id: { type: Schema.Types.ObjectId },
    import_date: { type: Date, default: Date.now },
    export_date: { type: Date },
    manufacturing_date: { type: Date },
    expiry_date: { type: Date },
    stock_keeping_unit: { type: String, default: '' },
    stock: { type: Number, default: 0 },
    on_sales_stock: { type: Number, default: 0 },
    position: { type: String, default: '' },
    place_of_stock: {
      type: 'string',
      enum: Object.values(PlaceOfStock),
      required: true
    },
    company_id: { type: Schema.Types.ObjectId, ref: 's_company' },
    warehouse_id: {
      type: Schema.Types.ObjectId,
      ref: 's_warehouse',
      required: function () {
        return this.place_of_stock === PlaceOfStock.Warehouse;
      }
    },
    warehouse_storing_id: {
      type: Schema.Types.ObjectId,
      ref: 's_warehouse_storing',
      required: function () {
        return this.place_of_stock === PlaceOfStock.Warehouse;
      }
    },
    mall_id: {
      type: Schema.Types.ObjectId,
      ref: 's_mall',
      required: function () {
        return this.place_of_stock === PlaceOfStock.Mall;
      }
    },
    mall_storing_id: {
      type: Schema.Types.ObjectId,
      ref: 's_mall_storing',
      required: function () {
        return this.place_of_stock === PlaceOfStock.Mall;
      }
    },
    store_id: {
      type: Schema.Types.ObjectId,
      ref: 's_store',
      required: function () {
        return this.place_of_stock === PlaceOfStock.Store;
      }
    },
    product_storing_id: {
      type: Schema.Types.ObjectId,
      ref: 's_product_storing',
      required: function () {
        return this.place_of_stock === PlaceOfStock.Store;
      }
    },
    notes: [{ type: String, trim: true }],
    provider_id: { type: Schema.Types.ObjectId, ref: 's_provider' },
    provider_name: { type: String },
    sold: { type: Number, default: 0 },
    exported: { type: Number, default: 0 },
    out_of_stock: { type: Boolean }, // out of stock in both on_sales_stock & batch_stock
    in_stock: { type: Boolean }, // in stock true when batch_stock > 0

    // Supported fields for matching MFG, EXP by date string (yyyy-mm-dd)
    mfg_date: {
      type: String,
      default: function () {
        const d = new Date(this.manufacturing_date);
        return d.toISOString().split('T')[0];
      }
    },
    exp_date: {
      type: String,
      default: function () {
        const d = new Date(this.expiry_date);
        return d.toISOString().split('T')[0];
      }
    }
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

goodsBatchSchema
  .virtual('MFG')
  .set(function (d) {
    this.set({ manufacturing_date: new Date(d) });
  })
  .get(function () {
    return this.manufacturing_date;
  });

goodsBatchSchema
  .virtual('EXP')
  .set(function (d) {
    this.set({ expiry_date: new Date(d) });
  })
  .get(function () {
    return this.expiry_date;
  });

goodsBatchSchema
  .virtual('SKU')
  .set(function (v) {
    this.set({ stock_keeping_unit: v });
  })
  .get(function () {
    return this.stock_keeping_unit;
  });

goodsBatchSchema.virtual('product', {
  ref: 's_product',
  localField: 'product_id',
  foreignField: '_id',
  justOne: true
});

goodsBatchSchema.virtual('detail', {
  ref: 's_product',
  localField: 'product_id',
  foreignField: '_id',
  justOne: true
});

goodsBatchSchema.virtual('warehouse_storing', {
  ref: 's_warehouse_storing',
  localField: 'warehouse_storing_id',
  foreignField: '_id',
  justOne: true
});

goodsBatchSchema.virtual('mall_storing', {
  ref: 's_mall_storing',
  localField: 'mall_storing_id',
  foreignField: '_id',
  justOne: true
});

goodsBatchSchema.virtual('product_storing', {
  ref: 's_product_storing',
  localField: 'product_storing_id',
  foreignField: '_id',
  justOne: true
});

goodsBatchSchema
  .virtual('store_storing_id')
  .get(function () {
    return this.product_storing_id;
  })
  .set(function (id) {
    this.set({ product_storing_id: id });
  });

goodsBatchSchema.virtual('store_storing', {
  ref: 's_product_storing',
  localField: 'product_storing_id',
  foreignField: '_id',
  justOne: true
});

goodsBatchSchema.virtual('provider', {
  ref: 's_provider',
  localField: 'provider_id',
  foreignField: '_id',
  justOne: true
});

goodsBatchSchema.virtual('store', {
  ref: 's_store',
  localField: 'store_id',
  foreignField: '_id',
  justOne: true
});

goodsBatchSchema.virtual('warehouse', {
  ref: 's_warehouse',
  localField: 'warehouse_id',
  foreignField: '_id',
  justOne: true
});

goodsBatchSchema.virtual('mall', {
  ref: 's_mall',
  localField: 'mall_id',
  foreignField: '_id',
  justOne: true
});

goodsBatchSchema.virtual('storing_entity').get(function () {
  const placeOfStock = this.place_of_stock;
  if (placeOfStock === PlaceOfStock.Warehouse) {
    return placeOfStock;
  }
  if (placeOfStock === PlaceOfStock.Mall) {
    return placeOfStock;
  }
  return 'product';
});

goodsBatchSchema.virtual('storing_id').get(function () {
  const placeOfStock = this.place_of_stock;
  if (placeOfStock === PlaceOfStock.Warehouse) {
    return this.warehouse_storing_id;
  }
  if (placeOfStock === PlaceOfStock.Store) {
    return this.product_storing_id;
  }
  return this.mall_storing_id;
});

goodsBatchSchema.virtual('place_of_stock_id').get(function () {
  const placeOfStock = this.place_of_stock;
  if (placeOfStock === PlaceOfStock.Warehouse) {
    return this.warehouse_id;
  }
  if (placeOfStock === PlaceOfStock.Store) {
    return this.product_id;
  }
  return this.mall_id;
});

goodsBatchSchema
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

goodsBatchSchema.pre('save', function () {
  if (this.isModified('on_sales')) {
    if (!this.on_sales) {
      this.on_sales_stock = 0;
    }
  }
  if (this.isModified('stock') || this.isModified('on_sales_stock')) {
    this.out_of_stock = this.stock + this.on_sales_stock <= 0;
    this.in_stock = this.stock > 0;
    this.on_sales = this.on_sales_stock > 0;
  }
});

goodsBatchSchema.pre('findOneAndUpdate', function () {
  if (typeof this._update.on_sales === 'boolean' && !this._update.on_sales) {
    this._update.on_sales_stock = 0;
  }
});

goodsBatchSchema.methods = {
  removeFields: removeFields,
  pickFields: pickFields,
  canMerge: goodsBatchHelper.canMerge,
  mergeBatch: goodsBatchHelper.mergeBatch,
  findCanMergedBatch: goodsBatchHelper.findCanMergedBatch,
  getModel: goodsBatchHelper.getModel
};

export default model('s_goods_batch', goodsBatchSchema);
