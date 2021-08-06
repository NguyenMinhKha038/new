import { Schema, model } from 'mongoose';
import { getDate } from '../../commons/utils';

const categoryRevenueSchema = new Schema(
  {
    date: {
      type: Date,
      default: getDate
    },
    company_id: {
      type: Schema.Types.ObjectId,
      required: true
    },
    type_category_id: {
      type: Schema.Types.ObjectId,
      ref: 's_category'
    },
    // * type: 2
    company_category_id: {
      type: Schema.Types.ObjectId,
      ref: 's_category'
    },
    // * type: 3
    sub_category_id: {
      type: Schema.Types.ObjectId,
      ref: 's_category'
    },
    //* +
    total: { type: Number, default: 0 },
    total_pay: { type: Number, default: 0 }
  },
  { timestamps: true }
);

export default model('s_category_revenue', categoryRevenueSchema);
