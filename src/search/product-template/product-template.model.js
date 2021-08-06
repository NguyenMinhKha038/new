import { Schema, model } from 'mongoose';
import { Statuses } from './product-template.config';

const attributeSchema = new Schema(
  {
    attribute_id: {
      type: Schema.Types.ObjectId,
      ref: 's_product_attribute'
    },
    is_required: { type: Boolean, default: true }
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

attributeSchema.virtual('product_attribute', {
  ref: 's_product_attribute',
  localField: 'attribute_id',
  foreignField: '_id',
  justOne: true
});

const productTemplateSchema = new Schema(
  {
    category_id: {
      type: Schema.Types.ObjectId,
      ref: 's_category'
    },
    attributes: [attributeSchema],
    allow_unknown_attribute: {
      type: Boolean,
      default: false
    },
    name: {
      type: String
    },
    status: {
      type: String,
      enum: Object.values(Statuses),
      default: Statuses.Pending
    },
    version: { type: Number, default: 1 }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

productTemplateSchema.virtual('category', {
  ref: 's_category',
  localField: 'category_id',
  foreignField: '_id',
  justOne: true
});

export default model('s_product_template', productTemplateSchema);
