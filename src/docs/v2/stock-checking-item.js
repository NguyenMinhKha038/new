import findSchema, { idSchema, populateSchema, textSchema } from '../commons/find.schema';
import pathIDSchema from '../commons/path-id.schema';
import { response200 } from '../commons/responses.schema';
import withSchema from '../commons/with-schema';

export default {
  '/s_/stock-checking-item/company/{id}': {
    put: {
      tags: ['stock-checking-item'],
      summary:
        'update stock-checking-item, only stock checking in `custom` type can update product_storing_id || warehouse_storing_id depend on stock checking',
      parameters: [populateSchema],
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                status: {
                  type: 'string',
                  enum: ['pending', 'checked', 'disabled']
                },
                product_storing_id: {
                  type: 'string'
                },
                warehouse_storing_id: {
                  type: 'string'
                },
                model_id: {
                  type: 'string'
                },
                stock: {
                  type: 'number'
                },
                actual_stock: {
                  type: 'number'
                },
                good_condition: {
                  type: 'number'
                },
                medium_condition: {
                  type: 'number'
                },
                poor_condition: {
                  type: 'number'
                }
              }
            }
          }
        },
        responses: {
          ...response200,
          '404': {
            description: `
              productStoringNotFound,
              warehouseStoringNotFound
            `
          }
        }
      }
    },
    get: {
      tags: ['stock-checking-item'],
      summary: 'get by id',
      parameters: [pathIDSchema],
      responses: { ...response200, '404': { description: 'Not Found' } }
    }
  },
  '/s_/stock-checking-item/company': {
    post: {
      tags: ['stock-checking-item'],
      summary:
        'create new one, only available for stock-checking in custom type and have not completed yet',
      parameters: [populateSchema],
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                stock_checking_id: {
                  type: 'string'
                },
                warehouse_storing_id: {
                  type: 'string'
                },
                product_storing_id: {
                  type: 'string'
                },
                model_id: {
                  type: 'string'
                },
                stock: { type: 'number' },
                actual_stock: { type: 'number' },
                good_condition: { type: 'number' },
                medium_condition: { type: 'number' },
                poor_condition: { type: 'number' }
              }
            }
          }
        }
      }
    },
    get: {
      tags: ['stock-checking-item'],
      summary: 'get many',
      parameters: [
        ...findSchema,
        populateSchema,
        withSchema(textSchema, { name: 'status', 'schema.enum': ['checked', 'pending'] }),
        withSchema(idSchema, { name: 'stock_checking_id' }),
        withSchema(idSchema, { name: 'storing_id' }),
        withSchema(idSchema, { name: 'product_storing_id' }),
        withSchema(idSchema, { name: 'warehouse_storing_id' }),
        withSchema(idSchema, { name: 'product_id' })
      ]
    },
    put: {
      tags: ['stock-checking-item'],
      summary: 'update many stock-checking-item, maximum 15 item per request',
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  stock_checking_item_id: {
                    type: 'string'
                  },
                  stock_checking_id: {
                    type: 'string'
                  },
                  warehouse_storing_id: {
                    type: 'string'
                  },
                  product_storing_id: {
                    type: 'string'
                  },
                  model_id: {
                    type: 'string'
                  },
                  stock: { type: 'number' },
                  actual_stock: { type: 'number' },
                  good_condition: { type: 'number' },
                  medium_condition: { type: 'number' },
                  poor_condition: { type: 'number' }
                }
              }
            }
          }
        }
      },
      responses: response200
    }
  }
};
