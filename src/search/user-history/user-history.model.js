import { Schema, model } from 'mongoose';
import historyConfig from './user-history.config';
import roundNumber from '../../commons/utils/round-number';

const userHistorySchema = new Schema(
  {
    user_id: {
      type: Schema.Types.ObjectId,
      ref: 'Users'
      // required: true
    },
    company_id: {
      type: Schema.Types.ObjectId,
      ref: 's_company'
      // required: true
    },
    transaction_id: {
      type: Schema.Types.ObjectId,
      required: true,
      refPath: 'onModel'
    },
    onModel: {
      type: String,
      enum: historyConfig.MODEL
    },
    refed_id: {
      type: Schema.Types.ObjectId,
      ref: 'Users'
    },
    type: {
      type: String,
      enum: historyConfig.TYPE
    },
    value: {
      type: Number,
      set: (x) => roundNumber(Math.abs(x)),
      get: (x) => roundNumber(Math.abs(x))
    },
    new_balance: {
      type: String
    }
  },
  { timestamps: true }
);

const userHistory = model('s_history', userHistorySchema);
userHistory.createCollection();
export default userHistory;
