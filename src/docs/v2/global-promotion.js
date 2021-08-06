import { response201, response200 } from '../commons/responses.schema';
import { pathIDSchema } from '../commons/path-id.schema';
import findSchema, {
  limitSchema,
  pageSchema,
  sortSchema,
  selectSchema
} from '../commons/find.schema';

export default {
  '/s_/global-promotion/admin': {
    get: {
      tags: ['global-promotion'],
      summary: 'Get all admin promotions',
      parameters: [
        pageSchema,
        limitSchema,
        sortSchema,
        selectSchema,
        {
          name: 'type',
          in: 'query',
          required: false,
          schema: {
            type: 'string',
            enum: ['product']
          }
        },
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
    },
    post: {
      tags: ['global-promotion'],
      summary: 'Create admin promotion',
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: [
                'value_type',
                'type',
                'value',
                'register_at',
                'start_at',
                'expire_at',
                'is_limit_company',
                'max_company',
                'categories',
                'max_discount',
                'min_order_value',
                'is_all_categories',
                'refund',
                'name',
                'description'
              ],
              properties: {
                name: {
                  type: 'string'
                },
                description: {
                  type: 'string'
                },
                value_type: {
                  type: 'string',
                  enum: ['money', 'percent']
                },
                value: {
                  type: 'number',
                  description: 'between 0-1'
                },
                register_at: {
                  type: 'string',
                  format: 'date',
                  description: 'iso date string'
                },
                start_at: {
                  type: 'string',
                  format: 'date',
                  description: 'iso date string'
                },
                expire_at: {
                  type: 'string',
                  format: 'date',
                  description: 'iso date string'
                },
                categories: {
                  type: 'array',
                  items: {
                    type: 'string'
                  },
                  description: 'required when is_all_categories is false'
                },
                max_discount: {
                  type: 'number'
                },
                min_order_value: {
                  type: 'number'
                },
                type: {
                  type: 'string',
                  enum: ['product', 'transport']
                },
                is_all_categories: {
                  type: 'boolean'
                },
                is_limit_company: {
                  type: 'boolean'
                },
                max_company: {
                  type: 'number'
                },
                image: {
                  type: 'string'
                },
                refund: {
                  type: 'number',
                  description: 'between 0-1'
                }
              }
            }
          }
        },
        required: true
      },
      responses: response201
    }
  },
  '/s_/global-promotion/admin/{id}': {
    get: {
      tags: ['global-promotion'],
      summary: 'Get admin promotion by id',
      parameters: [pathIDSchema],
      responses: response200
    },
    put: {
      tags: ['global-promotion'],
      summary: 'Update admin promotion by id',
      parameters: [pathIDSchema],
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: [
                'value_type',
                'value',
                'is_limit_company',
                'max_company',
                'categories',
                'is_all_categories'
              ],
              properties: {
                name: {
                  type: 'string'
                },
                description: {
                  type: 'string'
                },
                value_type: {
                  type: 'string',
                  enum: ['money', 'percent']
                },
                value: {
                  type: 'number',
                  description: 'between 0-1'
                },
                register_at: {
                  type: 'string',
                  format: 'date',
                  description: 'iso date string'
                },
                start_at: {
                  type: 'string',
                  format: 'date',
                  description: 'iso date string'
                },
                expire_at: {
                  type: 'string',
                  format: 'date',
                  description: 'iso date string'
                },
                categories: {
                  type: 'array',
                  items: {
                    type: 'string'
                  },
                  description:
                    'required when is_all_categories is false, empty when is_all_categories is true'
                },
                max_discount: {
                  type: 'number'
                },
                min_order_value: {
                  type: 'number',
                  description: 'minimum order value to apply admin promotion'
                },
                type: {
                  type: 'string',
                  enum: ['product', 'transport']
                },
                is_all_categories: {
                  type: 'boolean'
                },
                is_limit_company: {
                  type: 'boolean'
                },
                max_company: {
                  type: 'number',
                  description:
                    'greater than 0 when is_limit_company is true, 0 when is_limit_company is false'
                },
                image: {
                  type: 'string'
                },
                refund: {
                  type: 'number',
                  description: 'between 0-1'
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
    }
  },
  '/s_/global-promotion/admin/search': {
    get: {
      tags: ['global-promotion'],
      summary: 'Search admin promotion',
      parameters: [
        limitSchema,
        pageSchema,
        {
          name: 'name',
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
  '/s_/global-promotion/company/{id}': {
    get: {
      tags: ['global-promotion'],
      summary: 'Company get specify active admin promotion',
      parameters: [pathIDSchema],
      responses: response200
    }
  },
  '/s_/global-promotion/company/running': {
    get: {
      tags: ['global-promotion'],
      summary: 'Get running admin promotions',
      parameters: [limitSchema, pageSchema, sortSchema, selectSchema],
      responses: response200
    }
  },
  '/s_/global-promotion/company/suitable': {
    get: {
      tags: ['global-promotion'],
      summary: 'Get suitable admin promotion',
      parameters: [limitSchema, pageSchema, sortSchema, selectSchema],
      responses: response200
    }
  },
  '/s_/global-promotion/company/search': {
    get: {
      tags: ['global-promotion'],
      summary: 'Search admin promotion',
      parameters: [
        limitSchema,
        pageSchema,
        {
          name: 'name',
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
