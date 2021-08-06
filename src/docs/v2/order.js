import findSchema, {
  selectSchema,
  limitSchema,
  sortSchema,
  pageSchema,
  populateSchema,
  textSchema,
  isoDateSchema
} from '../commons/find.schema';
import withSchema from '../commons/with-schema';
import { response200, response201 } from '../commons/responses.schema';
import pathIDSchema from '../commons/path-id.schema';

export default {
  '/s_/order/user': {
    get: {
      tags: ['order'],
      summary: 'user get personal order',
      parameters: [
        {
          name: 'is_received_at_store',
          in: 'query',
          schema: {
            type: 'boolean'
          }
        },
        {
          name: 'date',
          in: 'query',
          schema: {
            type: 'string'
          }
        },
        {
          name: 'status',
          in: 'query',
          schema: {
            type: 'string',
            enum: ['pending', 'handling', 'ready']
          }
        },
        ...findSchema
      ],
      responses: {
        '200': {
          description: 'Status 200',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  products: {
                    type: 'object'
                  },
                  store_id: {
                    type: 'string'
                  },
                  company_id: {
                    type: 'string'
                  },
                  user_id: {
                    type: 'string'
                  },
                  seller_id: {
                    type: 'string'
                  },
                  cashier_id: {
                    type: 'string'
                  },
                  user_name: {
                    type: 'string'
                  },
                  original_total: {
                    type: 'string'
                  },
                  total: {
                    type: 'string',
                    valid: '_3month, _6month, _12month'
                  },
                  transport_fee: {
                    type: 'number'
                  },
                  discount_rate: {
                    type: 'number'
                  },
                  total_discount: {
                    type: 'number'
                  },
                  refund_rate: {
                    type: 'number'
                  },
                  total_refund: {
                    type: 'number'
                  },
                  code: {
                    type: 'string'
                  },
                  type: {
                    type: 'string'
                  },
                  without_product: {
                    type: 'boolean'
                  },
                  payment_method: {
                    type: 'string'
                  },
                  delivery_address: {
                    type: 'string'
                  },
                  status: {
                    type: 'string'
                  },
                  promotion_code: {
                    type: 'string'
                  },
                  promotion_id: {
                    type: 'string'
                  },
                  is_paid: {
                    type: 'boolean'
                  },
                  total_service_fee: {
                    type: 'number'
                  },
                  reason_canceled: {
                    type: 'string'
                  },
                  reason_reject: {
                    type: 'string'
                  }
                }
              }
            }
          }
        }
      }
    },
    post: {
      tags: ['order'],
      description: 'company create order',
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['store_id', 'company_id', 'products'],
              properties: {
                store_id: {
                  type: 'string'
                },
                company_id: {
                  type: 'string'
                },
                note: {
                  type: 'string'
                },
                products: {
                  type: 'array',
                  example: [
                    {
                      product_storing_id: '5e96b3901181235f7514abfb',
                      quantity: 1,
                      note: 'more sugar'
                    }
                  ]
                },
                position: { type: 'string', example: 'B1' }
              }
            }
          }
        }
      },
      responses: {
        ...response200,
        '400': {
          description:
            "'client.productNotExist': 7001300, 'client.menuIsEmpty': 7001420, 'client.outOfStock': 7001416,"
        }
      }
    }
  },
  '/s_/order/user/count-status': {
    get: {
      tags: ['order'],
      parameters: [
        {
          name: 'statuses',
          in: 'query',
          required: true,
          schema: {
            type: 'string',
            example: 'handling,picking'
          }
        }
      ],
      responses: response200
    }
  },
  '/s_/order/user/{code}': {
    get: {
      tags: ['order'],
      parameters: [
        {
          name: 'code',
          in: 'path',
          required: true,
          schema: {
            type: 'string'
          }
        }
      ],
      responses: response200
    },
    put: {
      tags: ['order'],
      parameters: [
        {
          name: 'code',
          in: 'path',
          required: true,
          schema: {
            type: 'string'
          }
        }
      ],
      responses: {
        ...response200,
        '400': {
          description:
            '7001414 - order cant cancel by limit cancel \n 7001415 - order cant cancel by status != pending or handling'
        }
      },
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['status', 'reason_canceled'],
              properties: {
                status: {
                  type: 'string'
                },
                reason_canceled: {
                  type: 'object'
                }
              }
            }
          }
        }
      }
    }
  },
  '/s_/order/user/pay/{code}': {
    post: {
      description: 'user pay by scanning QR',
      parameters: [
        {
          name: 'code',
          required: true,
          in: 'path'
        }
      ],
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                payment_method: {
                  type: 'string',
                  enum: ['WALLET', 'CASH'],
                  default: 'WALLET'
                }
              }
            }
          }
        }
      },
      tags: ['order'],
      responses: response200
    }
  },
  '/s_/order/user/offline/confirm/{code}': {
    post: {
      tags: ['order'],
      summary: 'user confirm postpaid order',
      description: 'user confirm postpaid order',
      parameters: [
        {
          name: 'code',
          required: true,
          in: 'path'
        }
      ],
      requestBody: {
        content: {
          'application/json': {
            schema: {
              required: ['note'],
              properties: {
                note: {
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
  '/s_/order/user/offline/get-unconfirmed': {
    get: {
      tags: ['order'],
      summary: 'User get unconfirmed orders from store.',
      description: 'User get unconfirmed orders from store.',
      parameters: [
        {
          name: 'store_id',
          schema: {
            type: 'string',
            example: '5f6afc74642f45b824909143'
          },
          required: true,
          in: 'query'
        },
        limitSchema,
        {
          name: 'select',
          schema: {
            type: 'string',
            example: 'type status products position code createdAt'
          },
          in: 'query'
        },
        sortSchema,
        {
          name: 'populate',
          schema: {
            type: 'string',
            example: 'company store promotion'
          },
          in: 'query'
        },
        pageSchema
      ],
      responses: response200
    }
  },
  '/s_/order/user/offline/confirm-and-pay/{code}': {
    post: {
      tags: ['order'],
      summary: 'user confirm and pay for prepaid order',
      description: 'user confirm and pay for prepaid order',
      parameters: [
        {
          name: 'code',
          required: true,
          in: 'path'
        }
      ],
      requestBody: {
        content: {
          'application/json': {
            schema: {
              required: ['payment_method', 'note'],
              properties: {
                payment_method: {
                  type: 'string',
                  enum: ['CASH', 'WALLET', 'VNPAY']
                },
                note: {
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
  '/s_/order/company/pay/{code}': {
    post: {
      description: 'user pay by scanning QR',
      parameters: [
        {
          name: 'code',
          required: true,
          in: 'path'
        }
      ],
      requestBody: {
        content: {
          'application/json': {
            schema: {
              required: ['payment_method', 'payment_code'],
              properties: {
                payment_method: {
                  type: 'string',
                  enum: ['CASH', 'WALLET']
                },
                payment_code: {
                  type: 'number'
                },
                phone_number: {
                  type: 'number'
                }
              }
            }
          }
        }
      },
      tags: ['order'],
      responses: response200
    }
  },
  '/s_/order/company': {
    get: {
      tags: ['order'],
      summary: "company get company's order",
      parameters: [
        {
          name: 'is_received_at_store',
          in: 'query',
          schema: {
            type: 'boolean'
          }
        },
        {
          name: 'date',
          in: 'query',
          schema: {
            type: 'string'
          }
        },
        {
          name: 'status',
          in: 'query',
          schema: {
            type: 'string',
            enum: ['pending', 'handling', 'ready']
          }
        },
        ...findSchema,
        {
          name: 'status',
          in: 'query',
          schema: {
            type: 'string',
            enum: [
              'completed',
              'user_canceled',
              'company_canceled',
              'handling',
              'picking',
              'delivering',
              'delivered',
              'user_rejected'
            ]
          }
        },
        {
          name: 'type',
          in: 'query',
          schema: {
            type: 'string',
            enum: ['online', 'offline']
          }
        },
        {
          name: 'start_time',
          in: 'query',
          required: false,
          schema: {
            type: 'string'
          }
        },
        {
          name: 'end_time',
          in: 'query',
          schema: {
            type: 'string'
          }
        },
        {
          name: 'staff_id',
          in: 'query',
          schema: {
            type: 'string'
          }
        },
        {
          name: 'store_id',
          in: 'query',
          schema: {
            type: 'string'
          }
        },
        {
          name: 'promotion_id',
          in: 'query',
          schema: {
            type: 'string'
          }
        }
      ],
      responses: response200
    },
    post: {
      tags: ['order'],
      description: 'company create order',
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['without_product'],
              properties: {
                without_product: {
                  type: 'boolean'
                },
                note: {
                  type: 'string'
                },
                store_id: {
                  type: 'string',
                  description: 'when you are company owner'
                },
                total: {
                  type: 'number',
                  description: 'if withoutproduct true'
                },
                products: {
                  type: 'array',
                  example: [
                    {
                      product_storing_id: '5d9f58a9910aa81e92961800',
                      quantity: 2
                    }
                  ]
                }
              }
            }
          }
        }
      },
      responses: response200
    }
  },
  '/s_/order/company/v2': {
    get: {
      tags: ['order'],
      summary: "company get company's order",
      parameters: [
        limitSchema,
        pageSchema,
        sortSchema,
        {
          name: 'without_product',
          in: 'query',
          required: false,
          schema: {
            type: 'boolean'
          }
        },
        {
          name: 'status',
          in: 'query',
          required: false,
          schema: {
            type: 'string',
            enum: [
              'completed',
              'picking',
              'user_canceled',
              'company_canceled',
              'handling',
              'delivering',
              'delivered',
              'user_rejected'
            ]
          }
        },
        {
          name: 'type',
          in: 'query',
          required: false,
          schema: {
            type: 'string',
            enum: ['online', 'offline']
          }
        },
        {
          name: 'user_id',
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
        },
        {
          name: 'company_id',
          in: 'query',
          required: false,
          schema: {
            type: 'string'
          }
        },
        {
          name: 'is_created_from_menu',
          in: 'query',
          required: false,
          schema: {
            type: 'boolean'
          }
        },
        {
          name: 'position',
          in: 'query',
          required: false,
          schema: {
            type: 'string'
          }
        },
        {
          name: 'progress_status',
          in: 'query',
          required: false,
          schema: {
            type: 'string',
            enum: ['pending', 'handling', 'ready']
          }
        },
        {
          name: 'code',
          in: 'query',
          required: false,
          schema: {
            type: 'string'
          }
        },
        {
          name: 'payment_method',
          in: 'query',
          required: false,
          schema: {
            type: 'string'
          }
        },
        {
          name: 'is_confirmed',
          in: 'query',
          required: false,
          schema: {
            type: 'boolean'
          }
        },
        {
          name: 'is_paid',
          in: 'query',
          required: false,
          schema: {
            type: 'boolean'
          }
        },
        {
          name: 'seller_id',
          in: 'query',
          required: false,
          schema: {
            type: 'string'
          }
        },
        {
          name: 'cashier_id',
          in: 'query',
          required: false,
          schema: {
            type: 'string'
          }
        },
        {
          name: 'user_name',
          in: 'query',
          required: false,
          schema: {
            type: 'string'
          }
        },
        {
          name: 'user_phone',
          in: 'query',
          required: false,
          schema: {
            type: 'string'
          }
        },
        {
          name: 'from_date',
          in: 'query',
          required: false,
          schema: {
            type: 'timestamp'
          }
        },
        {
          name: 'to_date',
          in: 'query',
          required: false,
          schema: {
            type: 'timestamp'
          }
        },
        {
          name: 'date',
          in: 'query',
          required: false,
          schema: {
            type: 'timestamp'
          }
        },
        {
          name: 'is_received_at_store',
          in: 'query',
          required: false,
          schema: {
            type: 'boolean'
          }
        }
      ],
      responses: response200
    }
  },
  '/s_order/user/confirm-received/{code}': {
    post: {
      description: 'user confirm order is received',
      parameters: [
        {
          name: 'code',
          required: true,
          in: 'path'
        }
      ],
      tags: ['order'],
      responses: response200
    }
  },
  '/s_/order/company/{code}': {
    get: {
      tags: ['order'],
      parameters: [
        {
          name: 'code',
          in: 'path',
          required: true,
          schema: {
            type: 'string'
          }
        }
      ],
      responses: response200
    },
    put: {
      tags: ['order'],
      parameters: [
        {
          name: 'code',
          in: 'path',
          required: true,
          schema: {
            type: 'string'
          }
        }
      ],
      responses: {
        ...response200,
        '400': {
          description: '7001410 cant change status'
        }
      },
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['status'],
              properties: {
                status: {
                  type: 'string',
                  enum: ['company_canceled', 'delivered', 'user_rejected']
                },
                progress_status: {
                  type: 'string',
                  enum: ['ready']
                },
                reason_canceled: {
                  type: 'string'
                }
              }
            }
          }
        }
      }
    }
  },
  '/s_/order/company/confirm': {
    post: {
      tags: ['order'],
      responses: {
        ...response200,
        '400': {
          description: '7001410 cant change status'
        }
      },
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['code'],
              properties: {
                code: {
                  type: 'string',
                  description: 'order code'
                },
                note: {
                  type: 'string',
                  description: 'note for customer'
                }
              }
            }
          }
        }
      }
    }
  },
  '/s_/order/company/offline/confirm': {
    post: {
      tags: ['order'],
      description: "company confirms client's offline order",
      summary: "company confirms client's offline order",
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['code', 'note'],
              properties: {
                code: {
                  type: 'string',
                  description: 'order code'
                },
                note: {
                  type: 'string',
                  description: 'note for customer'
                }
              }
            }
          }
        }
      },
      responses: response200
    }
  },
  '/s_/order/company/offline/update-order-status/{code}': {
    post: {
      tags: ['order'],
      description: "company updates client's offline order status",
      summary: "company updates client's offline order status",
      parameters: [
        {
          name: 'code',
          in: 'path',
          required: true,
          schema: {
            type: 'string'
          }
        }
      ],
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['status', 'progress_status', 'reason_canceled', 'reason_rejected'],
              properties: {
                status: {
                  type: 'string',
                  description: "order's status"
                },
                progress_status: {
                  type: 'string',
                  description: "order's progress status"
                },
                reason_canceled: {
                  type: 'string',
                  description: 'reason order is canceled'
                },
                reason_rejected: {
                  type: 'string',
                  description: 'reason order is rejected'
                }
              }
            }
          }
        }
      },
      responses: response200
    }
  },
  '/s_/order/admin': {
    get: {
      tags: ['order'],
      summary: 'admin get orders',
      parameters: [
        {
          name: 'is_received_at_store',
          in: 'query',
          schema: {
            type: 'boolean'
          }
        },
        {
          name: 'date',
          in: 'query',
          schema: {
            type: 'string'
          }
        },
        {
          name: 'code',
          in: 'query',
          schema: {
            type: 'string'
          }
        },
        {
          name: 'status',
          in: 'query',
          schema: {
            type: 'string',
            enum: ['pending', 'handling', 'ready']
          }
        },
        ...findSchema,
        {
          name: 'status',
          in: 'query',
          schema: {
            type: 'string',
            enum: [
              'completed',
              'user_canceled',
              'company_canceled',
              'handling',
              'picking',
              'delivering',
              'delivered',
              'user_rejected'
            ]
          }
        },
        {
          name: 'company_id',
          in: 'query',
          schema: {
            type: 'string'
          }
        },
        {
          name: 'product_id',
          in: 'query',
          schema: {
            type: 'string'
          }
        },
        {
          name: 'seller_id',
          in: 'query',
          schema: {
            type: 'string'
          }
        },
        {
          name: 'cashier_id',
          in: 'query',
          schema: {
            type: 'string'
          }
        },
        {
          name: 'is_lucky',
          in: 'query',
          schema: {
            type: 'boolean'
          }
        },
        {
          name: 'date',
          in: 'query',
          schema: {
            type: 'string'
          }
        }
      ],
      responses: response200
    }
  },
  '/s_/order/admin/approve': {
    post: {
      tags: ['order'],
      responses: {
        ...response200,
        '400': {
          description:
            "'client.orderNotExist': 7001400, 'client.orderMustBeOffline': 7001418, 'client.orderMustBeDelivered': 7001419,"
        }
      },
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['code'],
              properties: {
                code: {
                  type: 'string',
                  description: 'order code'
                }
              }
            }
          }
        }
      }
    }
  },
  '/s_/order/admin/pay-fee': {
    post: {
      tags: ['order'],
      summary: 'admin exec pay fee for order if not paid fee',
      responses: {
        ...response200,
        '400': {
          description: "'client.orderNotExist': 7001400, 'client.orderIsNotConfirmed'"
        }
      },
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['code'],
              properties: {
                code: {
                  type: 'string',
                  description: 'order code'
                }
              }
            }
          }
        }
      }
    }
  },
  '/s_/order/admin/{code}': {
    get: {
      tags: ['order'],
      parameters: [
        {
          name: 'code',
          in: 'path',
          required: true,
          schema: {
            type: 'string'
          }
        }
      ],
      responses: response200
    }
  },
  '/s_/order/admin/{code}/logistics': {
    get: {
      tags: ['order'],
      summary: 'admin get logistics info of order',
      parameters: [
        {
          name: 'code',
          in: 'path',
          required: true,
          schema: {
            type: 'string'
          }
        }
      ],
      responses: response200
    }
  },
  '/s_/order/company/statistic-customer': {
    get: {
      tags: ['order'],
      summary: 'admin get logistics info of order',
      parameters: [
        {
          name: 'limit',
          in: 'query',
          required: false,
          schema: {
            type: 'number'
          }
        },
        {
          name: 'page',
          in: 'query',
          required: false,
          schema: {
            type: 'number'
          }
        },
        {
          name: 'user_id',
          in: 'query',
          required: false,
          schema: {
            type: 'number'
          }
        },
        {
          name: 'store_id',
          in: 'query',
          required: false,
          schema: {
            type: 'number'
          }
        },
        {
          name: 'sort',
          in: 'query',
          required: false,
          schema: {
            type: 'number'
          }
        },
        {
          name: 'created_from',
          in: 'query',
          required: false,
          schema: {
            type: 'date'
          }
        },
        {
          name: 'created_to',
          in: 'query',
          required: false,
          schema: {
            type: 'date'
          }
        }
      ],
      responses: response200
    }
  },
  '/s_/order/company/statistic-product': {
    get: {
      tags: ['order'],
      summary: 'admin get logistics info of order',
      parameters: [
        {
          name: 'sort',
          in: 'query',
          required: false,
          schema: {
            type: 'number'
          }
        },
        {
          name: 'created_from',
          in: 'query',
          required: false,
          schema: {
            type: 'date'
          }
        },
        {
          name: 'created_to',
          in: 'query',
          required: false,
          schema: {
            type: 'date'
          }
        }
      ],
      responses: response200
    }
  },
  '/s_/order/v2/company/offline/create': {
    post: {
      tags: ['order'],
      description: 'company create order',
      summary: 'company create order',
      parameters: [populateSchema],
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['store_id', 'company_id'],
              properties: {
                without_product: {
                  type: 'boolean',
                  description: 'When this field is false, then products is required'
                },
                store_id: {
                  type: 'string'
                },
                company_id: {
                  type: 'string'
                },
                note: {
                  type: 'string'
                },
                products: {
                  type: 'array',
                  example: [
                    {
                      product_storing_id: '5f51b6089860210c7b1dc388',
                      quantity: 1,
                      note: 'more sugar',
                      options: [
                        {
                          type_option_id: '6062e20dd8d38171c64a99fb',
                          option_id: '6062e20dd8d38171c64a99fc'
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
                  ]
                },
                position: { type: 'string', example: 'B1' }
              }
            }
          }
        }
      },
      responses: response201
    }
  },
  '/s_/order/v2/company/statistics': {
    get: {
      tags: ['order'],
      description: 'company get order statistics',
      summary: 'company get order statistics',
      parameters: [
        withSchema(textSchema, {
          name: 'type',
          'schema.enum': ['completed_day', 'completed_month', 'completed_year']
        }),
        withSchema(isoDateSchema, { name: 'date_from' }),
        withSchema(isoDateSchema, { name: 'date_to' })
      ],
      responses: response200
    }
  },
  '/s_/order/v2/company/offline/create-from-cache': {
    post: {
      tags: ['order'],
      description: 'company create order from caching',
      summary: 'company create order from caching',
      parameters: [populateSchema],
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                order_caching_id: {
                  type: 'string',
                  required: true
                },
                note: {
                  type: 'string'
                }
              }
            }
          }
        }
      },
      responses: response201
    }
  },
  '/s_/order/v2/company/pay/{code}': {
    post: {
      tags: ['order'],
      summary: 'pay order v2',
      parameters: [
        {
          name: 'code',
          in: 'path',
          required: true,
          schema: {
            type: 'string'
          }
        }
      ],
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                payment_method: {
                  type: 'string',
                  required: true,
                  enum: ['CASH', 'WALLET']
                },
                payment_code: {
                  type: 'string',
                  max: 1e13
                },
                phone_number: {
                  type: 'string',
                  max: 12
                },
                store_id: {
                  type: 'string'
                },
                user_type: {
                  type: 'string',
                  required: true,
                  enum: ['user', 'buyer']
                }
              }
            }
          }
        }
      },
      responses: response200
    }
  },
  '/s_/order/v2/company/{id}': {
    put: {
      tags: ['order'],
      description: 'company update order',
      summary: 'company update order',
      parameters: [pathIDSchema],
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                status: {
                  type: 'string',
                  max: 12
                },
                store_id: {
                  type: 'string'
                },
                position: {
                  type: 'string'
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
