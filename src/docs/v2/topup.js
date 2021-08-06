import findSchema from '../commons/find.schema';
import pathIDSchema from '../commons/path-id.schema';
import { response200 } from '../commons/responses.schema';

export default {
  's_/topup/admin': {
    get: {
      tags: ['topup'],
      description: 'admin get topups',
      parameters: [
        ...findSchema,
        {
          name: 'publisher',
          in: 'query',
          required: false,
          schema: {
            type: 'string',
            enum: ['VTT', 'VNM', 'VNP', 'VMS', 'GMB']
          }
        },
        {
          name: 'amount',
          in: 'query',
          required: false,
          schema: {
            type: 'number',
            enum: [30000, 50000, 100000, 200000, 300000, 500000]
          }
        },
        {
          name: 'combo',
          in: 'query',
          required: false,
          schema: {
            type: 'string',
            enum: ['three_month', 'six_month', 'twelve_month']
          }
        },
        {
          name: 'type',
          in: 'query',
          required: false,
          schema: {
            type: 'string',
            enum: ['fast', 'slow']
          }
        },
        {
          name: 'combo_id',
          in: 'query',
          required: false,
          schema: {
            type: 'string'
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
          name: 'in_combo',
          in: 'query',
          required: false,
          schema: {
            type: 'boolean'
          }
        },
        {
          name: 'populate',
          in: 'query',
          required: false,
          schema: {
            type: 'string',
            example: 'user'
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
        }
      ],
      responses: response200
    }
  },
  's_/topup/admin/{id}': {
    get: {
      tags: ['topup'],
      description: 'user get topup by id',
      parameters: [
        pathIDSchema,
        {
          name: 'populate',
          in: 'query',
          required: false,
          schema: {
            type: 'string',
            example: 'user'
          }
        }
      ],
      responses: response200
    }
  },
  's_/topup/admin/combo': {
    get: {
      tags: ['topup'],
      description: 'admin get combos',
      parameters: [
        ...findSchema,
        {
          name: 'user_id',
          in: 'query',
          required: false,
          schema: {
            type: 'string'
          }
        },
        {
          name: 'publisher',
          in: 'query',
          required: false,
          schema: {
            type: 'string',
            enum: ['VTT', 'VNM', 'VNP', 'VMS', 'GMB']
          }
        },
        {
          name: 'amount',
          in: 'query',
          required: false,
          schema: {
            type: 'number',
            enum: [30000, 50000, 100000, 200000, 300000, 500000]
          }
        },
        {
          name: 'combo',
          in: 'query',
          required: false,
          schema: {
            type: 'string',
            enum: ['three_month', 'six_month', 'twelve_month']
          }
        },
        {
          name: 'type',
          in: 'query',
          required: false,
          schema: {
            type: 'string',
            enum: ['fast', 'slow']
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
          name: 'populate',
          in: 'query',
          required: false,
          schema: {
            type: 'string',
            example: 'user'
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
        }
      ],
      responses: response200
    }
  },
  's_/topup/admin/combo/{id}': {
    get: {
      tags: ['topup'],
      description: 'user get combo by id',
      parameters: [
        pathIDSchema,
        {
          name: 'populate',
          in: 'query',
          required: false,
          schema: {
            type: 'string',
            example: 'user'
          }
        }
      ],
      responses: response200
    }
  },
  's_/topup/user': {
    get: {
      tags: ['topup'],
      description: 'user get topups',
      parameters: [
        ...findSchema,
        {
          name: 'publisher',
          in: 'query',
          required: false,
          schema: {
            type: 'string',
            enum: ['VTT', 'VNM', 'VNP', 'VMS', 'GMB']
          }
        },
        {
          name: 'amount',
          in: 'query',
          required: false,
          schema: {
            type: 'number',
            enum: [30000, 50000, 100000, 200000, 300000, 500000]
          }
        },
        {
          name: 'combo',
          in: 'query',
          required: false,
          schema: {
            type: 'string',
            enum: ['three_month', 'six_month', 'twelve_month']
          }
        },
        {
          name: 'type',
          in: 'query',
          required: false,
          schema: {
            type: 'string',
            enum: ['fast', 'slow']
          }
        },
        {
          name: 'combo_id',
          in: 'query',
          required: false,
          schema: {
            type: 'string'
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
          name: 'in_combo',
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
        }
      ],
      responses: response200
    }
  },
  's_/topup/user/{id}': {
    get: {
      tags: ['topup'],
      description: 'user get topup by id',
      parameters: [pathIDSchema],
      responses: response200
    }
  },
  's_/topup/user/combo': {
    get: {
      tags: ['topup'],
      description: 'admin get combo',
      parameters: [
        ...findSchema,

        {
          name: 'publisher',
          in: 'query',
          required: false,
          schema: {
            type: 'string',
            enum: ['VTT', 'VNM', 'VNP', 'VMS', 'GMB']
          }
        },
        {
          name: 'amount',
          in: 'query',
          required: false,
          schema: {
            type: 'number',
            enum: [30000, 50000, 100000, 200000, 300000, 500000]
          }
        },
        {
          name: 'combo',
          in: 'query',
          required: false,
          schema: {
            type: 'string',
            enum: ['three_month', 'six_month', 'twelve_month']
          }
        },
        {
          name: 'type',
          in: 'query',
          required: false,
          schema: {
            type: 'string',
            enum: ['fast', 'slow']
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
        }
      ],
      responses: response200
    }
  },
  's_/topup/user/combo/{id}': {
    get: {
      tags: ['topup'],
      description: 'user get combo by id',
      parameters: [pathIDSchema],
      responses: response200
    }
  },
  's_/topup/user/checkout': {
    post: {
      tags: ['topup'],
      description: 'user checkout payment info',
      requestBody: {
        content: {
          'application/json': {
            schema: {
              properties: {
                publisher: {
                  type: 'string',
                  enum: ['VTT', 'VNM', 'VNP', 'VMS', 'GMB']
                },
                amount: {
                  type: 'string',
                  enum: [30000, 50000, 100000, 200000, 300000, 500000]
                },
                type: {
                  type: 'string',
                  enum: ['fast', 'slow']
                },
                combo: {
                  type: 'string',
                  enum: ['three_month', 'six_month', 'twelve_month']
                }
              }
            }
          }
        }
      },
      responses: response200
    }
  },
  's_/topup/user/pay': {
    post: {
      tags: ['topup'],
      description: 'user pay topup',
      requestBody: {
        content: {
          'application/json': {
            schema: {
              properties: {
                publisher: {
                  type: 'string',
                  enum: ['VTT', 'VNM', 'VNP', 'VMS', 'GMB']
                },
                amount: {
                  type: 'string',
                  enum: [30000, 50000, 100000, 200000, 300000, 500000]
                },
                type: {
                  type: 'string',
                  enum: ['fast', 'slow']
                },
                receiver: {
                  type: 'string'
                },
                combo: {
                  type: 'string',
                  enum: ['three_month', 'six_month', 'twelve_month']
                }
              }
            }
          }
        }
      },
      responses: {
        ...response200,
        '403': {
          description: '7001803 partner_code 06 - phone or publisher not valid'
        }
      }
    }
  }
};
