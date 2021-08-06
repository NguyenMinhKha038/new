import { response200, response201 } from '../commons/responses.schema';
import pathIDSchema from '../commons/path-id.schema';
import findSchema, { selectSchema, limitSchema } from '../commons/find.schema';
export default {
  '/s_/product-attribute/admin': {
    post: {
      tags: ['product-attribute'],
      summary: 'create product attribute',
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['name', 'values', 'display_name'],
              properties: {
                name: {
                  type: 'string'
                },
                display_name: {
                  type: 'string'
                },
                values: {
                  type: 'array',
                  items: {
                    type: 'string'
                  }
                },
                allow_unlisted_value: {
                  type: 'boolean'
                }
              }
            }
          }
        }
      },
      responses: response201
    },
    get: {
      tags: ['product-attribute'],
      summary: 'get all product attribute',
      parameters: [...findSchema],
      responses: response200
    }
  },
  '/s_/product-attribute/admin/{id}': {
    get: {
      tags: ['product-attribute'],
      summary: 'get product attribute by id',
      parameters: [pathIDSchema],
      responses: response200
    },
    put: {
      tags: ['product-attribute'],
      summary: 'create product attribute',
      parameters: [pathIDSchema],
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['name', 'values'],
              properties: {
                name: {
                  type: 'string'
                },
                display_name: {
                  type: 'string'
                },
                values: {
                  type: 'array',
                  items: {
                    type: 'string'
                  }
                },
                allow_unlisted_value: {
                  type: 'boolean'
                }
              }
            }
          }
        }
      },
      responses: response201
    },
    delete: {
      tags: ['product-attribute'],
      summary: 'delete product attribute by id',
      parameters: [pathIDSchema],
      responses: response200
    }
  }
};
