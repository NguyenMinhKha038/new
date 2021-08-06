import { Schema, model } from 'mongoose';
import { removeFields } from '../../commons/utils/utils';
import { TrackingPlaces, Types as TrackingTypes } from './product-stock-tracking.config';

const productStockTrackingSchema = new Schema(
  {
    type: { type: String, enum: Object.values(TrackingTypes), required: true },
    company_id: { type: Schema.Types.ObjectId, ref: 's_company' },
    store_id: { type: Schema.Types.ObjectId, ref: 's_store' },
    warehouse_id: { type: Schema.Types.ObjectId, ref: 's_warehouse' },
    mall_id: { type: Schema.Types.ObjectId, ref: 's_mall' },
    product_storing_id: { type: Schema.Types.ObjectId, ref: 's_product_storing' },
    mall_storing_id: { type: Schema.Types.ObjectId, ref: 's_mall_storing' },
    warehouse_storing_id: { type: Schema.Types.ObjectId, ref: 's_warehouse_storing' },
    storing_id: { type: Schema.Types.ObjectId }, // auto
    product_id: { type: Schema.Types.ObjectId, ref: 's_product' },
    batch_id: { type: Schema.Types.ObjectId, ref: 's_goods_batch' },
    type_category_id: { type: Schema.Types.ObjectId, ref: 's_category' },
    company_category_id: { type: Schema.Types.ObjectId, ref: 's_category' },
    sub_category_id: { type: Schema.Types.ObjectId, ref: 's_category' },
    tracking_date: { type: String }, // auto
    tracking_place: { type: String }, // auto
    tracking_place_id: { type: Schema.Types.ObjectId }, // auto
    prev: {
      stock: { type: Number, min: 0, default: 0 },
      batch_stock: { type: Number, min: 0, default: 0 },
      on_sales_stock: { type: Number, min: 0, default: 0 },
      is_limited_stock: { type: Boolean, default: true }
    },
    stock: { type: Number, min: 0 },
    batch_stock: { type: Number, min: 0 },
    on_sales_stock: { type: Number, min: 0 },
    is_limited_stock: { type: Boolean, default: true }
  },
  { toObject: { virtuals: true }, toJSON: { virtuals: true }, timestamps: true }
);

productStockTrackingSchema.pre('save', async function () {
  if (this.isNew) {
    if (this.warehouse_storing_id) {
      this.mall_storing_id = undefined;
      this.product_storing_id = undefined;
    } else if (this.product_storing_id) {
      this.mall_storing_id = undefined;
      this.warehouse_storing_id = undefined;
    } else if (this.mall_storing_id) {
      this.product_storing_id = undefined;
      this.warehouse_storing_id = undefined;
    } else {
      throw new Error('missing storing id');
    }

    this.tracking_place =
      (this.warehouse_id && TrackingPlaces.Warehouse) ||
      (this.store_id && TrackingPlaces.Store) ||
      (this.mall_id && TrackingPlaces.Mall);
    this.tracking_place_id = this[`${this.tracking_place}_id`];
    this.storing_id = this.warehouse_storing_id || this.product_storing_id || this.mall_storing_id;
    const isoDateString = new Date().toISOString();
    this.tracking_date = isoDateString.split('T')[0];
  }
});

productStockTrackingSchema.methods = {
  removeFields: removeFields
};

productStockTrackingSchema
  .virtual('store_storing_id')
  .get(function () {
    return this.product_storing_id;
  })
  .set(function (id) {
    this.set({ product_storing_id: id });
  });

const productStockTrackingModel = model('s_product_stock_tracking', productStockTrackingSchema);
export default productStockTrackingModel;
