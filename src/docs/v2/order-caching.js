import findSchema, {
  selectSchema,
  limitSchema,
  sortSchema,
  pageSchema,
  textSchema,
  populateSchema,
  booleanSchema,
  isoDateSchema,
  idSchema
} from '../commons/find.schema';
import { response200, response201 } from '../commons/responses.schema';
import pathIDSchema from '../commons/path-id.schema';
import withSchema from '../commons/with-schema';

export default {
  '/s_/order-caching/user/id/{id}': {
    get: {
      tags: ['order-caching'],
      summary: 'user get order-caching by id',
      description: 'user get order-caching by id',
      parameters: [pathIDSchema, selectSchema, populateSchema],
      responses: response200
    }
  },
  '/s_/order-caching/user/code/{code}': {
    get: {
      tags: ['order-caching'],
      summary: 'user get order-caching by code',
      description: 'user get order-caching by code',
      parameters: [
        withSchema(textSchema, { name: 'code', required: true }),
        selectSchema,
        populateSchema
      ],
      responses: response200
    }
  },
  '/s_/order-caching/user/refresh/{id}': {
    get: {
      tags: ['order-caching'],
      summary: 'user refresh order caching by id',
      description: 'user refresh order caching by id',
      parameters: [pathIDSchema, populateSchema],
      responses: response200
    }
  },

  '/s_/order-caching/user/offline/create': {
    post: {
      tags: ['order-caching'],
      summary: 'user create order-caching',
      description: 'user create order-caching',
      parameters: [populateSchema],
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['code'],
              properties: {
                store_id: { type: 'string', required: true },
                products: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      product_storing_id: { type: 'string', required: true },
                      quantity: { type: 'number' },
                      options: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            type_option_id: {
                              type: 'string'
                            },
                            option_id: {
                              type: 'string'
                            }
                          }
                        }
                      },
                      model_id: {
                        type: 'string'
                      },
                      accompanied_products: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            product_storing: {
                              type: 'string'
                            },
                            quantity: {
                              type: 'number'
                            }
                          }
                        }
                      },
                      type: {
                        type: 'string'
                      }
                    },
                    min: 1,
                    example: {
                      product_storing_id: '600817044642fcc12ab5dacd',
                      quantity: 2,
                      options: [
                        {
                          type_option_id: '6062e95fcf233f83ee720246',
                          option_id: '6062e95fcf233f83ee720248'
                        }
                      ],
                      model_id: '609ca203a900e9e7a5339136',
                      accompanied_products: [
                        {
                          product_storing_id: '5e7494bf6bd99e6a93fb2c03',
                          quantity: 3
                        }
                      ],
                      type: 'wholesale'
                    }
                  }
                },
                note: { type: 'string' },
                position: { type: 'string' }
              }
            }
          }
        }
      },
      responses: response201
    }
  },
  '/s_/order-caching/user/offline/{id}': {
    put: {
      tags: ['order-caching'],
      summary: 'user update order-caching by id',
      description: 'user update order-caching by id',
      parameters: [pathIDSchema, populateSchema],
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['code'],
              properties: {
                status: {
                  type: 'string',
                  enum: ['user_canceled']
                },
                products: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      product_storing_id: { type: 'string', required: true },
                      quantity: { type: 'number' },
                      options: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            type_option_id: {
                              type: 'string'
                            },
                            option_id: {
                              type: 'string'
                            }
                          }
                        }
                      },
                      model_id: {
                        type: 'string'
                      },
                      accompanied_products: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            product_storing: {
                              type: 'string'
                            },
                            quantity: {
                              type: 'number'
                            }
                          }
                        }
                      },
                      type: {
                        type: 'string'
                      }
                    },
                    min: 1,
                    example: {
                      product_storing_id: '600817044642fcc12ab5dacd',
                      quantity: 2,
                      options: [
                        {
                          type_option_id: '6062e95fcf233f83ee720246',
                          option_id: '6062e95fcf233f83ee720248'
                        }
                      ],
                      model_id: '609ca203a900e9e7a5339136',
                      accompanied_products: [
                        {
                          product_storing_id: '5e7494bf6bd99e6a93fb2c03',
                          quantity: 3
                        }
                      ],
                      type: 'wholesale'
                    }
                  }
                },

                note: { type: 'string' },
                position: { type: 'string' }
              }
            }
          }
        }
      },
      responses: response200
    }
  },
  '/s_/order-caching/company/id/{id}': {
    get: {
      tags: ['order-caching'],
      summary: 'company get order-caching by id',
      description: 'company get order-caching by id',
      parameters: [pathIDSchema, selectSchema, populateSchema],
      responses: response200
    }
  },
  '/s_/order-caching/company/code/{code}': {
    get: {
      tags: ['order-caching'],
      summary: 'company get order-caching by code',
      description: 'company get order-caching by code',
      parameters: [
        withSchema(textSchema, { name: 'code', required: true }),
        selectSchema,
        populateSchema
      ],
      responses: response200
    }
  },
  '/s_/order-caching/company/refresh/{id}': {
    get: {
      tags: ['order-caching'],
      summary: 'company refresh order caching by id',
      description: 'company refresh order caching by id',
      parameters: [pathIDSchema, populateSchema],
      responses: response200
    }
  },
  '/s_/order-caching/company': {
    get: {
      tags: ['order-caching'],
      summary: 'company get many order cachings',
      description: 'company get many order cachings',
      parameters: [
        ...findSchema,
        populateSchema,
        withSchema(idSchema, { name: 'store_id' }),
        withSchema(idSchema, { name: 'mall_id' }),
        withSchema(idSchema, { name: 'company_id' }),
        withSchema(idSchema, { name: 'user_id' }),
        withSchema(idSchema, { name: 'seller_id' }),
        withSchema(idSchema, { name: 'cashier_id' }),
        withSchema(booleanSchema, { name: 'is_confirmed' }),
        withSchema(textSchema, { name: 'waybill_code' }),
        withSchema(textSchema, { name: 'code' }),
        withSchema(textSchema, { name: 'type', 'schema.enum': ['online', 'offline'] }),
        withSchema(booleanSchema, { name: 'without_product' }),
        withSchema(textSchema, {
          name: 'payment_method',
          'schema.enum': ['cod', 'wallet', 'cash', 'vnpay', 'alepay']
        }),
        withSchema(textSchema, { name: 'payment_type', 'schema.enum': ['prepaid', 'postpaid'] }),
        withSchema(textSchema, {
          name: 'status',
          'schema.enum': [
            'handling',
            'picking',
            'delivering',
            'delivered',
            'completed',
            'company_canceled',
            'user_canceled',
            'user_rejected',
            'lost_damage',
            'exception'
          ]
        }),
        withSchema(booleanSchema, { name: 'is_paid' }),
        withSchema(booleanSchema, { name: 'is_created_from_menu' }),
        withSchema(booleanSchema, { name: 'is_lucky' }),
        withSchema(idSchema, { name: 'lucky_product_id' }),
        withSchema(booleanSchema, { name: 'is_received_at_store' }),
        withSchema(isoDateSchema, { name: 'date_from' }),
        withSchema(isoDateSchema, { name: 'date_to' }),
        withSchema(isoDateSchema, { name: 'expires_from' }),
        withSchema(isoDateSchema, { name: 'expires_to' })
      ],
      responses: response200
    }
  },
  '/s_/order-caching/company/offline/create': {
    post: {
      tags: ['order-caching'],
      summary: 'company create order-caching',
      description: 'company create order-caching',
      parameters: [populateSchema],
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['code'],
              properties: {
                store_id: { type: 'string', required: true },
                without_product: { type: 'boolean', default: false },
                total: { type: 'number', description: 'Required when without_product is true' },
                products: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      product_storing_id: { type: 'string', required: true },
                      quantity: { type: 'number' },
                      model_id: {
                        type: 'string'
                      },
                      accompanied_products: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            product_storing: {
                              type: 'string'
                            },
                            quantity: {
                              type: 'number'
                            }
                          }
                        }
                      },
                      options: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            type_option_id: {
                              type: 'string'
                            },
                            option_id: {
                              type: 'string'
                            }
                          }
                        }
                      },
                      type: {
                        type: 'string'
                      }
                    },
                    min: 1,
                    example: {
                      product_storing_id: '600817044642fcc12ab5dacd',
                      quantity: 2,
                      options: [
                        {
                          type_option_id: '6062e95fcf233f83ee720246',
                          option_id: '6062e95fcf233f83ee720248'
                        }
                      ],
                      model_id: '609ca203a900e9e7a5339136',
                      accompanied_products: [
                        {
                          product_storing_id: '5e7494bf6bd99e6a93fb2c03',
                          quantity: 3
                        }
                      ],
                      type: 'wholesale'
                    }
                  }
                },

                note: { type: 'string' },
                position: { type: 'string' }
              }
            }
          }
        }
      },
      responses: response201
    }
  },
  '/s_/order-caching/company/offline/{id}': {
    put: {
      tags: ['order-caching'],
      summary: 'company update order-caching by id',
      description: 'company update order-caching by id',
      parameters: [pathIDSchema, populateSchema],
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['code'],
              properties: {
                store_id: { type: 'string', required: true },
                without_product: { type: 'boolean', default: false },
                total: { type: 'number', description: 'Required when without_product is true' },
                products: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      product_storing_id: { type: 'string', required: true },
                      quantity: { type: 'number' },
                      model_id: {
                        type: 'string'
                      },
                      accompanied_products: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            product_storing: {
                              type: 'string'
                            },
                            quantity: {
                              type: 'number'
                            }
                          }
                        }
                      },
                      options: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            type_option_id: {
                              type: 'string'
                            },
                            option_id: {
                              type: 'string'
                            }
                          }
                        }
                      },
                      type: {
                        type: 'string'
                      }
                    },
                    min: 1,
                    example: {
                      product_storing_id: '600817044642fcc12ab5dacd',
                      quantity: 2,
                      model_id: '609ca203a900e9e7a5339136',
                      accompanied_products: [
                        {
                          product_storing_id: '5e7494bf6bd99e6a93fb2c03',
                          quantity: 3
                        }
                      ],
                      options: [
                        {
                          type_option_id: '6062e95fcf233f83ee720246',
                          option_id: '6062e95fcf233f83ee720248'
                        }
                      ],
                      type: 'wholesale'
                    }
                  }
                },

                note: { type: 'string' },
                position: { type: 'string' },
                status: {
                  type: 'string',
                  enum: ['user_rejected', 'user_canceled', 'company_canceled']
                }
              }
            }
          }
        }
      },
      responses: response200
    }
  },
  '/s_/order-caching/admin/id/{id}': {
    get: {
      tags: ['order-caching'],
      summary: 'admin get order-caching by id',
      description: 'admin get order-caching by id',
      parameters: [pathIDSchema, selectSchema, populateSchema],
      responses: response200
    }
  },
  '/s_/order-caching/admin/code/{code}': {
    get: {
      tags: ['order-caching'],
      summary: 'admin get order-caching by code',
      description: 'admin get order-caching by code',
      parameters: [
        withSchema(textSchema, { name: 'code', required: true }),
        selectSchema,
        populateSchema
      ],
      responses: response200
    }
  },
  '/s_/order-caching/admin': {
    get: {
      tags: ['order-caching'],
      summary: 'admin get many order cachings',
      description: 'admin get many order cachings',
      parameters: [
        ...findSchema,
        populateSchema,
        withSchema(idSchema, { name: 'store_id' }),
        withSchema(idSchema, { name: 'mall_id' }),
        withSchema(idSchema, { name: 'company_id' }),
        withSchema(idSchema, { name: 'user_id' }),
        withSchema(idSchema, { name: 'seller_id' }),
        withSchema(idSchema, { name: 'cashier_id' }),
        withSchema(booleanSchema, { name: 'is_confirmed' }),
        withSchema(textSchema, { name: 'waybill_code' }),
        withSchema(textSchema, { name: 'code' }),
        withSchema(textSchema, { name: 'type', 'schema.enum': ['online', 'offline'] }),
        withSchema(booleanSchema, { name: 'without_product' }),
        withSchema(textSchema, {
          name: 'payment_method',
          'schema.enum': ['cod', 'wallet', 'cash', 'vnpay', 'alepay']
        }),
        withSchema(textSchema, { name: 'payment_type', 'schema.enum': ['prepaid', 'postpaid'] }),
        withSchema(textSchema, {
          name: 'status',
          'schema.enum': [
            'handling',
            'picking',
            'delivering',
            'delivered',
            'completed',
            'company_canceled',
            'user_canceled',
            'user_rejected',
            'lost_damage',
            'exception'
          ]
        }),
        withSchema(booleanSchema, { name: 'is_paid' }),
        withSchema(booleanSchema, { name: 'is_created_from_menu' }),
        withSchema(booleanSchema, { name: 'is_lucky' }),
        withSchema(idSchema, { name: 'lucky_product_id' }),
        withSchema(booleanSchema, { name: 'is_received_at_store' }),
        withSchema(isoDateSchema, { name: 'date_from' }),
        withSchema(isoDateSchema, { name: 'date_to' }),
        withSchema(isoDateSchema, { name: 'expires_from' }),
        withSchema(isoDateSchema, { name: 'expires_to' })
      ],
      responses: response200
    }
  }
};
