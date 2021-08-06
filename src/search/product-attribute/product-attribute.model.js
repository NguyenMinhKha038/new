import { Schema, model } from 'mongoose';
import { handleXss, removeAccents } from '../../commons/utils/utils';
import { Statuses } from './product-attribute.config';

export const productAttributeSchema = new Schema(
  {
    name: {
      type: String,
      required: true
    },
    display_name: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: Object.values(Statuses),
      default: Statuses.Active
    },
    pure_name: {
      type: String,
      trim: true
    },
    values: {
      type: [String],
      default: []
    },
    // accepted_type: {
    //   type: String,
    //   enum: Object.values(AcceptedType),
    //   default: AcceptedType.String
    // },
    allow_unlisted_value: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

productAttributeSchema.index({ pure_name: 'text' });
productAttributeSchema.pre('save', function () {
  if (this.isModified('name')) {
    const n = handleXss(this.name);
    this.pure_name = removeAccents(n);
  }
});

productAttributeSchema.pre('findOneAndUpdate', function (next) {
  if (this.getUpdate() && this.getUpdate().name) {
    const n = handleXss(this.getUpdate().name);
    this.getUpdate().pure_name = removeAccents(n);
  }
  next();
});

export default model('s_product_attribute', productAttributeSchema);
