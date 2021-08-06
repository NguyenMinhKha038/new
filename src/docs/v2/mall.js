import { selectSchema, sortSchema, pageSchema, limitSchema } from '../commons/find.schema';
import { MallStatuses } from '../../search/sum-mall/mall/mall.config';
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
    },
    active: {
      type: 'boolean',
      required: true
    }
  }
};

const workShifts = {
  type: 'object',
  properties: {
    work_shifts: {
      type: 'array',
      items: {
        type: 'object',
        properties: periodTime
      }
    }
  }
};

export default {
  '/s_/sum-mall/mall/admin/': {
    get: {
      summary: 'Admin get all mall',
      tags: ['mall'],
      parameters: [
        selectSchema,
        sortSchema,
        pageSchema,
        limitSchema,
        {
          name: 'manager_id',
          in: 'query',
          required: false,
          schema: {
            type: 'string'
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
          name: 'status',
          in: 'query',
          required: false,
          schema: {
            type: 'string',
            enum: Object.values(MallStatuses)
          }
        },
        {
          name: 'staff_register_schedule',
          in: 'query',
          required: false,
          schema: {
            type: 'boolean'
          }
        }
      ],
      responses: response200
    },
    post: {
      summary: 'Admin create mall',
      tags: ['mall'],
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                name: {
                  type: 'string',
                  required: true
                },
                address: {
                  type: 'object',
                  example: {
                    province: 'Hồ Chí Minh',
                    district: 'Quận 6',
                    ward: 'Phường 05',
                    text: 'Hẻm 203 Phan Văn Khỏe',
                    province_code: '79',
                    district_code: '775',
                    ward_code: '27361',
                    phone_number: '0962062515',
                    manager_name: 'ase'
                  },
                  properties: {
                    province: {
                      type: 'string',
                      required: 'true'
                    },
                    district: {
                      type: 'string',
                      required: 'true'
                    },
                    ward: {
                      type: 'string',
                      required: 'true'
                    },
                    province_code: {
                      type: 'string',
                      required: 'true'
                    },
                    district_code: {
                      type: 'string',
                      required: 'true'
                    },
                    ward_code: {
                      type: 'string',
                      required: 'true'
                    },
                    receiver: {
                      type: 'string',
                      required: 'true'
                    },
                    phone_number: {
                      type: 'string',
                      required: 'true'
                    }
                  },
                  required: true
                },
                description: {
                  type: 'string',
                  required: true
                },
                location: {
                  type: 'string',
                  required: true
                },
                weekly_work_shifts: {
                  type: 'object',
                  properties: {
                    monday: workShifts,
                    tuesday: workShifts,
                    wednesday: workShifts,
                    thursday: workShifts,
                    friday: workShifts,
                    saturday: workShifts,
                    sunday: workShifts
                  },
                  required: true
                },
                phone_number: {
                  type: 'string',
                  required: true
                },
                working_time: {
                  type: 'object',
                  properties: {
                    monday: periodTime,
                    tuesday: periodTime,
                    wednesday: periodTime,
                    thursday: periodTime,
                    friday: periodTime,
                    saturday: periodTime,
                    sunday: periodTime
                  },
                  required: true
                },
                email: {
                  type: 'string',
                  required: true
                },
                manager_id: {
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
  '/s_/sum-mall/mall/admin/{id}': {
    get: {
      summary: 'Admin get mall by id ',
      tags: ['mall'],
      parameters: [selectSchema],
      responses: response200
    },
    put: {
      summary: 'Admin update mall manager',
      tags: ['mall'],
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                manager_id: {
                  type: 'string',
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
  '/s_/sum-mall/mall/admin/search': {
    get: {
      summary: 'Admin search mall',
      tags: ['mall'],
      parameters: [
        {
          name: 'mall_name',
          in: 'query',
          required: false,
          schema: {
            type: 'string'
          }
        },
        limitSchema,
        pageSchema
      ],
      responses: response200
    }
  },
  '/s_/sum-mall/mall/admin/status/{id}': {
    put: {
      summary: 'Admin update mall status',
      tags: ['mall'],
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                status: {
                  type: 'string',
                  required: true,
                  enum: [MallStatuses.Active, MallStatuses.Active]
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
  '/s_/sum-mall/mall/mall': {
    get: {
      summary: 'Manager get mall',
      tags: ['mall'],
      parameters: [
        selectSchema,
        sortSchema,
        limitSchema,
        pageSchema,
        {
          name: 'status',
          in: 'query',
          required: false,
          schema: {
            type: 'string'
          }
        },
        {
          name: 'staff_register_schedule',
          in: 'query',
          required: false,
          schema: {
            type: 'boolean'
          }
        },
        {
          name: 'email',
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
  '/s_/sum-mall/mall/mall/{id}': {
    get: {
      summary: 'Manager get mall by id',
      tags: ['mall'],
      parameters: [selectSchema],
      responses: response200
    },
    put: {
      summary: 'Manager update mall',
      tags: ['mall'],
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                name: {
                  type: 'string'
                },
                description: {
                  type: 'string'
                },
                address: {
                  type: 'object',
                  properties: {
                    province: {
                      type: 'string',
                      required: 'true'
                    },
                    district: {
                      type: 'string',
                      required: 'true'
                    },
                    ward: {
                      type: 'string',
                      required: 'true'
                    },
                    province_code: {
                      type: 'string',
                      required: 'true'
                    },
                    district_code: {
                      type: 'string',
                      required: 'true'
                    },
                    ward_code: {
                      type: 'string',
                      required: 'true'
                    },
                    receiver: {
                      type: 'string',
                      required: 'true'
                    },
                    phone_number: {
                      type: 'string',
                      required: 'true'
                    }
                  }
                },
                location: {
                  type: 'string'
                },
                weekly_work_shifts: {
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
                },
                phone_number: {
                  type: 'string'
                },
                email: {
                  type: 'string'
                },
                working_time: {
                  type: 'object',
                  properties: {
                    monday: periodTime,
                    tuesday: periodTime,
                    wednesday: periodTime,
                    thursday: periodTime,
                    friday: periodTime,
                    saturday: periodTime,
                    sunday: periodTime
                  },
                  required: false
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
  '/s_/sum-mall/mall/mall/status/{id}': {
    put: {
      summary: 'Manager update mall status',
      tags: ['mall'],
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                status: {
                  type: 'string',
                  required: true,
                  enum: [MallStatuses.Active, MallStatuses.Disabled]
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
  '/s_/sum-mall/mall/': {
    get: {
      summary: 'Get mall active mall',
      tags: ['mall'],
      parameters: [
        pageSchema,
        selectSchema,
        sortSchema,
        limitSchema,
        {
          name: 'manager_id',
          in: 'query',
          required: false,
          schema: {
            type: 'string'
          }
        },
        {
          name: 'staff_register_schedule',
          in: 'query',
          required: false,
          schema: {
            type: 'boolean'
          }
        }
      ],
      responses: response200
    }
  },
  '/s_/sum-mall/mall/{id}': {
    get: {
      summary: 'Company get active mall by id',
      tags: ['mall'],
      parameters: [selectSchema],
      responses: response200
    },
    parameters: [pathIDSchema]
  },
  '/s_/sum-mall/mall/search': {
    get: {
      summary: 'Search active mall',
      tags: ['mall'],
      parameters: [
        limitSchema,
        pageSchema,
        {
          name: 'mall_name',
          in: 'query',
          required: false,
          schema: {
            type: 'string'
          }
        }
      ]
    }
  }
};
