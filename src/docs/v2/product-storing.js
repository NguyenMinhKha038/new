import findSchema, {
  limitSchema,
  idSchema,
  selectSchema,
  statusSchema,
  booleanSchema,
  numberSchema,
  populateSchema
} from '../commons/find.schema';
import pathIDSchema from '../commons/path-id.schema';
import withSchema from '../commons/with-schema';
import { response200, response201 } from '../commons/responses.schema';

export default {
  '/s_/product-storing/company/import-product-to-store': {
    post: {
      summary: 'import product to product storing in store',
      tags: ['product-storing'],
      requestBody: {
        content: {
          'application/json': {
            schema: {
              required: ['products', 'store_id'],
              properties: {
                products: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      _id: {
                        type: 'string'
                      },
                      stock: {
                        type: 'number'
                      }
                    }
                  }
                },
                store_id: {
                  type: 'string'
                }
              }
            }
          }
        }
      },
      responses: response200
    }
  },
  '/s_/product-storing/company/{id}': {
    put: {
      summary: 'update product storing',
      tags: ['product-storing'],
      parameters: [pathIDSchema],
      requestBody: {
        content: {
          'application/json': {
            schema: {
              properties: {
                active: {
                  type: 'boolean'
                }
              }
            }
          }
        }
      },
      responses: response200
    }
  },
  '/s_/product-storing/': {
    get: {
      summary: 'public get product storing',
      tags: ['product-storing'],
      parameters: [
        ...findSchema,
        {
          name: 'store_id',
          in: 'query',
          required: false,
          schema: {
            type: 'string'
          }
        },
        {
          name: 'product_id',
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
  '/s_/product-storing/company': {
    get: {
      summary: 'get product storing',
      tags: ['product-storing'],
      parameters: [
        ...findSchema,
        {
          name: 'store_id',
          in: 'query',
          required: false,
          schema: {
            type: 'string'
          }
        },
        {
          name: 'product_id',
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
  '/s_/product-storing/company/search': {
    get: {
      summary: 'get product storing',
      tags: ['product-storing'],
      parameters: [
        limitSchema,
        {
          name: 'query',
          in: 'query',
          required: false,
          schema: {
            type: 'string'
          }
        },
        {
          name: 'store_id',
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
  '/s_/product-storing/company/update-stock': {
    post: {
      tags: ['product-storing'],
      summary: 'stock in, stock out productStoring.',
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                type: { type: 'string' },
                productStorings: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: {
                        type: 'string'
                      },
                      stock: {
                        type: 'number'
                      }
                    }
                  }
                },
                note: { type: 'string' },
                provider: { type: 'string' }
              },
              example: {
                type: 'import | export',
                productStorings: [
                  {
                    id: '5e96b37a1181235f7514abf7',
                    stock: 70000
                  },
                  {
                    id: '5e96b37a1181235f7514abf1',
                    stock: 5000
                  },
                  {
                    id: '5e96b37a1181235f7514abf6',
                    stock: 70000
                  }
                ],
                note: 'T_T',
                provider: "<script>window.location = 'http://example.com'</script>"
              }
            }
          },
          required: true
        }
      },
      responses: {
        ...response200,
        '400': {
          description: "'client.productNotExist': 7001300, 'client.stockCannotBeNegative': 7001303"
        }
      }
    }
  },
  '/s_/product-storing/company/request-move-stock': {
    post: {
      tags: ['product-storing'],
      summary: 'Request move product stock from store A to store B',
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                products: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: { type: 'string', required: true },
                      stock: {
                        type: 'number',
                        required: true
                      }
                    }
                  }
                },
                note: {
                  type: 'string'
                },
                from_store_id: {
                  type: 'string',
                  required: true
                },
                to_store_id: {
                  type: 'string',
                  required: true
                },
                product_id: {
                  type: 'string',
                  required: true,
                  description: 'Used when move stocks of single product.'
                },
                stock: {
                  type: 'number',
                  required: true,
                  description: 'Used when move stocks of single product.'
                }
              },
              example: {
                products: [
                  { id: '5e7494bf6bd99e6a93fb2bff', stock: 5 },
                  { id: '5e7494bf6bd99e6a93fb2c21', stock: 5 }
                ],
                from_store_id: '5e74812f6bd99e6a93faf90d',
                to_store_id: '5e7481556bd99e6a93fafb77',
                note: 'request note.'
              }
            }
          }
        }
      },
      responses: response201
    }
  },
  '/s_/product-storing/company/approve-move-stock': {
    post: {
      tags: ['product-storing'],
      summary: 'Approve/cancel move product stock from store A to store B',
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                product_stock_history_id: {
                  type: 'string',
                  required: true
                },
                status: {
                  type: 'string',
                  required: true,
                  enum: ['approved', 'cancelled']
                },
                products: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: { type: 'string', required: true },
                      status: {
                        type: 'string',
                        enum: ['approved', 'cancelled'],
                        default: 'approved'
                      }
                    }
                  }
                },
                note: {
                  type: 'string'
                }
              },
              example: {
                product_stock_history_id: '5f0d35ae6c7576412cf80ad6',
                status: 'approved',
                note: 'approve note'
              }
            }
          }
        }
      },
      responses: response200
    }
  },
  '/s_/product-storing/company/confirm-move-stock': {
    post: {
      tags: ['product-storing'],
      summary: 'Confirm/cancel move product stock from store A to store B',
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                product_stock_history_id: {
                  type: 'string',
                  required: true
                },
                products: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: { type: 'string', required: true },
                      status: {
                        type: 'string',
                        enum: ['completed', 'cancelled'],
                        default: 'completed'
                      },
                      stock: {
                        type: 'number',
                        description:
                          'uses this fields if the quantity of received product was not equals the requested quantity'
                      }
                    }
                  }
                },
                note: {
                  type: 'string'
                },
                status: {
                  type: 'string',
                  description: '<i>If this field used, then all products have this status.</i>',
                  enum: ['completed', 'cancelled']
                }
              },
              example: {
                product_stock_history_id: '5f0d35ae6c7576412cf80ad6',
                products: [
                  { id: '5e7494bf6bd99e6a93fb2bff', status: 'completed' },
                  { id: '5e7494bf6bd99e6a93fb2c21', status: 'cancelled' }
                ],
                note: 'completed note.'
              }
            }
          }
        }
      },
      responses: response200
    }
  },
  '/s_/product-storing/admin': {
    get: {
      summary: 'admin get product storing',
      tags: ['product-storing'],
      parameters: [
        ...findSchema,
        {
          name: 'store_id',
          in: 'query',
          required: false,
          schema: {
            type: 'string'
          }
        },
        {
          name: 'product_id',
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
  // [marker]: APIs v2
  '/s_/product-storing/v2/{id}': {
    get: {
      summary: 'user get product storing by id',
      tags: ['product-storing'],
      parameters: [pathIDSchema, selectSchema, populateSchema],
      responses: response200
    }
  },
  '/s_/product-storing/v2/': {
    get: {
      summary: 'user get product storings',
      tags: ['product-storing'],
      parameters: [
        ...findSchema,
        populateSchema,
        withSchema(idSchema, { name: 'store_id' }),
        withSchema(idSchema, { name: 'company_id' }),
        withSchema(idSchema, { name: 'product_id' }),
        withSchema(idSchema, { name: 'groups' }),
        withSchema(idSchema, { name: 'tags' }),
        withSchema(booleanSchema, { name: 'in_menu' })
      ],
      responses: response200
    }
  },
  '/s_/product-storing/v2/admin/{id}': {
    get: {
      summary: 'admin get product storing by id',
      tags: ['product-storing'],
      parameters: [pathIDSchema, selectSchema, populateSchema],
      responses: response200
    }
  },
  '/s_/product-storing/v2/admin': {
    get: {
      summary: 'admin get product storings',
      tags: ['product-storing'],
      parameters: [
        ...findSchema,
        populateSchema,
        withSchema(idSchema, { name: 'product_id' }),
        withSchema(idSchema, { name: 'company_id' }),
        withSchema(idSchema, { name: 'store_id' }),
        withSchema(idSchema, { name: 'groups' }),
        withSchema(idSchema, { name: 'tags' }),
        withSchema(booleanSchema, { name: 'in_menu' }),
        withSchema(statusSchema, { 'schema.enum': ['active', 'inactive', 'disabled'] }),
        withSchema(booleanSchema, { name: 'is_active_product' }),
        withSchema(booleanSchema, { name: 'is_lucky' }),
        withSchema(booleanSchema, { name: 'is_limited_stock' }),
        withSchema(booleanSchema, { name: 'transportable' })
      ],
      responses: response200
    }
  },
  '/s_/product-storing/v2/company/{id}': {
    get: {
      summary: 'company get product storing by id',
      description: 'company get product storing by id',
      tags: ['product-storing'],
      parameters: [pathIDSchema, selectSchema, populateSchema],
      responses: response200
    },
    put: {
      tags: ['product-storing'],
      summary: 'company update product storing by id',
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                price: { type: 'number' },
                refund_rate: { type: 'number' },
                discount_rate: { type: 'number' },
                discount: { type: 'number' },
                promotion_refund_rate: { type: 'number' },
                promotion_discount_rate: { type: 'number' },
                global_promotion_refund_rate: { type: 'number' },
                global_promotion_discount_rate: { type: 'number' },
                total_refund_rate: { type: 'number' },
                is_limited_stock: { type: 'boolean' },
                is_lucky: { type: 'boolean' },
                on_sales_stock: { type: 'number' },
                model_list: {
                  type: 'object',
                  properties: {
                    model_id: { type: 'string', required: true },
                    price: { type: 'number' },
                    batch_stock: { type: 'number' },
                    on_sales_stock: { type: 'number' },
                    status: { type: 'string', enum: ['active', 'inactive'] },
                    SKU: { type: 'string' },
                    sold_count: { type: 'number' },
                    refund: { type: 'number' },
                    refund_rate: { type: 'number' },
                    discount: { type: 'number' },
                    discount_rate: { type: 'number' }
                  }
                },
                options: {
                  type: 'object',
                  properties: {
                    id: { type: 'string', required: true },
                    status: { type: 'string', enum: ['active', 'inactive'] },
                    required: { type: 'boolean' }
                  }
                },
                tags: {
                  type: 'array',
                  items: {
                    type: 'string'
                  }
                },
                note: { type: 'string' },
                in_menu: { type: 'boolean' },
                groups: {
                  type: 'array',
                  items: {
                    type: 'string'
                  }
                }
              },
              example: {
                price: 300000,
                is_limited_stock: true,
                model_list: [
                  {
                    model_id: '60a5d7915beb28219ea83f5e',
                    batch_stock: 4,
                    status: 'active',
                    price: 140000
                  },
                  {
                    model_id: '60a5d7915beb28219ea83f5f',
                    on_sales_stock: 5,
                    status: 'active',
                    price: 140000
                  }
                ],
                options: [
                  {
                    id: '6062e20dd8d38171c64a99fb',
                    status: 'active',
                    required: true
                  },
                  {
                    id: '6062d5482abbfa5196478336',
                    status: 'active',
                    required: true
                  }
                ],
                groups: ['606d2370b1c54e2f3873ca31', '606d231313769e2de8ac5421'],
                tags: ['606d39e2fcc72a598e3fbece', '606c20e6e11437792cf4489b'],
                note: 'what the note <script></script>',
                on_sales_stock: 20,
                in_menu: true
              }
            }
          }
        }
      },
      responses: response200
    },
    delete: {
      summary: 'company delete product storing by id',
      deprecated: true,
      tags: ['product-storing'],
      parameters: [pathIDSchema],
      responses: response200
    }
  },
  '/s_/product-storing/v2/company': {
    get: {
      summary: 'company get product storings',
      tags: ['product-storing'],
      parameters: [
        ...findSchema,
        populateSchema,
        withSchema(idSchema, { name: 'product_id' }),
        withSchema(idSchema, { name: 'store_id' }),
        withSchema(idSchema, { name: 'groups' }),
        withSchema(idSchema, { name: 'tags' }),
        withSchema(idSchema, { name: 'model_list._id' }),
        withSchema(booleanSchema, { name: 'in_menu' }),
        withSchema(booleanSchema, { name: 'is_directed_import' }),
        withSchema(statusSchema, { 'schema.enum': ['active', 'inactive'] }),
        withSchema(booleanSchema, { name: 'is_active_product' }),
        withSchema(booleanSchema, { name: 'is_lucky' }),
        withSchema(booleanSchema, { name: 'is_limited_stock' }),
        withSchema(booleanSchema, { name: 'transportable' })
      ],
      responses: response200
    },
    post: {
      tags: ['product-storing'],
      summary: 'company import products to store',
      description: 'company import products to store',
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                store_id: { type: 'string' },
                note: { type: 'string' },
                products: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: { type: 'string', required: true },
                      is_limited_stock: { type: 'boolean' },
                      on_sales_stock: { type: 'number' },
                      model_list: {
                        type: 'object',
                        properties: {
                          model_id: { type: 'string', required: true },
                          price: { type: 'number' },
                          batch_stock: { type: 'number' },
                          on_sales_stock: { type: 'number' },
                          status: { type: 'string', enum: ['active', 'inactive'] },
                          SKU: { type: 'string' },
                          sold_count: { type: 'number' },
                          refund: { type: 'number' },
                          refund_rate: { type: 'number' },
                          discount: { type: 'number' },
                          discount_rate: { type: 'number' }
                        }
                      },
                      options: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            id: { type: 'string', required: true },
                            status: { type: 'string', enum: ['active', 'inactive'] },
                            required: { type: 'boolean' }
                          }
                        }
                      },
                      tags: {
                        type: 'array',
                        items: {
                          type: 'string'
                        }
                      },
                      in_menu: { type: 'boolean' },
                      groups: {
                        type: 'array',
                        items: {
                          type: 'string'
                        }
                      }
                    }
                  }
                }
              },
              example: {
                store_id: '5e74819e6bd99e6a93fb004a',
                note: 'what the note <script></script>',
                products: [
                  {
                    id: '5e7494a16bd99e6a93fb26bf',
                    is_limited_stock: true,
                    model_list: [
                      {
                        model_id: '60a5d7915beb28219ea83f5e',
                        batch_stock: 4,
                        status: 'active',
                        price: 140000
                      },
                      {
                        model_id: '60a5d7915beb28219ea83f5f',
                        batch_stock: 5,
                        status: 'active',
                        price: 140000
                      }
                    ],
                    options: [
                      {
                        id: '6062e20dd8d38171c64a99fb',
                        status: 'active',
                        required: true
                      },
                      {
                        id: '6062d5482abbfa5196478336',
                        status: 'active',
                        required: true
                      }
                    ],
                    groups: ['606d2370b1c54e2f3873ca31', '606d231313769e2de8ac5421'],
                    tags: ['606d39e2fcc72a598e3fbece', '606c20e6e11437792cf4489b'],
                    on_sales_stock: 20,
                    in_menu: true
                  }
                ]
              }
            }
          }
        }
      },
      responses: response200
    }
  },
  '/s_/product-storing/v2/company/update-status': {
    put: {
      tags: ['product-storing'],
      summary: 'company update status of product storings',
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
