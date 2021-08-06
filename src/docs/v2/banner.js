import findSchema from '../commons/find.schema';
import { response200, response201 } from '../commons/responses.schema';
import pathIDSchema from '../commons/path-id.schema';

export default {
  '/s_/banner/company': {
    get: {
      summary: 'company get banner',
      tags: ['banner'],
      parameters: [
        ...findSchema,
        {
          name: 'status',
          in: 'query',
          required: false,
          schema: {
            type: 'string',
            enum: ['pending', 'approved', 'disabled']
          }
        },
        {
          name: 'active',
          in: 'query',
          required: false,
          schema: {
            type: 'boolean'
          }
        },
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
          name: 'custom_status',
          in: 'query',
          required: false,
          schema: {
            type: 'boolean',
            enum: ['upcoming', 'expired', 'running', 'created', 'started', 'ended']
          },
          description: 'status "created started ended" is based on start_time, end_time'
        }
      ],
      responses: response200
    },
    post: {
      tags: ['banner'],
      summary: 'company_port banner',
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['image', 'name', 'start_time', 'end_time', 'position'],
              properties: {
                name: {
                  type: 'string'
                },
                image: {
                  type: 'string'
                },
                start_time: {
                  type: 'string'
                },
                end_time: {
                  type: 'string'
                },
                position: {
                  type: 'number',
                  enum: [1, 2, 3, 4, 5]
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
  '/s_/banner/slot': {
    get: {
      summary: 'company get banner',
      tags: ['banner'],
      parameters: [
        {
          name: 'start_time',
          in: 'query',
          required: true,
          schema: {
            type: 'iso date'
          }
        },
        {
          name: 'end_time',
          in: 'query',
          required: true,
          schema: {
            type: 'iso date'
          }
        },
        {
          name: 'position',
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
  '/s_/banner/company/upload': {
    post: {
      tags: ['banner'],
      summary: 'company upload banner image',
      requestBody: {
        content: {
          'multipart/form-data': {
            schema: {
              type: 'object',
              properties: {
                images: {
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
  '/s_/banner/company/{id}': {
    get: {
      tags: ['banner'],
      parameters: [pathIDSchema],
      summary: 'company get banner by id',
      responses: response200
    },
    put: {
      tags: ['banner'],
      summary: 'company update banner',
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
                start_time: {
                  type: 'string'
                },
                end_time: {
                  type: 'string'
                },
                position: {
                  type: 'number',
                  enum: [1, 2, 3, 4, 5]
                },
                status: {
                  type: 'string',
                  enum: ['pending', 'disabled']
                }
              }
            }
          }
        },
        required: true
      },
      responses: {
        ...response200,
        '403': {
          description: '7001101 - banner has been approved or rejected'
        },
        '400': {
          description: '7001102 - banner cant change status after paid'
        },
        '404': {
          description: '7001100 - banner not found'
        }
      }
    },
    parameters: [pathIDSchema]
  },
  '/s_/banner/admin/{id}': {
    get: {
      tags: ['banner'],
      parameters: [pathIDSchema],
      summary: 'admin get banner by id',
      responses: response200
    },
    put: {
      tags: ['banner'],
      summary: 'admin update banner',
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
                start_time: {
                  type: 'string'
                },
                end_time: {
                  type: 'string'
                },
                position: {
                  type: 'number',
                  enum: [1, 2, 3, 4, 5]
                },
                status: {
                  type: 'string',
                  enum: ['pending', 'disabled', 'approved']
                }
              }
            }
          }
        },
        required: true
      },
      responses: {
        ...response200,
        '404': {
          description: '7001100 - banner not found'
        }
      }
    },
    parameters: [pathIDSchema]
  },
  '/s_/banner/{id}': {
    get: {
      tags: ['banner'],
      parameters: [pathIDSchema],
      summary: 'get banner by id',
      responses: response200
    }
  },
  '/s_/banner/admin/approve/{id}': {
    put: {
      tags: ['banner'],
      parameters: [pathIDSchema],
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
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
      summary: 'admin get banner by id',
      responses: {
        ...response200,
        '403': {
          description:
            '7001101 - banner has been approved or rejected \n 7000610 - company dont have enough money for payment'
        }
      }
    }
  },
  '/s_/banner/admin': {
    get: {
      summary: 'admin get banner',
      tags: ['banner'],
      parameters: [
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
          name: 'status',
          in: 'query',
          required: false,
          schema: {
            type: 'string',
            enum: ['pending', 'approved', 'disabled']
          }
        },
        {
          name: 'active',
          in: 'query',
          required: false,
          schema: {
            type: 'boolean'
          }
        },
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
          name: 'is_admin_posted',
          in: 'query',
          required: false,
          schema: {
            type: 'boolean'
          }
        },
        {
          name: 'custom_status',
          in: 'query',
          required: false,
          schema: {
            type: 'boolean',
            enum: ['upcoming', 'expired', 'running', 'created', 'started', 'ended']
          },
          description: 'status "created started ended" is based on start_time, end_time'
        }
      ],
      responses: response200
    },
    post: {
      tags: ['banner'],
      summary: 'admin post banner',
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['image', 'name', 'start_time', 'end_time', 'position'],
              properties: {
                name: {
                  type: 'string'
                },
                image: {
                  type: 'string'
                },
                start_time: {
                  type: 'string'
                },
                end_time: {
                  type: 'string'
                },
                position: {
                  type: 'number',
                  enum: [1, 2, 3, 4, 5]
                },
                status: {
                  type: 'string',
                  enum: ['pending', 'disabled', 'approved']
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
