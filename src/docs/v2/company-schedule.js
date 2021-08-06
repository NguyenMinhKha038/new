import {
  selectSchema,
  sortSchema,
  pageSchema,
  limitSchema,
  populateSchema
} from '../commons/find.schema';
import { MallStatuses } from '../../search/sum-mall/mall/mall.config';
import { response200, response201 } from '../commons/responses.schema';
import { pathIDSchema } from '../commons/path-id.schema';
import { ScheduleStatuses } from '../../search/company-schedule/company-schedule.config';

const periodTime = {
  type: 'object',
  properties: {
    from: {
      type: 'number',
      required: true,
      min: 0,
      max: 24
    },
    to: {
      type: 'number',
      required: true,
      min: 0,
      max: 24
    }
  }
};

const weekDay = {
  type: 'array',
  items: periodTime
};

export default {
  '/s_/company-schedule/admin': {
    get: {
      summary: 'Admin get all company schedules',
      tags: ['company-schedule'],
      parameters: [
        pageSchema,
        sortSchema,
        selectSchema,
        limitSchema,
        populateSchema,
        {
          name: 'company_id',
          required: false,
          in: 'query',
          schema: {
            type: 'string'
          }
        },
        {
          name: 'store_id',
          required: false,
          in: 'query',
          schema: {
            type: 'string'
          }
        },
        {
          name: 'user_id',
          required: false,
          in: 'query',
          schema: {
            type: 'string'
          }
        },
        {
          name: 'permission_group_id',
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
            enum: Object.values(ScheduleStatuses)
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
  '/s_/company-schedule/admin/{id}': {
    get: {
      summary: 'Admin get company schedule by id',
      tags: ['company-schedule'],
      parameters: [selectSchema, populateSchema],
      responses: response200
    },
    parameters: [pathIDSchema]
  },
  '/s_/company-schedule/company': {
    get: {
      summary: 'Company get all company schedules',
      tags: ['company-schedule'],
      parameters: [
        pageSchema,
        limitSchema,
        sortSchema,
        selectSchema,
        populateSchema,
        {
          name: 'status',
          in: 'query',
          required: false,
          schema: {
            type: 'string',
            enum: Object.values(ScheduleStatuses)
          }
        },
        {
          name: 'permission_group_id',
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
          name: 'user_id',
          required: false,
          in: 'query',
          schema: {
            type: 'string'
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
      summary: 'Company create company schedule',
      tags: ['company-schedule'],
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                permission_group_id: {
                  type: 'string',
                  required: true
                },
                schedule: {
                  type: 'object',
                  properties: {
                    monday: weekDay,
                    tuesday: weekDay,
                    wednesday: weekDay,
                    thursday: weekDay,
                    friday: weekDay,
                    saturday: weekDay,
                    sunday: weekDay
                  }
                },
                date: {
                  type: 'string',
                  required: false
                },
                work_shifts: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      from: {
                        type: 'number',
                        required: true,
                        min: 0,
                        max: 24
                      },
                      to: {
                        type: 'number',
                        required: true,
                        min: 0,
                        max: 24
                      }
                    }
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
  '/s_/company-schedule/company/{id}': {
    get: {
      summary: 'Company get company schedule by id',
      tags: ['company-schedule'],
      parameters: [selectSchema, populateSchema],
      responses: response200
    },
    put: {
      summary: 'Admin update company schedule',
      tags: ['company-schedule'],
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                work_shifts: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      from: {
                        type: 'number',
                        required: true,
                        min: 0,
                        max: 24
                      },
                      to: {
                        type: 'number',
                        required: true,
                        min: 0,
                        max: 24
                      }
                    }
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
  '/s_/company-schedule/company/status/{id}': {
    put: {
      summary: 'Company update company schedule status',
      tags: ['company-schedule'],
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                status: {
                  type: 'string',
                  required: true,
                  enum: [ScheduleStatuses.Active, ScheduleStatuses.ManagerDisabled]
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
  '/s_/company-schedule/staff': {
    get: {
      summary: 'Staff get all company schedules',
      tags: ['company-schedule'],
      parameters: [
        pageSchema,
        selectSchema,
        sortSchema,
        limitSchema,
        {
          name: 'from',
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
            enum: Object.values(ScheduleStatuses)
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
      summary: 'Staff update company schedules',
      tags: ['company-schedule'],
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                schedule: {
                  type: 'object',
                  properties: {
                    monday: weekDay,
                    tuesday: weekDay,
                    wednesday: weekDay,
                    thursday: weekDay,
                    friday: weekDay,
                    saturday: weekDay,
                    sunday: weekDay
                  },
                  required: true
                }
              }
            }
          }
        }
      },
      responses: response200
    }
  },
  '/s_/company-schedule/staff/{id}': {
    get: {
      summary: 'Staff get company schedule by id',
      tags: ['company-schedule'],
      parameters: [selectSchema],
      responses: response200
    },
    parameters: [pathIDSchema]
  },
  '/s_/company-schedule/staff/status/{id}': {
    put: {
      summary: 'Staff update company schedule status',
      tags: ['company-schedule'],
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                status: {
                  type: 'string',
                  required: true,
                  enum: [ScheduleStatuses.Active, ScheduleStatuses.Disabled]
                }
              }
            }
          }
        }
      },
      responses: response200
    },
    parameters: [pathIDSchema]
  }
};
