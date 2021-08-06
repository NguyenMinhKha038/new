import { limitSchema, sortSchema, pageSchema } from '../commons/find.schema';
import { response200 } from '../commons/responses.schema';
import pathIDSchema from '../commons/path-id.schema';

export default {
  '/user-sms/admin': {
    get: {
      tags: ['user-sms'],
      summary: 'admin get',
      parameters: [
        limitSchema,
        sortSchema,
        pageSchema,
        {
          name: 'phone',
          in: 'query',
          required: false,
          schema: {
            type: 'string'
          }
        }
      ],
      responses: response200
    }
  },
  '/user-sms/admin/:id': {
    get: {
      tags: ['user-sms'],
      summary: 'admin get by id',
      parameters: [pathIDSchema],
      responses: response200
    }
  }
};
