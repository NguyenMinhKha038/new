import { Schema, model } from 'mongoose';

const billingSchema = new Schema(
  {
    user_id: { type: Schema.Types.ObjectId, required: true, index: true },
    total: { type: Number },
    external_transaction_id: String,
    code: String,
    payment_method: String,
    bill_payment: [
      {
        billNumber: String,
        period: String,
        amount: Number,
        billType: String,
        otherInfo: String
      }
    ],
    type: String,
    publisher: String,
    publisher_name: String,
    customer_code: String,
    payment_fee: Number,
    original_total: Number,
    customer_data: {
      customerCode: String,
      customerName: String,
      customerAddress: String,
      customerOtherInfo: String
    }
  },
  { timestamps: true }
);

const billModel = model('s_bill', billingSchema);
billModel.createCollection();
export default billModel;
