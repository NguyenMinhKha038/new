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
import { Levels, ScheduleStatuses } from '../../search/company-schedule/company-schedule.config';
import { query } from 'express';

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
  '/s_/company-schedule/v2/admin': {
    get: {
      summary: 'Admin get all company schedules',
      tags: ['company-schedule-v2'],
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
        },
        {
          name: 'level',
          in: 'query',
          required: false,
          schema: {
            type: 'string',
            enum: Object.values(Levels)
          }
        }
      ],
      responses: response200
    }
  },
  '/s_/company-schedule/v2/company': {
    get: {
      summary: 'Company get all company schedules',
      tags: ['company-schedule-v2'],
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
        },
        {
          name: 'level',
          in: 'query',
          required: false,
          schema: {
            type: 'string',
            enum: Object.values(Levels)
          }
        }
      ],
      responses: response200
    },
    post: {
      summary: 'Company create company schedule',
      tags: ['company-schedule-v2'],
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
                details: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
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
            }
          }
        }
      },
      responses: response201
    },
    put: {
      summary: 'Company update schedules for staff',
      tags: ['company-schedule-v2'],
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                permission_group_id: {
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
  }
};
