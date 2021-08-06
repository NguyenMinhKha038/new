import { response200, response201 } from '../commons/responses.schema';
import { limitSchema, pageSchema, sortSchema, selectSchema } from '../commons/find.schema';
import { pathIDSchema } from '../commons/path-id.schema';

export default {
  '/s_/global-promotion-registration/admin': {
    get: {
      tags: ['global-promotion-registration'],
      summary: 'Get all admin promotion registration',
      parameters: [
        limitSchema,
        pageSchema,
        sortSchema,
        selectSchema,
        {
          name: 'status',
          in: 'query',
          required: false,
          schema: {
            type: 'string',
            enum: ['active', 'disabled']
          }
        },
        {
          name: 'company_id',
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
  '/s_/global-promotion-registration/admin/{id}': {
    get: {
      tags: ['global-promotion-registration'],
      summary: 'Get admin promotion registration by id',
      parameters: [pathIDSchema],
      responses: response200
    }
  },
  '/s_/global-promotion-registration/company/register': {
    post: {
      tags: ['global-promotion-registration'],
      summary: 'Register admin promotion registration',
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['id', 'product_storing_ids'],
              properties: {
                id: {
                  type: 'string',
                  description: 'admin promotion id'
                },
                product_storing_ids: {
                  type: 'array',
                  description: 'product storings to register',
                  items: {
                    type: 'string'
                  }
                }
              }
            }
          }
        }
      },
      responses: response201
    }
  },
  '/s_/global-promotion-registration/company/{id}': {
    put: {
      tags: ['global-promotion-registration'],
      summary: 'Update admin promotion registration by id',
      parameters: [pathIDSchema],
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: [],
              properties: {
                product_storing_ids: {
                  type: 'array',
                  items: {
                    type: 'string'
                  }
                },
                status: {
                  type: 'string',
                  enum: ['active', 'disabled']
                }
              }
            }
          }
        }
      },
      responses: response200
    },
    get: {
      tags: ['global-promotion-registration'],
      summary: 'Company get own registration',
      parameters: [pathIDSchema],
      responses: response200
    }
  },
  '/s_/global-promotion-registration/company': {
    get: {
      tags: ['global-promotion-registration'],
      summary: 'Get my admin promotion registrations',
      parameters: [
        limitSchema,
        pageSchema,
        sortSchema,
        {
          name: 'status',
          in: 'query',
          required: false,
          schema: {
            type: 'string',
            enum: ['active', 'disabled']
          }
        }
      ],
      responses: response200
    }
  }
};
