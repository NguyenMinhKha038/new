import { limitSchema, pageSchema, sortSchema } from '../commons/find.schema';
import { response200 } from '../commons/responses.schema';
import pathIDSchema from '../commons/path-id.schema';

export default {
  '/s_/admin-bank/admin': {
    post: {
      tags: ['admin-bank'],
      summary: 'create admin-bank',
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: [
                'bank_name',
                'bank_account',
                'bank_branch',
                'bank_owner_name',
                'image_path'
              ],
              properties: {
                bank_name: {
                  type: 'string'
                },
                bank_account: {
                  type: 'string'
                },
                bank_branch: {
                  type: 'string',
                  description: ''
                },
                bank_owner_name: {
                  type: 'string',
                  description: ''
                },
                image_path: {
                  type: 'string',
                  description: ''
                },
                priority: {
                  type: 'number',
                  description: 'Priority',
                  default: 0
                }
              }
            }
          }
        },
        required: true
      },
      responses: response200
    },
    put: {
      tags: ['admin-bank'],
      summary: 'update admin-bank',
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                bank_name: {
                  type: 'string'
                },
                bank_account: {
                  type: 'string'
                },
                bank_branch: {
                  type: 'string',
                  description: ''
                },
                bank_owner_name: {
                  type: 'string',
                  description: ''
                },
                image_path: {
                  type: 'string',
                  description: ''
                },
                priority: {
                  type: 'number',
                  description: 'Priority'
                },
                status: {
                  type: 'number',
                  enum: ['active', 'disabled']
                }
              }
            }
          }
        },
        required: true
      },
      responses: response200
    },
    get: {
      tags: ['admin-bank'],
      summary: '',
      parameters: [
        limitSchema,
        pageSchema,
        sortSchema,
        {
          name: 'bank_name',
          in: 'query',
          required: false,
          schema: {
            type: 'string'
          }
        },
        {
          name: 'bank_account',
          in: 'query',
          required: false,
          schema: {
            type: 'string'
          }
        },
        {
          name: 'bank_branch',
          in: 'query',
          required: false,
          schema: {
            type: 'string'
          }
        },
        {
          name: 'bank_owner_name',
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
  '/s_/admin-bank/admin/:id': {
    get: {
      tags: ['admin-bank'],
      summary: 'admin bank: get record by id',
      parameters: [pathIDSchema],
      responses: response200
    },
    delete: {
      tags: ['admin-bank'],
      summary: 'admin bank: delete record by id',
      parameters: [pathIDSchema],
      responses: response200
    }
  },
  '/s_/admin-bank/user': {
    get: {
      tags: ['admin-bank'],
      summary: 'user get records',
      parameters: [
        limitSchema,
        sortSchema,
        pageSchema,
        {
          name: 'bank_name',
          in: 'query',
          required: false,
          schema: {
            type: 'string'
          }
        },
        {
          name: 'bank_account',
          in: 'query',
          required: false,
          schema: {
            type: 'string'
          }
        },
        {
          name: 'bank_branch',
          in: 'query',
          required: false,
          schema: {
            type: 'string'
          }
        },
        {
          name: 'bank_owner_name',
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
  '/s_/admin-bank/user/:id': {
    get: {
      tags: ['admin-bank'],
      summary: 'user: get record by id',
      parameters: [pathIDSchema],
      responses: response200
    }
  }
};
