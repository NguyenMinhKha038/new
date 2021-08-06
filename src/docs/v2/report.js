import findSchema from '../commons/find.schema';
import { response200, response201 } from '../commons/responses.schema';
import pathIDSchema from '../commons/path-id.schema';

export default {
  '/s_/report/user': {
    get: {
      tags: ['report'],
      summary: 'User get reports by query.',
      description: 'User get reports by query.',
      parameters: [
        ...findSchema,
        {
          name: 'email',
          in: 'query',
          required: false,
          schema: {
            type: 'string'
          }
        },
        {
          name: 'statuses',
          in: 'query',
          required: false,
          schema: {
            type: 'string',
            enum: ['pending', 'handling', 'handled'],
            example: 'pending, handling'
          }
        },
        {
          name: 'reporter_type',
          in: 'query',
          required: false,
          schema: {
            type: 'string',
            enum: ['user', 'company']
          }
        },
        {
          name: 'type',
          in: 'query',
          required: false,
          schema: {
            type: 'string',
            enum: [
              'general',
              'payment',
              'delivery',
              'order',
              'product',
              'experience',
              'security',
              'refund',
              'promotion',
              'other',
              'campaign',
              'legal',
              'performance'
            ]
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
      tags: ['report'],
      summary: 'User submit a report.',
      description: 'User submit a report.',
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                email: {
                  type: 'string',
                  required: true
                },
                reporter_type: {
                  type: 'string',
                  enum: ['user', 'company']
                },
                type: {
                  type: 'string',
                  enum: [
                    'general',
                    'payment',
                    'delivery',
                    'order',
                    'product',
                    'experience',
                    'security',
                    'refund',
                    'promotion',
                    'other',
                    'campaign',
                    'legal',
                    'performance'
                  ],
                  required: true
                },
                content: {
                  type: 'string',
                  minLength: 10,
                  maxLength: 4000,
                  required: true
                },
                language: {
                  type: 'string',
                  enum: ['en', 'vi']
                },
                images: {
                  type: 'array',
                  items: {
                    type: 'string'
                  },
                  maxItems: 5
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
  '/s_/report/user/{id}': {
    get: {
      tags: ['report'],
      summary: 'User get report by id.',
      description: 'User get report by id.',
      parameters: [pathIDSchema],
      responses: response200
    }
  },
  '/s_/report/admin': {
    get: {
      tags: ['report'],
      summary: 'Admin get reports by query.',
      description: 'Admin get reports by query.',
      parameters: [
        ...findSchema,
        {
          name: 'email',
          in: 'query',
          required: false,
          schema: {
            type: 'string'
          }
        },
        {
          name: 'statuses',
          in: 'query',
          required: false,
          schema: {
            type: 'string',
            enum: ['pending', 'handling', 'handled', 'hidden'],
            example: 'pending, handling'
          }
        },
        {
          name: 'reporter_type',
          in: 'query',
          required: false,
          schema: {
            type: 'string',
            enum: ['user', 'company']
          }
        },
        {
          name: 'type',
          in: 'query',
          required: false,
          schema: {
            type: 'string',
            enum: [
              'general',
              'payment',
              'delivery',
              'order',
              'product',
              'experience',
              'security',
              'refund',
              'promotion',
              'other',
              'campaign',
              'legal',
              'performance'
            ]
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
        },
        {
          name: 'email',
          in: 'query',
          required: false,
          schema: {
            type: 'string'
          }
        },
        {
          name: 'statuses',
          in: 'query',
          required: false,
          schema: {
            type: 'string',
            enum: ['pending', 'handling', 'handled', 'hidden'],
            example: 'pending, handling'
          }
        },
        {
          name: 'reporter_type',
          in: 'query',
          required: false,
          schema: {
            type: 'string',
            enum: ['user', 'company']
          }
        },
        {
          name: 'type',
          in: 'query',
          required: false,
          schema: {
            type: 'string',
            enum: [
              'general',
              'payment',
              'delivery',
              'order',
              'product',
              'experience',
              'security',
              'refund',
              'promotion',
              'other',
              'campaign',
              'legal',
              'performance'
            ]
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
          name: 'admin_id',
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
  '/s_/report/admin/confirm': {
    post: {
      tags: ['report'],
      description: "Admin confirm user's report",
      summary: "Admin confirm user's report",
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                report_id: {
                  type: 'string',
                  required: true
                },
                response: {
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
  '/s_/report/admin/{id}': {
    get: {
      tags: ['report'],
      summary: 'Admin get report by id.',
      description: 'Admin get report by id.',
      parameters: [pathIDSchema],
      responses: response200
    },
    put: {
      tags: ['report'],
      summary: 'Admin update report by id.',
      description: 'Admin update report by id.',
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                status: {
                  type: 'string',
                  enum: ['handled', 'hidden']
                },
                response: {
                  type: 'string'
                },
                hidden_reason: {
                  type: 'string'
                }
              }
            }
          }
        },
        required: true
      },
      parameters: [pathIDSchema],
      responses: response200
    }
  }
};
