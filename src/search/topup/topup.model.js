import { Schema, model } from 'mongoose';
import { getDate } from '../../commons/utils';
import roundNumber from '../../commons/utils/round-number';

const topUpSchema = new Schema(
  {
    user_id: { type: Schema.Types.ObjectId, required: true },
    amount: { type: Number, enum: [20000, 30000, 50000, 100000, 200000, 300000, 500000] },
    publisher: { type: String, enum: ['VTT', 'VNM', 'VNP', 'VMS', 'GMB'] },
    status: { type: String, enum: ['success', 'pending', 'failed'] },
    combo: { type: String, enum: ['three_month', 'six_month', 'twelve_month'] },
    months: { type: Number },
    month: { type: Number },
    date: { type: Date, default: getDate },
    type: { type: String, enum: ['fast', 'slow'] },
    total: { type: Number, set: (x) => roundNumber(x), get: (x) => roundNumber(x) },
    code: { type: String },
    receiver: { type: String },
    external_transaction_id: String,
    combo_id: Schema.Types.ObjectId,
    in_combo: { type: Boolean, default: false },
    refund_rate: { type: Number, set: (x) => roundNumber(x, 4), get: (x) => roundNumber(x, 4) },
    total_refund: { type: Number, set: (x) => roundNumber(x), get: (x) => roundNumber(x) }
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

topUpSchema.virtual('user', {
  ref: 'Users',
  localField: 'user_id',
  foreignField: '_id',
  justOne: true
});

const topupModel = model('s_topup', topUpSchema);
topupModel.createCollection();
export default topupModel;
