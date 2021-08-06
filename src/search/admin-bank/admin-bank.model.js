import { Schema, model } from 'mongoose';

const adminBankSchema = new Schema(
  {
    bank_name: {
      type: String,
      required: true
    },
    bank_account: {
      type: String,
      required: true
    },
    bank_branch: {
      type: String,
      required: true
    },
    bank_owner_name: {
      type: String,
      required: true
    },
    image_path: {
      type: String
    },
    priority: {
      type: Number,
      default: 0
    },
    status: {
      type: String,
      enum: ['active', 'disabled', 'updating'],
      default: 'active'
    }
  },
  {
    timestamps: true
  }
);

export default model('admin_banks', adminBankSchema);
