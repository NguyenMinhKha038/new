import { Schema, model } from 'mongoose';

const companyHistorySchema = new Schema(
  {
    company_id: {
      type: Schema.Types.ObjectId,
      ref: 's_company'
    },
    user_id: {
      type: Schema.Types.ObjectId,
      ref: 'Users'
    },
    type: {
      type: String,
      enum: [
        'deposit',
        'withdraw',
        'user_pay_order',
        'pay_service_fee',
        'pay_transport_fee',
        'refund_order',
        'pay_banner_fee',
        'cancel_order'
      ]
    },
    value: {
      type: Number,
      set: (v) => Math.abs(v),
      get: (v) => Math.abs(v)
    },
    new_balance: {
      type: Number
    },
    transaction_id: {
      type: Schema.Types.ObjectId,
      refPath: 'onModel'
    },
    onModel: {
      type: String
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

companyHistorySchema.virtual('user', {
  ref: 'Users',
  localField: 'user_id',
  foreignField: '_id',
  justOne: true
});

companyHistorySchema.virtual('company', {
  ref: 's_company',
  localField: 'company_id',
  foreignField: '_id',
  justOne: true
});

const companyHistoryModel = model('s_company_history', companyHistorySchema);
companyHistoryModel.createCollection();
export default companyHistoryModel;
