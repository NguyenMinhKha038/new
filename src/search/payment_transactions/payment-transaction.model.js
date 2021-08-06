import { model, Schema } from 'mongoose';

const paymentTransactionSchema = new Schema(
  {
    order_id: { type: Schema.Types.ObjectId, ref: 's_order', required: true },
    user_id: { type: Schema.Types.ObjectId, ref: 's_user', required: true },
    company_id: { type: Schema.Types.ObjectId, ref: 's_company', required: true },
    store_id: { type: Schema.Types.ObjectId, ref: 's_store', required: true },
    total_refund: { type: Number, min: 0 },
    commission: { type: Number, min: 0 },
    total: { type: Number, min: 0 },
    is_confirmed: { type: Boolean, default: false },
    s_prepaid: { type: Number },
    bonus_available: { type: Number }
  },
  { timestamps: true, collection: 's_payment_transactions' }
);

paymentTransactionSchema.virtual('refund').get(function () {
  return this.total_refund - this.commission;
});

const paymentTransactionModel = model('s_payment_transaction', paymentTransactionSchema);
export default paymentTransactionModel;
