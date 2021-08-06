import { Schema, model } from 'mongoose';
import { Scopes, Statuses, Types, Units } from './selling-option.config';
import { removeAccents, handleXss, removeFields } from '../../commons/utils/utils';

const optionItemSchema = new Schema(
  {
    status: { type: String, enum: Object.values(Statuses), default: Statuses.Active },
    name: { type: String, trim: true, required: true },
    value: { type: Schema.Types.Mixed, trim: true, required: true },
    image_url: { type: String, trim: true },
    price: { type: Number, min: 0, required: true },
    quantity: { type: Number, default: 0 },
    is_limited_quantity: { type: Boolean, default: true }
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

const sellingOptionSchema = new Schema(
  {
    scope: { type: String, default: Scopes.Global },
    company_id: { type: Schema.Types.ObjectId },
    store_id: { type: Schema.Types.ObjectId },
    status: { type: String, enum: Object.values(Statuses), default: Statuses.Active },
    required: { type: Boolean, default: false },
    type: { type: String, enum: Object.values(Types), default: Types.Option },
    name: { type: String, trim: true, required: true },
    pure_name: { type: String, trim: true },
    image_url: { type: String, trim: true },
    unit: { type: String, enum: Object.values(Units), default: Units.NA },
    options: [optionItemSchema]
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

sellingOptionSchema.virtual('company', {
  ref: 's_company',
  localField: 'company_id',
  foreignField: '_id',
  justOne: true
});

sellingOptionSchema.virtual('store', {
  ref: 's_store',
  localField: 'store_id',
  foreignField: '_id',
  justOne: true
});

sellingOptionSchema.pre('save', function () {
  if (this.isModified('name')) {
    const n = handleXss(this.name);
    this.name = n;
    this.pure_name = removeAccents(n, true);
  }

  if (this.store_id) {
    this.set({ scope: Scopes.Store });
  } else if (this.company_id) {
    this.set({ scope: Scopes.Company });
  }
});

sellingOptionSchema.methods = {
  removeFields: removeFields,
  getChosenItem: function (itemId) {
    const doc = this.toObject();
    const item = doc.options.find((option) => option._id.toString() === itemId.toString());
    doc.item = item;

    return doc;
  }
};

const sellingOptionModel = model('s_selling_option', sellingOptionSchema);
export default sellingOptionModel;
