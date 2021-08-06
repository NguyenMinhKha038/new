import { Schema, model } from 'mongoose';

const userBanks = new Schema(
  {
    user_id: {
      type: Schema.Types.ObjectId,
      ref: 'Users',
      required: true
      // unique: true
    },
    // banks: {
    //   type: [bankSchema],
    //   default: []
    // }
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
    }
  },
  {
    timestamps: true
  }
);

export default model('user_banks', userBanks);
