import { response200 } from '../commons/responses.schema';

export default {
  '/s_/payment_code/user': {
    post: {
      tags: ['payment_code'],
      description: 'user create new payment_code',
      responses: response200
    }
  }
};
