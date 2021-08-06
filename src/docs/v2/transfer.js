import { limitSchema, sortSchema, pageSchema } from '../commons/find.schema';
import { response200 } from '../commons/responses.schema';

export default {
  '/s_/transfer/user/': {
    get: {
      tags: ['transfer'],
      summary: 'user get transfer',
      parameters: [
        limitSchema,
        sortSchema,
        pageSchema,
        {
          name: 'receiver_id',
          in: 'query',
          required: false,
          schema: {
            type: 'string'
          }
        },
        {
          name: 'value',
          in: 'query',
          required: false,
          schema: {
            type: 'number'
          }
        }
      ],
      responses: {
        '200': {
          description: 'Status 200',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  sender_id: {
                    type: 'string'
                  },
                  receiver_id: {
                    type: 'string'
                  },
                  value: {
                    type: 'number'
                  },
                  sender_old_balance: {
                    type: 'number'
                  },
                  sender_new_balance: {
                    type: 'number'
                  },
                  receiver_old_balance: {
                    type: 'number'
                  },
                  receiver_new_balance: {
                    type: 'number'
                  },
                  status: {
                    type: 'string'
                  },
                  code: {
                    type: 'string'
                  }
                }
              }
            }
          }
        }
      }
    },
    post: {
      tags: ['transfer'],
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['PIN', 'receiver_phone', 'value'],
              properties: {
                receiver_phone: {
                  type: 'string'
                },
                value: {
                  type: 'number'
                },
                PIN: {
                  type: 'string'
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
  '/s_/transfer/user/:id': {
    get: {
      tags: ['transfer'],
      summary: 'user get transfer by id',
      responses: response200
    }
  },
  '/s_/transfer/admin': {
    get: {
      tags: ['transfer'],
      summary: 'admin get transfer',
      parameters: [
        limitSchema,
        sortSchema,
        pageSchema,
        {
          name: 'receiver_id',
          in: 'query',
          required: false,
          schema: {
            type: 'string'
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
          name: 'sender_id',
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
  '/s_/transfer/admin/:id': {
    get: {
      tags: ['transfer'],
      summary: 'admin get transfer by id',
      responses: response200
    }
  },
  '/s_/transfer/admin/statistic': {
    get: {
      tags: ['transfer'],
      summary: 'admin get statistic',
      parameters: [
        {
          name: 'receiver_id',
          in: 'query',
          required: false,
          schema: {
            type: 'string'
          }
        },
        {
          name: 'start_time',
          in: 'query',
          required: false,
          schema: {
            type: 'date'
          }
        },
        {
          name: 'end_time',
          in: 'query',
          required: false,
          schema: {
            type: 'date'
          }
        },
        {
          name: 'sender_id',
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
