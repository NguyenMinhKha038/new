import findSchema, { selectSchema, limitSchema } from '../commons/find.schema';
import pathIDSchema from '../commons/path-id.schema';
import { response200, response201 } from '../commons/responses.schema';

export default {
  '/s_/product/{id}': {
    get: {
      tags: ['product'],
      summary: 'get product by id',
      parameters: [pathIDSchema, selectSchema],
      responses: response200
    }
  },
  '/s_/product/transport-fee': {
    get: {
      tags: ['product'],
      summary: 'get transport fee',
      parameters: [
        {
          name: 'product_id',
          in: 'query',
          required: true,
          schema: {
            type: 'string'
          }
        },
        {
          name: 'company_id',
          in: 'query',
          required: true,
          schema: {
            type: 'string'
          }
        }
      ],
      responses: {
        '200': {
          description: 'Status 200',
          content: {
            'application/json': {
              example: {
                statusCode: 200,
                data: [
                  {
                    _id: '5ebf464e6dee723987436511',
                    location: {
                      type: 'Point',
                      coordinates: [106.80092, 10.85846]
                    },
                    is_default: true,
                    user_id: '5e5f2a19ee81e04d90580998',
                    province: 'Hồ Chí Minh',
                    district: 'Quận 10',
                    ward: 'Phường 11',
                    ward_code: '3447',
                    district_code: '5433',
                    province_code: '79',
                    text: 'Nam Cao',
                    receiver: 'Đoàn Công Minh',
                    phone_number: '0962062515',
                    createdAt: '2020-05-16T01:47:58.582Z',
                    updatedAt: '2020-05-16T01:47:58.582Z',
                    __v: 0,
                    transport_fees: [
                      {
                        provider: 'ghn',
                        fee: 23100,
                        original_fee: 30800,
                        display_name: 'Giao hàng nhanh'
                      }
                    ]
                  },
                  {
                    _id: '5eba2780730394605442202b',
                    location: {
                      type: 'Point',
                      coordinates: [106.7709173, 10.8296978]
                    },
                    is_default: false,
                    user_id: '5e5f2a19ee81e04d90580998',
                    province: 'Hồ Chí Minh',
                    district: 'Quận 8',
                    ward: 'Phường Phước Long B',
                    text: '48 Đường Tăng Nhơn Phú',
                    province_code: '79',
                    district_code: '775',
                    ward_code: '27361',
                    receiver: 'Đoàn Công Minh',
                    phone_number: '0962062515',
                    createdAt: '2020-05-12T04:35:12.994Z',
                    updatedAt: '2020-05-16T01:47:58.583Z',
                    __v: 0,
                    transport_fees: [{}]
                  },
                  {
                    _id: '5eba27a2730394605442203a',
                    location: {
                      type: 'Point',
                      coordinates: [106.7709173, 10.8296978]
                    },
                    is_default: false,
                    user_id: '5e5f2a19ee81e04d90580998',
                    province: 'Hồ Chí Minh',
                    district: 'Quận 9',
                    ward: 'Phường Phước Long B',
                    text: '48 Đường Tăng Nhơn Phú',
                    province_code: '79',
                    district_code: '775',
                    ward_code: '27361',
                    receiver: 'Đoàn Công Minh',
                    phone_number: '0962062515',
                    createdAt: '2020-05-12T04:35:46.689Z',
                    updatedAt: '2020-05-12T04:35:46.689Z',
                    __v: 0,
                    transport_fees: [
                      {
                        provider: 'ghn',
                        fee: 28050,
                        original_fee: 37400,
                        display_name: 'Giao hàng nhanh'
                      }
                    ]
                  }
                ],
                valid_discounts: [
                  {
                    status: 'active',
                    _id: '5ebf45506dee7239874364f7',
                    order_value: 50000,
                    discount_rate: 1
                  },
                  {
                    status: 'active',
                    _id: '5ebf45576dee7239874364fb',
                    order_value: 25000,
                    discount_rate: 0.5
                  },
                  {
                    status: 'active',
                    _id: '5ebf45746dee723987436500',
                    order_value: 5000,
                    discount_rate: 0.25
                  }
                ]
              }
            }
          }
        }
      }
    }
  },
  '/s_/product/admin': {
    get: {
      tags: ['product'],
      summary: 'admin get product',
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
          name: 'company_id',
          in: 'query',
          required: false,
          schema: {
            type: 'string'
          }
        },
        {
          name: 'status',
          in: 'query',
          required: false,
          schema: {
            type: 'string',
            enum: ['approved', 'disabled', 'pending', 'rejected']
          }
        },
        {
          name: 'group_product_id',
          in: 'query',
          required: false,
          schema: {
            type: 'string'
          }
        },
        {
          name: 'category_id',
          in: 'query',
          required: false,
          schema: {
            type: 'string'
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
          required: false,
          schema: {
            type: 'string'
          }
        },
        {
          name: '_id',
          in: 'query',
          required: false,
          schema: {
            type: 'string'
          }
        },
        {
          name: 'text',
          in: 'query',
          required: false,
          schema: {
            type: 'string'
          }
        },
        {
          name: 'updated_from',
          in: 'query',
          required: false,
          schema: {
            type: 'iso date'
          }
        },
        {
          name: 'updated_to',
          in: 'query',
          required: false,
          schema: {
            type: 'iso date'
          }
        },
        {
          name: 'created_from',
          in: 'query',
          required: false,
          schema: {
            type: 'iso date'
          }
        },
        {
          name: 'created_to',
          in: 'query',
          required: false,
          schema: {
            type: 'iso date'
          }
        }
      ],
      responses: response200
    }
  },
  '/s_/product/admin/{id}': {
    get: {
      tags: ['product'],
      summary: 'admin get product by id',
      parameters: [pathIDSchema],
      responses: response200
    }
  },
  '/s_/product/admin/approve': {
    post: {
      tags: ['product'],
      summary: 'admin approve product',
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                id: {
                  type: 'string'
                },
                status: {
                  type: 'string',
                  enum: ['approved', 'rejected']
                }
              }
            }
          }
        },
        required: true
      },
      responses: response200
    }
  },
  '/s_/product/user/like/': {
    post: {
      tags: ['product'],
      summary: 'user like product.',
      requestBody: {
        content: {
          'application/json': {
            schema: {
              properties: {
                id: {
                  type: 'string',
                  required: 'true'
                },
                state: {
                  type: 'string',
                  enum: ['like', 'unlike'],
                  required: 'true'
                }
              }
            }
          }
        }
      },
      responses: response200
    }
  },
  '/s_/product/': {
    get: {
      tags: ['product'],
      summary: 'get product',
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
          name: 'company_id',
          in: 'query',
          required: false,
          schema: {
            type: 'string'
          }
        },
        {
          name: 'category_id',
          in: 'query',
          required: false,
          deprecated: true,
          schema: {
            type: 'string'
          }
        },
        {
          name: 'type_category_id',
          in: 'query',
          required: false,
          schema: {
            type: 'string'
          }
        },
        {
          name: 'company_category_id',
          in: 'query',
          required: false,
          schema: {
            type: 'string'
          }
        },
        {
          name: 'sub_category_id',
          in: 'query',
          required: false,
          schema: {
            type: 'string'
          }
        },
        {
          name: 'is_lucky',
          in: 'query',
          required: false,
          schema: {
            type: 'boolean'
          }
        },
        {
          name: 'sale_date',
          in: 'query',
          required: false,
          schema: {
            type: 'string'
          }
        },
        {
          name: 'updated_from',
          in: 'query',
          required: false,
          schema: {
            type: 'iso date'
          }
        },
        {
          name: 'updated_to',
          in: 'query',
          required: false,
          schema: {
            type: 'iso date'
          }
        },
        {
          name: 'created_from',
          in: 'query',
          required: false,
          schema: {
            type: 'iso date'
          }
        },
        {
          name: 'created_to',
          in: 'query',
          required: false,
          schema: {
            type: 'iso date'
          }
        }
      ],
      responses: response200
    }
  },
  '/s_/product/top': {
    get: {
      tags: ['product'],
      summary: 'get top product by category',
      parameters: [
        {
          name: 'category_ids',
          in: 'query',
          required: false,
          schema: {
            type: 'string',
            example: 'category_id1,category_id2....'
          }
        },
        limitSchema,
        {
          name: 'type',
          in: 'query',
          required: false,
          schema: {
            type: 'number',
            default: 1,
            enum: [1, 2, 3]
          }
        }
      ],
      responses: response200
    }
  },
  '/s_/product/user/share/': {
    post: {
      tags: ['product'],
      summary: 'user share product.',
      requestBody: {
        content: {
          'application/json': {
            schema: {
              properties: {
                id: {
                  type: 'string',
                  required: 'true'
                }
              }
            }
          }
        }
      },
      responses: response200
    }
  },
  '/s_/product/view/': {
    post: {
      tags: ['product'],
      summary: 'user view product.',
      requestBody: {
        content: {
          'application/json': {
            schema: {
              properties: {
                id: {
                  type: 'string',
                  required: 'true'
                }
              }
            }
          }
        }
      },
      responses: response200
    }
  },
  '/s_/product/user/favorite/': {
    get: {
      summary: 'user get favorite',
      tags: ['product'],
      parameters: [...findSchema],
      responses: {}
    },
    post: {
      tags: ['product'],
      summary: 'user favorite product.',
      requestBody: {
        content: {
          'application/json': {
            schema: {
              properties: {
                id: {
                  type: 'string',
                  required: 'true'
                },
                state: {
                  type: 'string',
                  required: 'true',
                  enum: ['favorite', 'unfavorite']
                }
              }
            }
          }
        }
      },
      responses: response200
    }
  },
  '/s_/product/user/view/': {
    get: {
      summary: 'user get views',
      tags: ['product'],
      parameters: [...findSchema],
      responses: response200
    }
  },
  '/s_/product/company/{id}/': {
    get: {
      tags: ['product'],
      summary: 'company get product by id',
      parameters: [
        ...findSchema,
        {
          name: 'select',
          in: 'query',
          required: false,
          schema: {
            type: 'string'
          }
        }
      ],
      responses: response200
    },
    put: {
      tags: ['product'],
      summary: 'company update product',
      parameters: [pathIDSchema],
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                name: {
                  minLength: '8',
                  maxLength: '256',
                  type: 'string'
                },
                description: {
                  type: 'string',
                  minLength: '80',
                  maxLength: '3096'
                },
                price: {
                  type: 'string'
                },
                status: {
                  type: 'string',
                  enum: ['disabled', 'pending']
                },
                thumbnail: {
                  type: 'string'
                },
                images: {
                  type: 'string'
                },
                refund_rate: {
                  type: 'string',
                  minLength: 0,
                  maxLength: 1
                },
                stock: {
                  type: 'object',
                  description: '{[store_id]: stock}'
                },
                condition: {
                  type: 'string'
                },
                transportable: {
                  description: 'if transport packing_fields is required',
                  type: 'boolean'
                },
                packaging_width: {
                  description: 'cm',
                  type: 'number'
                },
                packaging_height: {
                  description: 'cm',
                  type: 'number'
                },
                packaging_length: {
                  description: 'cm',
                  type: 'number'
                },
                packaging_weight: {
                  description: 'gram',
                  type: 'string'
                },
                category_id: {
                  type: 'string',
                  description: 'type >= 2'
                },
                is_free_transport: {
                  type: 'boolean'
                },
                is_limited_stock: {
                  type: 'boolean'
                },
                SKU: {
                  type: 'string'
                },
                warranty_information: {
                  type: 'string'
                }
              }
            }
          }
        },
        required: true
      },
      responses: response200
    }
  },
  '/s_/product/company/stock/': {
    put: {
      deprecated: true,
      tags: ['product'],
      summary: 'stock in, stock out productStoring.',
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
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
                }
              },
              example: {
                productStorings: [
                  {
                    id: '5e96b37a1181235f7514abf7',
                    stock: 70000
                  },
                  {
                    id: '5e96b37a1181235f7514abf1',
                    stock: -5000
                  },
                  {
                    id: '5e96b37a1181235f7514abf6',
                    stock: 70000
                  }
                ]
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
  '/s_/product/company/stock/request-move': {
    post: {
      deprecated: true,
      tags: ['product'],
      summary: 'Request move product stock from store A to store B.',
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                product_id: {
                  type: 'string',
                  required: true
                },
                from_store_id: {
                  type: 'string',
                  required: true
                },
                to_store_id: {
                  type: 'string',
                  required: true
                },
                stock: {
                  type: 'number',
                  required: true
                }
              },
              example: {
                product_id: '5e7494bf6bd99e6a93fb2bff',
                from_store_id: '5e74812f6bd99e6a93faf90d',
                to_store_id: '5e7481556bd99e6a93fafb77',
                stock: 1
              }
            }
          }
        }
      }
    }
  },
  '/s_/product/company/stock/confirm-move': {
    put: {
      deprecated: true,
      tags: ['product'],
      summary: 'Confirm/cancel move product stock from store A to store B.',
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
                  enum: ['completed', 'cancelled']
                },
                stock: {
                  type: 'number',
                  description:
                    'uses this fields if the quantity of received product was not equals the requested quantity'
                },
                note: {
                  type: 'string'
                }
              },
              example: {
                product_stock_history_id: '5f0d35ae6c7576412cf80ad6',
                status: 'completed',
                stock: 2,
                note: '1/3 san pham bi hu, chi nhan 2 san pham'
              }
            }
          }
        }
      }
    }
  },
  '/s_/product/company': {
    get: {
      tags: ['product'],
      summary: 'company get company product',
      parameters: [
        ...findSchema,
        {
          name: 'product_ids',
          in: 'query',
          required: false,
          schema: {
            type: 'array',
            items: {
              type: 'string'
            }
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
          name: 'SKU',
          in: 'query',
          required: false,
          schema: {
            type: 'string'
          }
        },
        {
          name: 'status',
          in: 'query',
          required: false,
          schema: {
            type: 'string',
            description: 'allow array'
          }
        },
        {
          name: 'text',
          in: 'query',
          required: false,
          schema: {
            type: 'string'
          }
        },
        {
          name: 'updated_from',
          in: 'query',
          required: false,
          schema: {
            type: 'iso date'
          }
        },
        {
          name: 'updated_to',
          in: 'query',
          required: false,
          schema: {
            type: 'iso date'
          }
        },
        {
          name: 'created_from',
          in: 'query',
          required: false,
          schema: {
            type: 'iso date'
          }
        },
        {
          name: 'created_to',
          in: 'query',
          required: false,
          schema: {
            type: 'iso date'
          }
        }
      ],
      responses: response200
    },
    post: {
      tags: ['product'],
      summary: 'company create product',
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['description', 'name', 'price', 'store_id', 'unit'],
              properties: {
                name: {
                  type: 'string',
                  minLength: '8',
                  maxLength: '256'
                },
                description: {
                  type: 'string',
                  minLength: '80',
                  maxLength: '3096'
                },
                price: {
                  type: 'number'
                },
                status: {
                  type: 'string',
                  enum: ['disabled']
                },
                thumbnail: {
                  type: 'string'
                },
                images: {
                  type: 'array',
                  items: {
                    type: 'string'
                  }
                },
                stock: {
                  type: 'object',
                  description: '{[store_id]: stock}'
                },
                category_id: {
                  type: 'string',
                  description: 'type >= 2',
                  example: '5d0de25d68163ff7189e7418'
                },
                refund_rate: {
                  type: 'string',
                  default: '0',
                  minLength: 0,
                  maxLength: 1
                },
                transportable: {
                  description: 'if transport packing_fields is required',
                  type: 'boolean'
                },
                packaging_width: {
                  description: 'cm',
                  type: 'number'
                },
                packaging_height: {
                  description: 'cm',
                  type: 'number'
                },
                packaging_length: {
                  description: 'cm',
                  type: 'number'
                },
                packaging_weight: {
                  description: 'gram',
                  type: 'string'
                },
                condition: {
                  type: 'string'
                },
                is_free_transport: {
                  type: 'boolean'
                },
                is_limited_stock: {
                  type: 'boolean'
                },
                SKU: {
                  type: 'string'
                },
                warranty_information: {
                  type: 'string'
                }
              },
              example: {
                name: 'Unlimited',
                description:
                  'Unlim                                               35354333333333333333333333333333333333333333333333333333333333333333333333333',
                price: '30000',
                images: [
                  'public/uploads/s_/products/1570723964771.5d9ea88cbf370f2ff202ca5f_resized.jpg'
                ],
                refund_rate: 0.1,
                thumbnail:
                  'public/uploads/s_/products/1570723964771.5d9ea88cbf370f2ff202ca5f_resized.jpg',
                condition: 'mới',
                transportable: true,
                packaging_height: 10,
                packaging_length: 10,
                packaging_weight: 10,
                packaging_width: 10,
                category_id: '5e942129ee82407ed59eab48',
                is_limited_stock: true,
                stock: {
                  '5e8d3c4e0eaf9b608f031c3a': 5
                }
              }
            }
          }
        },
        required: true
      },
      responses: {
        ...response201,
        '400': {
          description:
            "'client.logisticsIsUnavailable': 7002302\n 'client.companyIsOfflineSales': 7002306,"
        }
      }
    }
  },
  '/s_/product/user/upload/': {
    post: {
      tags: ['product'],
      summary: 'company upload product image.',
      requestBody: {
        content: {
          'multipart/form-data': {
            schema: {
              type: 'object',
              properties: {
                thumbnail: {
                  type: 'string',
                  maxLength: 1
                },
                images: {
                  type: 'string',
                  maxLength: 6
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
