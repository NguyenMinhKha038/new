import { Schema, model } from 'mongoose';

const companyReactionSchema = new Schema({
  user_id: {
    type: Schema.Types.ObjectId,
    ref: 'Users'
  },
  user_name: {
    type: String
  },
  company_id: {
    type: Schema.Types.ObjectId,
    ref: 's_company',
    index: true
  },
  can_rate: {
    type: Boolean,
    default: false
  },
  rate: {
    type: Boolean,
    default: false
  },
  rate_value: {
    type: Number,
    min: 1,
    max: 5
  },
  rate_message: {
    type: String
  },
  follow: {
    type: Boolean,
    default: false
  },
  like: {
    type: Boolean,
    default: false
  },
  share: {
    type: Boolean,
    default: false
  },
  shares_count: {
    type: Number,
    default: 0
  },
  view: {
    type: Boolean,
    default: false
  },
  views_count: {
    type: Number,
    default: 0
  },
  ip: {
    type: String
  },
  last_view: {
    type: Date
  }
});

companyReactionSchema.index({ company_id: 1, user_id: 1 });

const companyReactionModel = model('s_company_reaction', companyReactionSchema);
export default companyReactionModel;
