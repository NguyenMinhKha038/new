import { response200, response201 } from '../commons/responses.schema';
import withSchema from '../commons/with-schema';
import pathIDSchema from '../commons/path-id.schema';
import findSchema, {
  selectSchema,
  populateSchema,
  idSchema,
  statusSchema,
  booleanSchema,
  textSchema
} from '../commons/find.schema';

export default {
  '/s_/selling-option/company/{id}': {
    get: {
      tags: ['selling-option'],
      summary: 'get selling-option by id',
      description: 'get selling-option by id',
      parameters: [pathIDSchema, selectSchema, populateSchema],
      responses: response200
    },
    delete: {
      tags: ['selling-option'],
      summary: 'company remove selling-option',
      description: 'company remove selling-option',
      parameters: [pathIDSchema],
      responses: response200
    },
    put: {
      tags: ['selling-option'],
      summary: 'company update selling-option by id',
      description: 'company update selling-option by id',
      parameters: [pathIDSchema],
      requestBody: {
        content: {
          'application/json': {
            schema: {
              properties: {
                status: { type: 'string', default: 'active' },
                required: { type: 'boolean', default: 'false' },
                name: { type: 'string' },
                image_url: { type: 'string' },
                unit: {
                  type: 'string',
                  enum: [
                    'centimeter',
                    'meter',
                    'kilogram',
                    'gram',
                    'byte',
                    'kilobyte',
                    'terabyte',
                    'gigabyte',
                    'liter',
                    'quantity',
                    'na'
                  ]
                },
                options: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      name: { type: 'string' },
                      value: { type: 'mixed' },
                      status: { type: 'string' },
                      image_url: { type: 'string' },
                      price: { type: 'number' },
                      quantity: { type: 'number' },
                      is_limited_quantity: { type: 'boolean' }
                    }
                  }
                }
              },
              example: {
                name: 'Kích thước',
                required: false,
                image_url: 'https://loganfashion.com/wp-content/uploads/2020/08/logo.png',
                options: [
                  {
                    name: 'Lớn',
                    value: 'L',
                    price: 12000,
                    image_url: 'https://loganfashion.com/wp-content/uploads/2020/08/logo.png',
                    is_limited_quantity: true,
                    quantity: 50
                  },
                  {
                    name: 'Vừa',
                    value: 'M',
                    price: 8000,
                    image_url: 'https://loganfashion.com/wp-content/uploads/2020/08/logo.png',
                    is_limited_quantity: true,
                    quantity: 20
                  },
                  {
                    name: 'nhỏ',
                    value: 'S',
                    price: 3000,
                    image_url: 'https://loganfashion.com/wp-content/uploads/2020/08/logo.png',
                    is_limited_quantity: true,
                    quantity: 100
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
  '/s_/selling-option/company': {
    get: {
      tags: ['selling-option'],
      summary: 'get selling-options',
      description: 'get selling-options',
      parameters: [
        ...findSchema,
        withSchema(idSchema, { name: 'company_id' }),
        withSchema(idSchema, { name: 'store_id' }),
        withSchema(statusSchema, { name: 'status' }),
        withSchema(booleanSchema, { name: 'required' }),
        withSchema(textSchema, { name: 'scope', 'schema.enum': ['global', 'company', 'store'] })
      ],
      responses: response200
    },
    post: {
      tags: ['selling-option'],
      summary: 'company create selling-option',
      description: 'company create selling-option',
      requestBody: {
        content: {
          'application/json': {
            schema: {
              properties: {
                status: { type: 'string', default: 'active' },
                required: { type: 'boolean', default: false },
                type: { type: 'string', enum: ['selection', 'option'] },
                name: { type: 'string' },
                image_url: { type: 'string' },
                unit: {
                  type: 'string',
                  enum: [
                    'centimeter',
                    'meter',
                    'kilogram',
                    'gram',
                    'byte',
                    'kilobyte',
                    'terabyte',
                    'gigabyte',
                    'liter',
                    'quantity',
                    'na'
                  ]
                },
                options: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      name: { type: 'string' },
                      value: { type: 'mixed' },
                      status: { type: 'string' },
                      image_url: { type: 'string' },
                      price: { type: 'number' },
                      quantity: { type: 'number' },
                      is_limited_quantity: { type: 'boolean' }
                    }
                  }
                }
              },
              example: {
                type: 'option',
                name: 'Kích thước',
                required: false,
                image_url: 'https://loganfashion.com/wp-content/uploads/2020/08/logo.png',
                options: [
                  {
                    name: 'Lớn',
                    value: 'L',
                    price: 12000,
                    image_url: 'https://loganfashion.com/wp-content/uploads/2020/08/logo.png',
                    is_limited_quantity: true,
                    quantity: 50
                  },
                  {
                    name: 'Vừa',
                    value: 'M',
                    price: 8000,
                    image_url: 'https://loganfashion.com/wp-content/uploads/2020/08/logo.png',
                    is_limited_quantity: true,
                    quantity: 20
                  },
                  {
                    name: 'nhỏ',
                    value: 'S',
                    price: 3000,
                    image_url: 'https://loganfashion.com/wp-content/uploads/2020/08/logo.png',
                    is_limited_quantity: true,
                    quantity: 100
                  }
                ]
              }
            }
          }
        }
      },
      responses: response201
    }
  },
  '/s_/selling-option/admin/{id}': {
    get: {
      tags: ['selling-option'],
      summary: 'get selling-option by id',
      description: 'get selling-option by id',
      parameters: [pathIDSchema, selectSchema, populateSchema],
      responses: response200
    },
    delete: {
      tags: ['selling-option'],
      summary: 'admin remove selling-option',
      description: 'admin remove selling-option',
      parameters: [pathIDSchema],
      responses: response200
    },
    put: {
      tags: ['selling-option'],
      summary: 'admin update selling-option by id',
      description: 'admin update selling-option by id',
      parameters: [pathIDSchema],
      requestBody: {
        content: {
          'application/json': {
            schema: {
              properties: {
                status: { type: 'string', default: 'active' },
                required: { type: 'boolean', default: 'false' },
                name: { type: 'string' },
                image_url: { type: 'string' },
                unit: {
                  type: 'string',
                  enum: [
                    'centimeter',
                    'meter',
                    'kilogram',
                    'gram',
                    'byte',
                    'kilobyte',
                    'terabyte',
                    'gigabyte',
                    'liter',
                    'quantity',
                    'na'
                  ]
                },
                options: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      name: { type: 'string' },
                      value: { type: 'mixed' },
                      status: { type: 'string' },
                      image_url: { type: 'string' },
                      price: { type: 'number' },
                      quantity: { type: 'number' },
                      is_limited_quantity: { type: 'boolean' }
                    }
                  }
                }
              },
              example: {
                name: 'Kích thước',
                required: false,
                image_url: 'https://loganfashion.com/wp-content/uploads/2020/08/logo.png',
                options: [
                  {
                    name: 'Lớn',
                    value: 'L',
                    price: 12000,
                    image_url: 'https://loganfashion.com/wp-content/uploads/2020/08/logo.png',
                    is_limited_quantity: true,
                    quantity: 50
                  },
                  {
                    name: 'Vừa',
                    value: 'M',
                    price: 8000,
                    image_url: 'https://loganfashion.com/wp-content/uploads/2020/08/logo.png',
                    is_limited_quantity: true,
                    quantity: 20
                  },
                  {
                    name: 'nhỏ',
                    value: 'S',
                    price: 3000,
                    image_url: 'https://loganfashion.com/wp-content/uploads/2020/08/logo.png',
                    is_limited_quantity: true,
                    quantity: 100
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
  '/s_/selling-option/admin': {
    get: {
      tags: ['selling-option'],
      summary: 'get selling-options',
      description: 'get selling-options',
      parameters: [
        ...findSchema,
        withSchema(idSchema, { name: 'company_id' }),
        withSchema(idSchema, { name: 'store_id' }),
        withSchema(statusSchema, { name: 'status' }),
        withSchema(booleanSchema, { name: 'required' }),
        withSchema(textSchema, { name: 'scope', 'schema.enum': ['global', 'company', 'store'] })
      ],
      responses: response200
    },
    post: {
      tags: ['selling-option'],
      summary: 'admin create selling-option',
      description: 'admin create selling-option',
      requestBody: {
        content: {
          'application/json': {
            schema: {
              properties: {
                status: { type: 'string', default: 'active' },
                required: { type: 'boolean', default: false },
                type: { type: 'string', enum: ['selection', 'option'] },
                name: { type: 'string' },
                image_url: { type: 'string' },
                unit: {
                  type: 'string',
                  enum: [
                    'centimeter',
                    'meter',
                    'kilogram',
                    'gram',
                    'byte',
                    'kilobyte',
                    'terabyte',
                    'gigabyte',
                    'liter',
                    'quantity',
                    'na'
                  ]
                },
                options: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      name: { type: 'string' },
                      value: { type: 'mixed' },
                      status: { type: 'string' },
                      image_url: { type: 'string' },
                      price: { type: 'number' },
                      quantity: { type: 'number' },
                      is_limited_quantity: { type: 'boolean' }
                    }
                  }
                }
              },
              example: {
                type: 'option',
                name: 'Kích thước',
                required: false,
                image_url: 'https://loganfashion.com/wp-content/uploads/2020/08/logo.png',
                options: [
                  {
                    name: 'Lớn',
                    value: 'L',
                    price: 12000,
                    image_url: 'https://loganfashion.com/wp-content/uploads/2020/08/logo.png',
                    is_limited_quantity: true,
                    quantity: 50
                  },
                  {
                    name: 'Vừa',
                    value: 'M',
                    price: 8000,
                    image_url: 'https://loganfashion.com/wp-content/uploads/2020/08/logo.png',
                    is_limited_quantity: true,
                    quantity: 20
                  },
                  {
                    name: 'nhỏ',
                    value: 'S',
                    price: 3000,
                    image_url: 'https://loganfashion.com/wp-content/uploads/2020/08/logo.png',
                    is_limited_quantity: true,
                    quantity: 100
                  }
                ]
              }
            }
          }
        }
      },
      responses: response201
    }
  }
};
