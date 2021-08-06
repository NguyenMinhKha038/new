import { Schema, model } from 'mongoose';

const companyBank = new Schema(
  {
    company_id: {
      type: Schema.Types.ObjectId,
      ref: 's_company'
    },
    user_id: {
      type: Schema.Types.ObjectId,
      ref: 'Users'
    },
    name: {
      type: String,
      required: true
    },
    branch: {
      type: String,
      required: true
    },
    account_name: {
      type: String,
      required: true,
      uppercase: true
    },
    account_number: {
      type: String,
      required: true
    },
    is_default: {
      type: Boolean,
      default: false
    },
    province_id: {
      type: String
    },
    district_id: {
      type: String
    },
    branch_id: {
      type: String
    }
  },
  {
    timestamps: true
  }
);

companyBank.pre('save', function () {
  if (this && this.isNew) {
    this.banks[0].is_default = true;
  }
});

export default model('s_company_banks', companyBank);
