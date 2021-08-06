import { response200, response201 } from '../commons/responses.schema';

export default {
  '/s_/province': {
    get: {
      summary: 'province',
      tags: ['province'],
      parameters: [
        {
          name: 'type',
          in: 'query',
          required: true,
          schema: {
            type: 'number',
            enum: [1, 2, 3]
          }
        },
        {
          name: 'parent_code',
          in: 'query',
          required: false,
          schema: {
            type: 'string'
          }
        }
      ],
      responses: response200
    }
  }
};
