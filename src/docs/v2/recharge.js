import findSchema, { limitSchema, sortSchema, pageSchema } from '../commons/find.schema';
import { response200 } from '../commons/responses.schema';

export default {
  '/s_/recharge/user/': {
    get: {
      tags: ['recharge'],
      summary: 'get recharge',
      parameters: [
        limitSchema,
        sortSchema,
        pageSchema,
        {
          name: 'value',
          in: 'query',
          required: false,
          schema: {
            type: 'number'
          }
        },
        {
          name: 'status',
          in: 'query',
          required: false,
          description: 'success, canceled',
          schema: {
            type: 'string'
          }
        }
      ],
      responses: response200
    },
    post: {
      tags: ['recharge'],
      summary: 'recharge',
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['value'],
              properties: {
                value: {
                  type: 'number'
                }
              }
            }
          }
        },
        required: true
      },
      responses: response200
    }
  },
  '/s_/recharge/user/{id}': {
    get: {
      tags: ['recharge'],
      summary: 'get recharge by id',
      responses: response200
    }
  },
  '/s_/recharge/admin': {
    get: {
      tags: ['recharge'],
      summary: 'admin get  recharge',
      parameters: [
        limitSchema,
        pageSchema,
        sortSchema,
        {
          name: 'user_id',
          in: 'query',
          required: false,
          schema: {
            type: 'number'
          }
        },
        {
          name: 'value',
          in: 'query',
          required: false,
          schema: {
            type: 'number'
          }
        },
        {
          name: 'status',
          in: 'query',
          required: false,
          description: 'success, canceled',
          schema: {
            type: 'string'
          }
        }
      ],
      responses: response200
    }
  },
  '/s_/recharge/admin/{id}': {
    get: {
      tags: ['recharge'],
      summary: 'admin find recharge by id',
      responses: response200
    }
  }
};
