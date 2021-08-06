import { selectSchema, pageSchema, sortSchema, limitSchema } from '../commons/find.schema';
import { response200, response201 } from '../commons/responses.schema';
import { pathIDSchema } from '../commons/path-id.schema';
import { ScheduleStatuses } from '../../search/sum-mall/work-schedule/work-schedule.config';

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
  '/s_/sum-mall/work-schedule/admin': {
    get: {
      summary: 'Admin get all schedule',
      tags: ['work-schedule'],
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
          name: 'status',
          in: 'query',
          required: false,
          schema: {
            type: 'string'
          },
          enum: Object.values(ScheduleStatuses)
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
            type: 'string '
          }
        }
      ],
      responses: response200
    }
  },
  '/s_/sum-mall/work-schedule/admin/{id}': {
    get: {
      summary: 'Admin get schedule by id',
      tags: ['work-schedule'],
      parameters: [selectSchema],
      responses: response200
    },
    parameters: [pathIDSchema]
  },
  '/s_/sum-mall/work-schedule/mall': {
    get: {
      summary: 'Mall get all schedule',
      tags: ['work-schedule'],
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
          name: 'status',
          in: 'query',
          required: false,
          schema: {
            type: 'string'
          },
          enum: Object.values(ScheduleStatuses)
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
            type: 'string '
          }
        }
      ],
      responses: response200
    },
    post: {
      summary: "Mall create staff's schedule at a specific date or create schedule for next week",
      tags: ['work-schedule'],
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                staff_id: {
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
                    properties: periodTime
                  }
                }
              }
            }
          }
        }
      },
      responses: response201
    },
    put: {
      summary: 'Mall update work shift of schedule in specific date by id',
      tags: ['work-schedule'],
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                staff_id: {
                  type: 'string'
                },
                update: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: {
                        type: 'string',
                        required: false
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
                        },
                        required: true
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
    }
  },
  '/s_/sum-mall/work-schedule/mall/{id}': {
    get: {
      summary: 'Mall get schedule by id',
      tags: ['work-schedule'],
      parameters: [selectSchema],
      responses: response200
    },
    parameters: [pathIDSchema]
  },
  '/s_/sum-mall/work-schedule/mall/status/{id}': {
    put: {
      summary: 'Mall update schedule status',
      tags: ['work-schedule'],
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
  '/s_/sum-mall/work-schedule/staff': {
    get: {
      summary: 'Staff get own schedule',
      tags: ['work-schedule'],
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
    },
    put: {
      summary: 'Staff update schedule by id',
      tags: ['work-schedule'],
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
                  }
                },
                status: {
                  type: 'string',
                  enum: [ScheduleStatuses.Active, ScheduleStatuses.Disabled]
                }
              }
            }
          }
        }
      },
      responses: response200
    }
  },
  '/s_/sum-mall/work-schedule/staff/{id}': {
    get: {
      summary: 'Staff get schedule by id',
      tags: ['work-schedule'],
      parameters: [selectSchema],
      responses: response200
    },
    parameters: [pathIDSchema]
  },
  '/s_/sum-mall/work-schedule/staff/status/{id}': {
    put: {
      summary: 'Staff update schedule by id',
      tags: ['work-schedule'],
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
