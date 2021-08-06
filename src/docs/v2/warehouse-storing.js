import findSchema, {
  limitSchema,
  idSchema,
  selectSchema,
  statusSchema,
  booleanSchema,
  numberSchema,
  textSchema
} from '../commons/find.schema';
import pathIDSchema from '../commons/path-id.schema';
import withSchema from '../commons/with-schema';
import { response200 } from '../commons/responses.schema';

export default {
  '/s_/warehouse-storing/{id}': {
    get: {
      deprecated: true,
      summary: 'user get warehouse storing by id',
      description: 'user get warehouse storing by id',
      tags: ['warehouse-storing'],
      parameters: [pathIDSchema, selectSchema],
      responses: response200
    }
  },
  '/s_/warehouse-storing/': {
    get: {
      deprecated: true,
      summary: 'user get warehouse storings',
      description: 'user get warehouse storings',
      tags: ['warehouse-storing'],
      parameters: [
        ...findSchema,
        withSchema(idSchema, { name: 'company_id' }),
        withSchema(idSchema, { name: 'product_id' })
      ],
      responses: response200
    }
  },
  '/s_/warehouse-storing/admin/{id}': {
    get: {
      summary: 'admin get warehouse storing by id',
      tags: ['warehouse-storing'],
      parameters: [pathIDSchema, selectSchema],
      responses: response200
    }
  },
  '/s_/warehouse-storing/admin': {
    get: {
      summary: 'admin get warehouse storings',
      tags: ['warehouse-storing'],
      parameters: [
        ...findSchema,
        withSchema(idSchema, { name: '_id' }),
        withSchema(idSchema, { name: 'model_list._id' }),
        withSchema(idSchema, { name: 'product_id' }),
        withSchema(idSchema, { name: 'company_id' }),
        withSchema(statusSchema, { 'schema.enum': ['active', 'inactive', 'disabled'] }),
        withSchema(booleanSchema, { name: 'is_active_product' }),
        withSchema(booleanSchema, { name: 'is_lucky' }),
        withSchema(booleanSchema, { name: 'is_limited_stock' }),
        withSchema(booleanSchema, { name: 'transportable' })
      ],
      responses: response200
    }
  },
  '/s_/warehouse-storing/company/search': {
    get: {
      deprecated: true,
      summary: 'company search warehouse storing',
      description: 'company search warehouse storing',
      tags: ['warehouse-storing'],
      parameters: [limitSchema, withSchema(textSchema, { name: 'query' })],
      responses: response200
    }
  },
  '/s_/warehouse-storing/company/{id}': {
    get: {
      summary: 'company get warehouse storing by id',
      tags: ['warehouse-storing'],
      parameters: [pathIDSchema, selectSchema],
      responses: response200
    },
    put: {
      tags: ['warehouse-storing'],
      summary: 'company update info of warehouse storing',
      parameters: [pathIDSchema],
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                price: withSchema(numberSchema, { name: 'price' }),
                refund_rate: withSchema(numberSchema, { name: 'refund_rate' }),
                discount_rate: withSchema(numberSchema, { name: 'discount_rate' }),
                discount: withSchema(numberSchema, { name: 'discount' }),
                promotion_refund_rate: withSchema(numberSchema, { name: 'promotion_refund_rate' }),
                promotion_discount_rate: withSchema(numberSchema, {
                  name: 'promotion_discount_rate'
                }),
                global_promotion_refund_rate: withSchema(numberSchema, {
                  name: 'global_promotion_refund_rate'
                }),
                global_promotion_discount_rate: withSchema(numberSchema, {
                  name: 'global_promotion_discount_rate'
                }),
                total_refund_rate: withSchema(numberSchema, { name: 'total_refund_rate' }),
                is_limited_stock: withSchema(booleanSchema, { name: 'is_limited_stock' }),
                is_lucky: withSchema(booleanSchema, { name: 'is_lucky' })
              },
              example: {
                price: 300000,
                is_limited_stock: true
              }
            }
          }
        }
      },
      responses: response200
    },
    delete: {
      summary: 'company delete warehouse storing by id',
      deprecated: true,
      tags: ['warehouse-storing'],
      parameters: [pathIDSchema],
      responses: response200
    }
  },
  '/s_/warehouse-storing/company': {
    get: {
      summary: 'company get warehouse storings',
      description: 'company get warehouse storings',
      tags: ['warehouse-storing'],
      parameters: [
        ...findSchema,
        withSchema(idSchema, { name: '_id' }),
        withSchema(idSchema, { name: 'model_list._id' }),
        withSchema(idSchema, { name: 'product_id' }),
        withSchema(statusSchema, { 'schema.enum': ['active', 'inactive'] }),
        withSchema(booleanSchema, { name: 'is_active_product' }),
        withSchema(booleanSchema, { name: 'is_lucky' }),
        withSchema(booleanSchema, { name: 'is_limited_stock' }),
        withSchema(booleanSchema, { name: 'transportable' })
      ],
      responses: response200
    }
  },
  '/s_/warehouse-storing/company/update-status': {
    put: {
      tags: ['warehouse-storing'],
      summary: 'company update status of warehouse storings',
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                product_storings: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: {
                        type: 'string',
                        required: true
                      },
                      status: {
                        type: 'string',
                        enum: ['active', 'inactive'],
                        default: 'active'
                      }
                    }
                  }
                }
              },
              example: {
                product_storings: [
                  {
                    id: '5f0d35ae6c7576412cf80ad6',
                    status: 'active'
                  },
                  {
                    id: '5f0d35ae6c7576412cf80ad7',
                    status: 'active'
                  },
                  {
                    id: '5f0d35ae6c7576412cf80ad8',
                    status: 'inactive'
                  }
                ]
              }
            }
          }
        }
      },
      responses: response200
    }
  }
};
