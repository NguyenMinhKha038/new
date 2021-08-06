import findSchema from '../commons/find.schema';
import pathIDSchema from '../commons/path-id.schema';
import { response200, response201 } from '../commons/responses.schema';

export default {
  '/s_/store': {
    get: {
      tags: ['store'],
      summary: 'get stores',
      parameters: [
        {
          name: 'location',
          in: 'query',
          required: false,
          schema: {
            type: 'string'
          }
        },
        {
          name: 'radius',
          in: 'query',
          required: false,
          schema: {
            type: 'number'
          }
        },
        ...findSchema,
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
        }
      ],
      responses: response200
    }
  },
  '/s_/store/nearest': {
    get: {
      tags: ['store'],
      summary: 'get stores sort by distance',
      parameters: [
        {
          name: 'location',
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
        }
      ],
      responses: response200
    }
  },
  '/s_/store/{id}': {
    get: {
      tags: ['store'],
      summary: 'get store by id',
      parameters: [pathIDSchema],
      responses: response200
    }
  },
  '/s_/store/admin': {
    get: {
      tags: ['store'],
      summary: 'admin get stores',
      parameters: [
        ...findSchema,
        {
          name: 'start_time',
          in: 'query',
          required: false,
          schema: {
            type: 'iso date'
          }
        },
        {
          name: 'end_time',
          in: 'query',
          required: false,
          schema: {
            type: 'iso date'
          }
        },
        {
          name: 'status',
          in: 'query',
          required: false,
          schema: {
            type: 'string',
            enum: ['active', 'disabled']
          }
        }
      ],
      responses: response200
    }
  },
  '/s_/store/admin/{id}': {
    get: {
      tags: ['store'],
      summary: 'admin get a store by id',
      parameters: [pathIDSchema],
      responses: response200
    }
  },
  '/s_/store/company': {
    get: {
      tags: ['store'],
      summary: 'company get store',
      responses: response200
    },
    post: {
      tags: ['store'],
      summary: 'company create a store',
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['address', 'location', 'name'],
              properties: {
                name: {
                  type: 'string'
                },
                address: {
                  type: 'object',
                  properties: {
                    logo: { type: 'string' },
                    cover_image: { type: 'string' },
                    description: { type: 'string' },
                    province: {
                      type: 'string'
                    },
                    district: {
                      type: 'string'
                    },
                    ward: {
                      type: 'string'
                    },
                    text: {
                      type: 'string'
                    },
                    manager_name: {
                      type: 'string'
                    },
                    phone_number: {
                      type: 'string'
                    }
                  },
                  example: {
                    province: 'Hồ Chí Minh',
                    district: 'Quận 12',
                    ward: 'Phường 11',
                    ward_code: '3447',
                    district_code: '5433',
                    province_code: '79',
                    text: '48 Bình Phú'
                  }
                },
                location: {
                  type: 'string',
                  example: '1.23456789,2.2345678'
                },
                status: {
                  type: 'string',
                  enum: ['active', 'disabled']
                }
              }
            }
          }
        },
        required: true
      },
      responses: response201
    }
  },
  '/s_/store/user/{id}': {
    get: {
      tags: ['store'],
      summary: 'user get personal by id (?)',
      parameters: [pathIDSchema],
      responses: response200
    },
    put: {
      tags: ['store'],
      summary: 'user update a store',
      parameters: [pathIDSchema],
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                logo: { type: 'string' },
                cover_image: { type: 'string' },
                description: { type: 'string' },
                name: {
                  type: 'string'
                },
                address: {
                  type: 'object',
                  properties: {
                    province: {
                      type: 'string'
                    },
                    district: {
                      type: 'string'
                    },
                    ward: {
                      type: 'string'
                    },
                    text: {
                      type: 'string'
                    },
                    manager_name: {
                      type: 'string'
                    },
                    phone_number: {
                      type: 'string'
                    }
                  },
                  example: {
                    province: 'Hồ Chí Minh',
                    district: 'Quận 12',
                    ward: 'Phường 11',
                    ward_code: '3447',
                    district_code: '5433',
                    province_code: '79',
                    text: '48 Bình Phú'
                  }
                },
                location: {
                  type: 'string',
                  example: '1.23456789,2.2345678'
                },
                status: {
                  type: 'string',
                  enum: ['active', 'disabled']
                }
              }
            }
          }
        },
        required: true
      },
      responses: response200
    }
  }
};
