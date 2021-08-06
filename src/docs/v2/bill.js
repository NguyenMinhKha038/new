import findSchema from '../commons/find.schema';
import pathIDSchema from '../commons/path-id.schema';
import { response200 } from '../commons/responses.schema';

export default {
  's_/bill/user/query': {
    get: {
      tags: ['bill'],
      description: 'user query bill to pay',
      parameters: [
        {
          name: 'publisher',
          in: 'query',
          required: true,
          schema: {
            type: 'number'
          }
        },
        {
          name: 'type',
          in: 'query',
          required: true,
          schema: {
            type: 'string'
          }
        },
        {
          name: 'customer_code',
          in: 'query',
          required: true,
          schema: {
            type: 'string'
          }
        }
      ],
      responses: response200
    }
  },
  's_/bill/user/pay': {
    post: {
      tags: ['bill'],
      description: 'user pay bills',
      requestBody: {
        content: {
          'application/json': {
            schema: {
              properties: {
                publisher: {
                  type: 'string',
                  required: 'true'
                },
                type: {
                  type: 'string',
                  required: 'true'
                },
                customer_code: {
                  type: 'string',
                  required: 'true'
                }
              }
            }
          }
        }
      },
      responses: response200
    }
  },
  's_/bill/user': {
    get: {
      tags: ['bill'],
      description: 'user get bills',
      parameters: [...findSchema],
      responses: response200
    }
  },
  's_/bill/user/{id}': {
    get: {
      tags: ['bill'],
      description: 'user get bills',
      parameters: [pathIDSchema],
      responses: response200
    }
  },
  's_/bill/admin': {
    get: {
      tags: ['bill'],
      description: 'admin get bills',
      parameters: [
        ...findSchema,
        {
          name: 'user_id',
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
  's_/bill/admin/{id}': {
    get: {
      tags: ['bill'],
      description: 'user get bills',
      parameters: [pathIDSchema],
      responses: response200
    }
  }
};
