import { selectSchema, pageSchema, sortSchema, limitSchema } from '../commons/find.schema';
import {
  Statuses,
  Roles,
  MallStaffStatuses,
  MallStaffRoles,
  UpdateStaffRoles
} from '../../search/sum-mall/staff/staff.config';
import { response200, response201 } from '../commons/responses.schema';
import { pathIDSchema } from '../commons/path-id.schema';

const periodTime = {
  type: 'object',
  properties: {
    from: {
      type: 'number',
      required: true
    },
    to: {
      type: 'number',
      required: true
    }
  }
};

const workShifts = {
  type: 'array',
  items: periodTime,
  required: true
};

export default {
  '/s_/sum-mall/staff/admin': {
    get: {
      summary: 'Admin get all staff',
      tags: ['mall-staff'],
      parameters: [
        pageSchema,
        selectSchema,
        sortSchema,
        limitSchema,
        {
          name: 'status',
          in: 'query',
          required: false,
          schema: {
            type: 'string',
            enum: Object.values(MallStaffStatuses)
          }
        },
        {
          name: 'mall_id',
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
          name: 'roles',
          in: 'query',
          required: false,
          schema: {
            type: 'string',
            enum: Object.values(MallStaffRoles)
          }
        }
      ],
      responses: response200
    }
  },
  '/s_/sum-mall/staff/admin/{id}': {
    get: {
      summary: 'Admin get staff by id',
      tags: ['mall-staff'],
      parameters: [selectSchema],
      responses: response200
    },
    put: {
      summary: 'Admin update manager status',
      tags: ['mall-staff'],
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                status: {
                  type: 'string',
                  required: true,
                  enum: Object.values(MallStaffStatuses)
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
  '/s_/sum-mall/staff/admin/search': {
    get: {
      summary: 'Admin search staff',
      tags: ['mall-staff'],
      parameters: [
        limitSchema,
        pageSchema,
        {
          name: 'staff_name',
          in: 'query',
          required: false,
          schema: { type: 'string' }
        }
      ],
      responses: response200
    }
  },
  '/s_/sum-mall/staff/mall': {
    get: {
      summary: 'Manager get all staff',
      tag: ['mall-staff'],
      parameters: [
        selectSchema,
        pageSchema,
        sortSchema,
        limitSchema,
        {
          name: 'status',
          in: 'query',
          required: false,
          schema: {
            type: 'string',
            enum: Object.values(MallStaffStatuses)
          }
        },
        {
          name: 'roles',
          in: 'query',
          required: false,
          schema: {
            type: 'string',
            enum: Object.values(MallStaffRoles)
          }
        },
        {
          name: 'user_id',
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
      summary: 'Manager create staff',
      tags: ['mall-staff'],
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                roles: {
                  type: 'array',
                  items: {
                    type: 'string',
                    enum: Object.values(UpdateStaffRoles)
                  },
                  required: true
                },
                user_id: {
                  type: 'string',
                  required: true
                },
                salary_per_hour: {
                  type: 'number',
                  required: true
                },
                schedule: {
                  type: 'object',
                  properties: {
                    monday: workShifts,
                    tuesday: workShifts,
                    wednesday: workShifts,
                    thursday: workShifts,
                    friday: workShifts,
                    saturday: workShifts,
                    sunday: workShifts
                  }
                }
              }
            }
          }
        }
      },
      responses: response201
    }
  },
  '/s_/sum-mall/staff/mall/{id}': {
    get: {
      summary: 'Manager get staff by id',
      tags: ['mall-staff'],
      parameters: [selectSchema],
      responses: response200
    },
    put: {
      summary: 'Mall update staff',
      tags: ['mall-staff'],
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                status: {
                  type: 'string',
                  enum: Object.values(MallStaffStatuses)
                },
                salary_per_hour: {
                  type: 'number'
                },
                roles: {
                  type: 'array',
                  items: {
                    type: 'string',
                    enum: Object.values(UpdateStaffRoles)
                  }
                },
                schedule: {
                  type: 'object',
                  properties: {
                    monday: workShifts,
                    tuesday: workShifts,
                    wednesday: workShifts,
                    thursday: workShifts,
                    friday: workShifts,
                    saturday: workShifts,
                    sunday: workShifts
                  }
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
  '/s_/sum-mall/staff/mall/search': {
    get: {
      summary: 'Manager search staff',
      tags: ['mall-staff'],
      parameters: [
        pageSchema,
        selectSchema,
        sortSchema,
        limitSchema,
        {
          name: 'staff_name',
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
  '/s_/sum-mall/staff/staff': {
    get: {
      summary: 'Staff get all staff info',
      tags: ['mall-staff'],
      parameters: [
        limitSchema,
        pageSchema,
        sortSchema,
        selectSchema,
        {
          name: 'status',
          in: 'query',
          required: false,
          schema: {
            type: 'string',
            enum: Object.values(MallStaffStatuses)
          }
        },
        {
          name: 'roles',
          in: 'query',
          required: false,
          schema: {
            type: 'string',
            enum: Object.values(MallStaffRoles)
          }
        }
      ],
      responses: response200
    }
  },
  '/s_/sum-mall/staff/staff/me': {
    get: {
      summary: 'Staff get own info',
      tags: ['mall-staff'],
      responses: response200
    }
  },
  '/s_/sum-mall/staff/staff/{id}': {
    get: {
      summary: 'Staff get info by id ',
      tags: ['mall-staff'],
      parameters: [selectSchema],
      responses: response200
    },
    parameters: [pathIDSchema]
  }
};
