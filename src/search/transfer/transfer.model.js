import { Schema, model } from 'mongoose';
import { getDate } from '../../commons/utils';
import statisticService from '../statistic/statistic.service';

const transferSchema = new Schema(
  {
    sender_id: {
      type: Schema.Types.ObjectId,
      ref: 'Users',
      required: true
    },
    receiver_id: {
      type: Schema.Types.ObjectId,
      ref: 'Users',
      required: true
    },
    value: {
      type: Number,
      required: true
    },
    message: {
      type: String
    },
    sender_old_balance: {
      type: Number,
      required: true
      // select: false
    },
    sender_new_balance: {
      type: Number,
      required: true
      // select: false
    },
    receiver_old_balance: {
      type: Number,
      required: true
      // select: false
    },
    receiver_new_balance: {
      type: Number,
      required: true
      // select: false
    },
    status: {
      type: String,
      enum: ['pending', 'success', 'canceled'],
      default: 'pending'
    },
    code: {
      type: String
      // unique: true
    },
    date: {
      type: Date,
      default: getDate
    }
  },
  {
    timestamps: true
  }
);

transferSchema.pre('save', function () {
  if (this.isNew) {
    statisticService.update({ total_transfer: 1 });
  }
});

export default model('s_transfers', transferSchema);
