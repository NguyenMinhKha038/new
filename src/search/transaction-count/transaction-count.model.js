import { Schema, model } from 'mongoose';
import { getDate } from '../../commons/utils';

const transactionCountSchema = new Schema(
  {
    user_id: {
      type: Schema.Types.ObjectId,
      ref: 'Users'
    },
    company_id: {
      type: Schema.Types.ObjectId,
      ref: 's_company'
    },
    date: {
      type: Date,
      default: getDate
    },
    withdraw: {
      type: Number,
      default: 0
    },
    transfer: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

export default model('s_transaction_count', transactionCountSchema);
