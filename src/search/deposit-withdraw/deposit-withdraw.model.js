import { Schema, model } from 'mongoose';
import config from './config';

const transactionSchema = new Schema(
  {
    user_id: {
      type: Schema.Types.ObjectId,
      ref: 'Users',
      required: true
    },
    company_id: {
      type: Schema.Types.ObjectId,
      ref: 's_company'
    },
    cashier_id: {
      type: Schema.Types.ObjectId,
      ref: 'admins'
    },
    type: {
      type: String,
      enum: config.TRANSACTION_TYPE,
      required: true
    },
    value: {
      type: Number,
      required: true
    },
    fee: {
      type: Number,
      default: 0
    },
    refund: {
      type: Number,
      default: 0
    },
    // full_name: {
    //   type: String
    //   // required: true
    // },
    // bank_account_number: {
    //   type: String
    //   // required: true
    // },
    // bank: {
    //   type: String
    //   // required: true
    // },
    // bank_branch: {
    //   type: String
    //   // required: true
    // },
    old_balance: {
      type: Number,
      required: true
    },
    new_balance: {
      type: Number,
      required: true
    },
    status: {
      type: String,
      required: true,
      enum: config.STATUS,
      default: 'pending'
    },
    payment_type: {
      type: String,
      enum: config.PAYMENT_TYPE,
      default: 'manual'
    },
    code: {
      type: String,
      unique: true
    },
    sms_message: {
      type: String,
      default: ''
    },
    bill_image: {
      type: String
    },
    confirm_at: {
      type: Date
    },
    //VPN
    vnp_BankTranNo: { type: String },
    vnp_CardType: { type: String },
    vpn_PayDate: { type: String },
    vpn_TransactionNo: { type: Number },
    vpn_TxnRef: { type: String },
    user_bank_id: {
      type: Schema.Types.ObjectId,
      ref: 'user_banks'
    },
    company_bank_id: {
      type: Schema.Types.ObjectId,
      ref: 's_company_banks'
    },
    admin_bank_id: {
      type: Schema.Types.ObjectId,
      ref: 'admin_banks'
    }
  },
  {
    timestamps: true
  }
);

export default model('s_deposit_withdraw', transactionSchema);
