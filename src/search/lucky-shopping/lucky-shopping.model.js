import moment from 'moment';
import { model, Schema } from 'mongoose';

const winnerSchema = new Schema(
  {
    winner_id: Schema.Types.ObjectId,
    winner_name: {
      type: String,
      get: maskName
    },
    winner_phone_number: { type: String, get: maskPhoneNumber },
    order_id: Schema.Types.ObjectId
  },
  { toJSON: { getters: true } }
);

const luckyShoppingSchema = new Schema({
  date: { type: Date, default: moment.utc().startOf('d').toDate },
  products: [
    {
      product_id: Schema.Types.ObjectId,
      winners: [winnerSchema],
      number_assignees: { type: Number, default: 0 },
      sold: { type: Number, default: 0 },
      number_prizes: { type: Number, default: 1 }
    }
  ],
  is_handled: Boolean
});

luckyShoppingSchema.virtual('products.winner', {
  ref: 'Users',
  localField: 'products.winner_id',
  foreignField: '_id',
  justOne: true
});

luckyShoppingSchema.virtual('products.product', {
  ref: 's_product',
  localField: 'products.product_id',
  foreignField: '_id',
  justOne: true
});

const luckyShoppingModel = model('s_lucky_shopping', luckyShoppingSchema);
export default luckyShoppingModel;

/**
 *
 *
 * @param {string} str
 * @returns {string}
 */
function maskName(str) {
  const strArray = str.split(' ');
  const maskedArray = strArray.map((w, i) => {
    if (i !== strArray.length - 1) {
      return w.replace(/./g, '*');
    }
    return w;
  });
  return maskedArray.join(' ');
}
/**
 *
 *
 * @param {string} str
 * @returns {string}
 */
function maskPhoneNumber(str) {
  return str.replace(/^.{7}/, '*******');
}
