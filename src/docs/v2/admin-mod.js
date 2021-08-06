import { response200 } from '../commons/responses.schema';

export default {
  '/admin-mod/get-admins': {
    get: {
      tags: ['admin-mod'],
      summary: 'get all admins',
      responses: response200
    }
  }
};
