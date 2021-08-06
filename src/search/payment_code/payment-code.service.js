import paymentCodeModel from './payment-code.model';

export default {
  create(user_id) {
    return paymentCodeModel.create({ user_id });
  },
  get(code) {
    return paymentCodeModel.findOne({ code }, null, { sort: '-createdAt' });
  }
};
