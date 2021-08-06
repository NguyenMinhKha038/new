import { selectSchema, pageSchema, sortSchema, limitSchema } from '../commons/find.schema';
import { response200, response201 } from '../commons/responses.schema';
import { pathIDSchema } from '../commons/path-id.schema';
import {
  CheckInRoles,
  CheckInStatuses
} from '../../search/sum-mall/staff-check-in/staff-check-in.config';

export default {
  '/s_/sum-mall/staff-check-in/admin': {
    get: {
      summary: 'Admin get all mall staff check in',
      tags: ['staff-check-in'],
      parameters: [
        selectSchema,
        pageSchema,
        sortSchema,
        limitSchema,
        {
          name: 'mall_id',
          in: 'query',
          required: false,
          schema: {
            type: 'string'
          }
        },
        {
          name: 'staff_id',
          in: 'query',
          required: false,
          schema: {
            type: 'string'
          }
        },
        {
          name: 'is_finish',
          in: 'query',
          required: false,
          schema: {
            type: 'boolean'
          }
        },
        {
          name: 'check_in_by',
          in: 'query',
          required: false,
          schema: {
            type: 'string',
            enum: Object.values(CheckInRoles)
          }
        },
        {
          name: 'status',
          in: 'query',
          required: false,
          schema: {
            type: 'string',
            enum: Object.values(CheckInStatuses)
          }
        },
        {
          name: 'from',
          in: 'query',
          required: false,
          schema: {
            type: 'string'
          }
        },
        {
          name: 'to',
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
  '/s_/sum-mall/staff-check-in/admin/{id}': {
    get: {
      summary: 'Admin get check in by id',
      tags: ['staff-check-in'],
      parameters: [selectSchema],
      responses: response200
    },
    parameters: [pathIDSchema]
  },
  '/s_/sum-mall/staff-check-in/mall': {
    get: {
      summary: 'Mall get all check in',
      tags: ['staff-check-in'],
      parameters: [
        selectSchema,
        pageSchema,
        sortSchema,
        limitSchema,
        {
          name: 'staff_id',
          in: 'query',
          required: false,
          schema: {
            type: 'string'
          }
        },
        {
          name: 'is_finish',
          in: 'query',
          required: false,
          schema: {
            type: 'boolean'
          }
        },
        {
          name: 'check_in_by',
          in: 'query',
          required: false,
          schema: {
            type: 'string',
            enum: Object.values(CheckInRoles)
          }
        },
        {
          name: 'status',
          in: 'query',
          required: false,
          schema: {
            type: 'string',
            enum: Object.values(CheckInStatuses)
          }
        },
        {
          name: 'from',
          in: 'query',
          required: false,
          schema: {
            type: 'string'
          }
        },
        {
          name: 'to',
          in: 'query',
          required: false,
          schema: {
            type: 'string'
          }
        }
      ],
      responses: response200
    },
    post: {
      summary: 'Mall check in for staff',
      tags: ['staff-check-in'],
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                check_in_id: {
                  type: 'string',
                  required: true
                }
              }
            }
          }
        }
      },
      responses: response201
    }
  },
  '/s_/sum-mall/staff-check-in/mall/{id}': {
    get: {
      summary: 'Mall get check in by id',
      tags: ['staff-check-in'],
      parameters: [selectSchema],
      responses: response200
    },
    put: {
      summary: 'Mall update check in by id',
      tags: ['staff-check-in'],
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                status: {
                  type: 'string',
                  enum: [CheckInStatuses.Active, CheckInStatuses.ManagerDisabled],
                  required: true
                }
              }
            }
          }
        }
      },
      responses: response200
    },
    parameters: [pathIDSchema]
  },
  '/s_/sum-mall/staff-check-in/mall/checkout/{id}': {
    get: {
      summary: 'Mall checkout for staff',
      tags: ['staff-check-in'],
      responses: response200
    },
    parameters: [pathIDSchema]
  },
  '/s_/sum-mall/staff-check-in/staff': {
    get: {
      summary: 'Staff get all check in',
      tags: ['staff-check-in'],
      parameters: [
        selectSchema,
        sortSchema,
        pageSchema,
        limitSchema,
        {
          name: 'is_finish',
          in: 'query',
          required: false,
          schema: {
            type: 'boolean'
          }
        },
        {
          name: 'check_in_by',
          in: 'query',
          required: false,
          schema: {
            type: 'string',
            enum: Object.values(CheckInRoles)
          }
        },
        {
          name: 'status',
          in: 'query',
          required: false,
          schema: {
            type: 'string',
            enum: Object.values(CheckInStatuses)
          }
        },
        {
          name: 'from',
          in: 'query',
          required: false,
          schema: {
            type: 'string'
          }
        },
        {
          name: 'to',
          in: 'query',
          required: false,
          schema: {
            type: 'string'
          }
        }
      ],
      responses: response200
    },
    post: {
      summary: 'Staff check in',
      tags: ['staff-check-in'],
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                check_in_id: {
                  type: 'string',
                  required: true
                }
              }
            }
          }
        }
      },
      responses: response201
    }
  },
  '/s_/sum-mall/staff-check-in/staff/{id}': {
    get: {
      summary: 'Staff get check in by id',
      tags: ['staff-check-in'],
      requestBody: {
        content: {
          'application/json': {
            schema: {
              check_in_id: {
                type: 'string',
                required: true
              }
            }
          }
        }
      },
      responses: response200
    },
    parameters: [pathIDSchema]
  },
  '/s_/sum-mall/staff-check-in/staff/checkout/{id}': {
    get: {
      summary: 'Staff check out',
      tags: ['staff-check-in'],
      responses: response200
    },
    parameters: [pathIDSchema]
  }
};
