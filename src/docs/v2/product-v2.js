import { response200, response201 } from '../commons/responses.schema';
import findSchema, { selectSchema, limitSchema } from '../commons/find.schema';
import pathIDSchema from '../commons/path-id.schema';
import { example } from '@hapi/joi';
const modeListSchema = {
  type: 'array',
  items: {
    type: 'object',
    properties: {
      name: {
        type: 'string'
      },
      price: {
        type: 'string'
      },
      box_price: {
        type: 'number'
      },
      SKU: {
        type: 'string'
      },
      tier_index: {
        type: 'array',
        items: {
          type: 'number'
        },
        example: [0, 0]
      },
      images: {
        type: 'array',
        items: {
          type: 'string'
        }
      },
      is_limited_stock: {
        type: 'boolean'
      },
      refund_rate: {
        type: 'number',
        example: 0.1
      }
    }
  }
};
export default {
  '/s_/product/v2/company': {
    post: {
      tags: ['product-v2'],
      summary: 'create product and populate',
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
                attributes: {
                  type: 'object',
                  example: {
                    '5d0de25d68163ff7189e7234': 'Dây da',
                    '5d0de25d68163ff7189e7418': 'Việt Nam'
                  },
                  description: '{[attribute_id]: value}'
                },
                unknown_attributes: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      name: {
                        type: 'string'
                      },
                      value: {
                        type: 'string'
                      }
                    }
                  }
                },
                tier_variation: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      name: {
                        type: 'string'
                      },
                      values: {
                        type: 'array',
                        items: {
                          type: 'string'
                        }
                      }
                    }
                  }
                },
                model_list: modeListSchema,
                category_id: {
                  type: 'string',
                  description: 'type >= 2',
                  example: '5d0de25d68163ff7189e7418'
                },
                product_template_id: {
                  type: 'string',
                  example: '5d0de25d68163ff7189e1234'
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
                },
                unit: {
                  type: 'string'
                },
                box_unit: {
                  type: 'string'
                },
                has_wholesale: {
                  type: 'boolean'
                },
                stock_per_box: {
                  type: 'number'
                },
                box_price: {
                  type: 'number'
                },
                providers: {
                  type: 'array',
                  items: {
                    properties: {
                      provider_id: {
                        type: 'string'
                      },
                      status: {
                        type: 'string',
                        enum: ['active', 'inactive']
                      }
                    }
                  }
                }
              },
              example: {
                name: 'Cong Porsche 4',
                description:
                  'Day la mo ta san pham, Day la mo ta san pham, Day la mo ta san pham, Day la mo ta san pham',
                price: 59000,
                product_template_id: '60a22e6c143a8281ba7517ca',
                category_id: '5eba59d72e0c14665e0f564a',
                attributes: {
                  '609800331126075729593f6d': '8 GB',
                  '6097dc6565f94c37e1b89797': 'Việt Nam'
                },
                unknown_attributes: [
                  {
                    name: 'Chieu dai',
                    value: '10cm'
                  }
                ],
                tier_variations: [
                  {
                    name: 'Màu',
                    values: ['Đỏ', 'Xanh', 'Vàng']
                  },
                  {
                    name: 'Size',
                    values: ['M', 'L']
                  }
                ],
                condition: 'New',
                model_list: [
                  {
                    name: 'Do, M',
                    price: 58000,
                    box_price: 1000000,
                    tier_index: [0, 0],
                    images: [],
                    SKU: '123456',
                    is_limited_stock: true,
                    refund_rate: 0.2
                  },
                  {
                    name: 'Do, L',
                    price: 58000,
                    tier_index: [0, 1],
                    images: [],
                    SKU: '123457'
                  },
                  {
                    name: 'Xanh, M',
                    price: 58000,
                    box_price: 1000000,
                    tier_index: [1, 0],
                    images: [],
                    SKU: '123458'
                  },
                  {
                    name: 'Xanh, L',
                    price: 58000,
                    box_price: 1000000,
                    images: [],
                    SKU: '123459',
                    tier_index: [1, 1]
                  },
                  {
                    name: 'Do, L',
                    price: 58000,
                    box_price: 1000000,
                    images: [],
                    tier_index: [2, 0],
                    SKU: '123460'
                  },
                  {
                    name: 'Do, L',
                    price: 58000,
                    box_price: 1000000,
                    images: [],
                    tier_index: [2, 1],
                    SKU: '123461'
                  }
                ],
                thumbnail: 'public/uploads/s_/product_thumbnail/1584694023792',
                refund_rate: 0.1,
                transportable: 'false',
                SKU: '123400',
                transportable: true,
                packaging_height: 10,
                packaging_length: 10,
                packaging_weight: 10,
                packaging_width: 10,
                is_limited_stock: true,
                is_free_transport: true,
                unit: 'Cái',
                box_unit: 'Thùng',
                stock_per_box: 22,
                has_wholesale: true,
                box_price: 250001,
                providers: [
                  {
                    provider_id: '60432e5ab94bb8e04a87e1f3'
                  },
                  {
                    provider_id: '6049801c4643844c95a1ae84',
                    status: 'inactive'
                  }
                ]
              }
            }
          }
        },
        required: true
      },
      parameters: [
        {
          name: 'populate',
          type: 'string',
          in: 'query'
        }
      ],
      responses: {
        ...response201,
        '400': {
          description: `
            'productTemplateIsNotAllow': 7001303, 
            'missingRequiredAttributes': 701311,
            'productAttributeNotAllow': 7014001,
            'invalidTierIndex': 701312,
            'invalidModelListLength': 701313,
            'productExisted': 701314
          `
        },
        '404': {
          description: `
            'productTemplateNotFound': 7015000,
            'categoryNotExist': 7000300
          `
        }
      }
    },
    get: {
      tags: ['product-v2'],
      summary: 'company get all product',
      parameters: [
        ...findSchema,
        {
          name: 'populate',
          type: 'string',
          in: 'query'
        },
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
          name: 'model_list.model_id',
          in: 'query',
          required: false,
          schema: {
            type: 'string'
          }
        },
        {
          name: 'model_list.SKU',
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
            enum: ['approved', 'disabled', 'pending', 'rejected'],
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
      responses: {
        ...response200
      }
    }
  },
  '/s_/product/v2/company/{id}': {
    put: {
      tags: ['product-v2'],
      summary: 'company update product and populate',
      parameters: [
        pathIDSchema,
        {
          name: 'populate',
          type: 'string',
          in: 'query'
        }
      ],
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
                  type: 'array',
                  items: {
                    type: 'string'
                  }
                },
                useLatestTemplate: {
                  type: 'boolean',
                  description: '{[attribute_id]: value}'
                },
                attributes: {
                  type: 'object',
                  example: {
                    '5d0de25d68163ff7189e7423': 'Dây da',
                    '5d0de25d68163ff7189e7418': 'Việt Nam'
                  },
                  description: '{[attribute_id]: value}'
                },
                unknown_attributes: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      name: {
                        type: 'string'
                      },
                      value: {
                        type: 'string'
                      }
                    }
                  }
                },
                tier_variation: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      name: {
                        type: 'string'
                      },
                      values: {
                        type: 'array',
                        items: {
                          type: 'string'
                        }
                      }
                    }
                  },
                  example: [
                    {
                      name: 'Màu sắc',
                      values: ['Đỏ']
                    },
                    {
                      name: 'Size',
                      values: ['M', 'L']
                    }
                  ]
                },
                model_list: modeListSchema,
                refund_rate: {
                  type: 'string',
                  minLength: 0,
                  maxLength: 1
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
                },
                unit: {
                  type: 'string'
                },
                box_unit: {
                  type: 'string'
                },
                has_wholesale: {
                  type: 'boolean'
                },
                stock_per_box: {
                  type: 'number'
                },
                box_price: {
                  type: 'number'
                },
                providers: {
                  type: 'array',
                  items: {
                    properties: {
                      provider_id: {
                        type: 'string'
                      },
                      status: {
                        type: 'string',
                        enum: ['active', 'inactive']
                      }
                    }
                  }
                }
              }
            }
          }
        },
        required: true
      },
      responses: {
        ...response200,
        '400': {
          description: `
          'productTemplateIsNotAllow': 7001303,
          'missingRequiredAttributes': 701311,
          'productAttributeNotAllow': 7014001,
          'invalidTierIndex': 701312,
          'invalidModelListLength': 701313,
        `
        }
      }
    },
    get: {
      tags: ['product-v2'],
      summary: 'company get product by id',
      parameters: [
        pathIDSchema,
        {
          name: 'populate',
          type: 'string',
          in: 'query'
        },
        {
          name: 'select',
          type: 'string',
          in: 'query'
        }
      ],
      responses: {
        ...response200,
        '404': {
          description: 'Product not exist'
        }
      }
    }
  },
  '/s_/product/v2/admin': {
    get: {
      tags: ['product-v2'],
      summary: 'admin get all',
      parameters: [
        ...findSchema,
        {
          name: 'populate',
          type: 'string',
          in: 'query'
        },
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
          name: 'SKU',
          in: 'query',
          required: false,
          schema: {
            type: 'string'
          }
        },
        {
          name: 'model_list.model_id',
          in: 'query',
          required: false,
          schema: {
            type: 'string'
          }
        },
        {
          name: 'model_list.SKU',
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
            enum: ['approved', 'disabled', 'pending', 'rejected'],
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
      responses: {
        ...response200
      }
    }
  },
  '/s_/product/v2/admin/{id}': {
    get: {
      tags: ['product-v2'],
      summary: 'company get product by id',
      parameters: [
        pathIDSchema,
        {
          name: 'populate',
          type: 'string',
          in: 'query'
        },
        {
          name: 'select',
          type: 'string',
          in: 'query'
        }
      ],
      responses: {
        ...response200,
        '404': {
          description: 'Product not exist'
        }
      }
    }
  },
  '/s_/product/v2/': {
    get: {
      tags: ['product-v2'],
      summary: 'get products',
      parameters: [
        ...findSchema,
        {
          name: 'populate',
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
  '/s_/product/v2/top': {
    get: {
      tags: ['product-v2'],
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
  }
};
