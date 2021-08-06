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
  '/s_/mall-storing/{id}': {
    get: {
      summary: 'user get mall storing by id',
      tags: ['mall-storing'],
      parameters: [pathIDSchema, selectSchema],
      responses: response200
    }
  },
  '/s_/mall-storing/': {
    get: {
      summary: 'user get mall storings',
      tags: ['mall-storing'],
      parameters: [
        ...findSchema,
        withSchema(idSchema, { name: 'mall_id' }),
        withSchema(idSchema, { name: 'product_id' })
      ],
      responses: response200
    }
  },
  '/s_/mall-storing/admin/{id}': {
    get: {
      summary: 'admin get mall storing by id',
      tags: ['mall-storing'],
      parameters: [pathIDSchema, selectSchema],
      responses: response200
    }
  },
  '/s_/mall-storing/admin': {
    get: {
      summary: 'admin get mall storings',
      tags: ['mall-storing'],
      parameters: [
        ...findSchema,
        withSchema(idSchema, { name: 'product_id' }),
        withSchema(idSchema, { name: 'mall_id' }),
        withSchema(statusSchema, { 'schema.enum': ['active', 'inactive', 'disabled'] }),
        withSchema(booleanSchema, { name: 'is_active_mall' }),
        withSchema(booleanSchema, { name: 'is_active_product' }),
        withSchema(booleanSchema, { name: 'is_lucky' }),
        withSchema(booleanSchema, { name: 'is_limited_stock' })
      ],
      responses: response200
    }
  },
  '/s_/mall-storing/mall/search': {
    get: {
      summary: 'Mall staff search mall storing',
      tags: ['mall-storing'],
      parameters: [limitSchema, withSchema(textSchema, { name: 'query' })],
      responses: response200
    }
  },
  '/s_/mall-storing/mall/{id}': {
    get: {
      summary: 'Mall staff get mall storing by id',
      tags: ['mall-storing'],
      parameters: [pathIDSchema, selectSchema],
      responses: response200
    },
    delete: {
      summary: 'Mall staff delete mall storing by id',
      deprecated: true,
      tags: ['mall-storing'],
      parameters: [pathIDSchema],
      responses: response200
    }
  },
  '/s_/mall-storing/mall': {
    get: {
      summary: 'Mall staff get mall storings',
      tags: ['mall-storing'],
      parameters: [
        ...findSchema,
        withSchema(idSchema, { name: 'product_id' }),
        withSchema(statusSchema, { 'schema.enum': ['active', 'inactive'] }),
        withSchema(booleanSchema, { name: 'is_active_product' }),
        withSchema(booleanSchema, { name: 'is_lucky' }),
        withSchema(booleanSchema, { name: 'is_limited_stock' })
      ],
      responses: response200
    },
    put: {
      tags: ['mall-storing'],
      summary: 'Mall staff update info of mall storings',
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
    }
  },
  '/s_/mall-storing/mall/update-status': {
    put: {
      tags: ['mall-storing'],
      summary: 'Mall staff update status of mall storings',
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
