import { response200 } from '../commons/responses.schema';
export default {
  '/s_/transaction-count/user': {
    get: {
      tags: ['transaction count'],
      description: 'transaction info',

      responses: response200
    }
  },
  '/s_/transaction-count/company': {
    get: {
      tags: ['transaction count'],
      description: 'transaction info',

      responses: response200
    }
  }
};
