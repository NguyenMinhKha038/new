import findSchema from '../commons/find.schema';
import { response200, response201 } from '../commons/responses.schema';
import pathIDSchema from '../commons/path-id.schema';

export default {
  '/s_/category': {
    get: {
      tags: ['category'],
      summary: 'get category',
      parameters: [
        {
          name: '_id',
          in: 'query',
          required: false,
          description: 'array if get many _id',
          schema: {
            type: 'string'
          }
        },
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
          name: 'select',
          in: 'query',
          required: false,
          schema: {
            type: 'string'
          }
        },
        {
          name: 'type',
          in: 'query',
          required: false,
          schema: {
            type: 'string'
          }
        },
        {
          name: 'parent_id',
          in: 'query',
          required: false,
          schema: {
            type: 'string'
          }
        },
        {
          name: 'sort',
          in: 'query',
          required: false,
          schema: {
            type: 'string'
          }
        }
      ],
      responses: {
        '200': {
          description: 'Status 200'
        }
      }
    }
  },
  '/s_/category/{id}': {
    get: {
      tags: ['category'],
      summary: 'get category by id',
      responses: response200
    },
    parameters: [pathIDSchema]
  },
  '/s_/category/admin/image': {
    post: {
      tags: ['category'],
      summary: 'upload image',
      requestBody: {
        content: {
          'multipart/form-data': {
            schema: {
              type: 'object',
              properties: {
                image: {
                  type: 'string',
                  maxLength: 1,
                  format: 'binary'
                }
              }
            }
          }
        }
      },
      responses: response200
    }
  },
  '/s_/category/admin': {
    get: {
      tags: ['category'],
      summary: 'admin get categories',
      parameters: [
        ...findSchema,
        {
          name: '_id',
          in: 'query',
          required: false,
          description: 'array if get many _id',
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
            enum: ['active', 'disabled']
          }
        }
      ],
      responses: response200
    },
    post: {
      tags: ['category'],
      summary: 'admin post a category',
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['name', 'status', 'type'],
              properties: {
                name: {
                  type: 'string'
                },
                image: {
                  type: 'string'
                },
                status: {
                  type: 'string',
                  default: 'pending',
                  enum: ['active', 'disabled', 'pending']
                },
                parent_id: {
                  type: 'string'
                },
                type: {
                  type: 'number',
                  description: '1: danh muc cha, 2: danh muc con, 3 dong san pham',
                  default: 1,
                  enum: [1, 2, 3]
                },
                fee_rate: {
                  type: 'number',
                  default: 0.01,
                  description: 'type 2 only'
                },
                fee_type: {
                  type: 'number',
                  description: 'type 2 only'
                },
                priority: {
                  type: 'number',
                  description: 'the higher the priority'
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
  '/s_/category/admin/{id}': {
    get: {
      tags: ['category'],
      summary: 'admin get category by id',
      parameters: [pathIDSchema],
      responses: response200
    },
    put: {
      tags: ['category'],
      summary: 'admin update category',
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                name: {
                  type: 'string'
                },
                image: {
                  type: 'string'
                },
                status: {
                  type: 'string'
                },
                parent_id: {
                  type: 'string'
                },
                priority: {
                  type: 'number',
                  description: 'the higher the priority'
                }
              }
            }
          }
        },
        required: true
      },
      responses: response200
    },
    delete: {
      tags: ['category'],
      summary: 'admin delete category',
      responses: response200
    },
    parameters: [pathIDSchema]
  },
  '/s_/category/company': {
    post: {
      tags: ['category'],
      summary: 'company post a category',
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['name', 'type'],
              properties: {
                name: {
                  type: 'string'
                },
                parent_id: {
                  type: 'string'
                },
                type: {
                  type: 'number',
                  description: '1: danh muc cha, 2: danh muc con, 3 dong san pham',
                  default: 1,
                  enum: [1, 2, 3]
                }
              }
            }
          }
        },
        required: true
      },
      responses: response201
    }
  }
};
