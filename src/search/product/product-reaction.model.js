import { Schema, model } from 'mongoose';

const productReactionSchema = new Schema({
  user_id: {
    type: Schema.Types.ObjectId,
    ref: 'Users'
  },
  user_name: {
    type: String
  },
  product_id: {
    type: Schema.Types.ObjectId,
    ref: 's_product'
  },
  favorite: {
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
  },
  can_comment: {
    type: Boolean,
    default: false
  }
});

const productReactionModel = model('s_product_reaction', productReactionSchema);
export default productReactionModel;
