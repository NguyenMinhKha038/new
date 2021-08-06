import mongoose from 'mongoose';
import { supportReasonCategories } from './support-reason.config';

const supportReasonSchema = new mongoose.Schema(
  {
    category: {
      type: String,
      enum: supportReasonCategories
    },
    reason_list: {
      type: [String]
    }
  },
  {
    timestamps: true
  }
);

export default mongoose.model('support_reasons', supportReasonSchema);
