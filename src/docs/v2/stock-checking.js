import { omit } from 'lodash';
import findSchema, { idSchema, populateSchema, textSchema } from '../commons/find.schema';
import pathIDSchema from '../commons/path-id.schema';
import { response200, response201 } from '../commons/responses.schema';
import withSchema from '../commons/with-schema';

const createStockCheckingSchema = {
  staff_id: {
    type: 'string'
  },
  store_id: {
    type: 'string'
  },
  warehouse_id: {
    type: 'string'
  },
  checking_place: {
    type: 'string',
    enum: ['store', 'warehouse']
  },
  type: {
    type: 'string',
    enum: ['all', 'category', 'custom']
  },
  category_id: {
    type: 'string'
  }
};

export default {
  '/s_/stock-checking/company': {
    post: {
      tags: ['stock-checking'],
      summary: 'Create checking store||warehouse request',
      parameters: [populateSchema],
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: createStockCheckingSchema
            }
          }
        }
      },
      responses: {
        ...response201,
        '404': {
          description: `
            staffNotExists,
            categoryNotExist,
            storeNotExist,
            warehouseNotExist
          `
        }
      }
    },
    get: {
      tags: ['stock-checking'],
      summary: 'Get stock checkings',
      parameters: [
        ...findSchema,
        populateSchema,
        withSchema(idSchema, {
          name: 'store_id',
          description: 'required when `checking_place` is store '
        }),
        withSchema(idSchema, {
          name: 'warehouse_id',
          description: 'required when `checking_place` is warehouse '
        }),
        withSchema(idSchema, { name: 'staff_id', description: 'id of assigned staff' }),
        ,
        withSchema(textSchema, {
          name: 'status',
          'schema.enum': ['handling', 'pending', 'completed']
        }),
        withSchema(textSchema, { name: 'created_from' }),
        withSchema(textSchema, { name: 'created_to' }),
        withSchema(textSchema, { name: 'checking_date_from' }),
        withSchema(textSchema, { name: 'checking_date_to' }),
        withSchema(textSchema, { name: 'completed_date_from' }),
        withSchema(textSchema, { name: 'completed_date_to' })
      ],
      responses: {
        ...response200
      }
    }
  },
  '/s_/stock-checking/company/{id}': {
    put: {
      tags: ['stock-checking'],
      summary: 'assign a staff, update status',
      parameters: [pathIDSchema, populateSchema],
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                status: {
                  type: 'string',
                  enum: ['handling', 'completed', 'disabled']
                },
                staff_id: {
                  type: 'string'
                }
              }
            }
          }
        }
      }
    },
    get: {
      tags: ['stock-checking'],
      summary: 'get by id',
      parameters: [pathIDSchema]
    },
    responses: {
      response200,
      '404': {
        description: 'Not Found'
      }
    }
  }
};
