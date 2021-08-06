import findSchema from '../commons/find.schema';
import { response200 } from '../commons/responses.schema';

export default {
  '/s_/revenue/company': {
    get: {
      tags: ['revenue'],
      summary: 'company get revenue',
      parameters: [...findSchema],
      responses: response200
    }
  },
  '/s_/revenue/company/total': {
    get: {
      tags: ['revenue'],
      parameters: [
        {
          name: 'start_time',
          required: true,
          in: 'query',
          schema: {
            type: 'string'
          }
        },
        {
          name: 'end_time',
          required: true,
          in: 'query',
          schema: {
            type: 'string'
          }
        }
      ],
      responses: response200
    }
  },
  '/s_/revenue/company/statics': {
    get: {
      tags: ['revenue'],
      parameters: [
        {
          name: 'start_time',
          required: true,
          in: 'query',
          schema: {
            type: 'string'
          }
        },
        {
          name: 'end_time',
          required: true,
          in: 'query',
          schema: {
            type: 'string'
          }
        }
      ],
      responses: response200
    }
  },
  '/s_/revenue/company/statics-store': {
    get: {
      tags: ['revenue'],
      parameters: [
        {
          name: 'start_time',
          required: true,
          in: 'query',
          schema: {
            type: 'string'
          }
        },
        {
          name: 'end_time',
          required: true,
          in: 'query',
          schema: {
            type: 'string'
          }
        }
      ],
      responses: response200
    }
  },
  '/s_/revenue/company/statics-store-dates': {
    get: {
      tags: ['revenue'],
      parameters: [
        {
          name: 'start_time',
          required: true,
          in: 'query',
          schema: {
            type: 'string'
          }
        },
        {
          name: 'end_time',
          required: true,
          in: 'query',
          schema: {
            type: 'string'
          }
        },
        {
          name: 'store_id',
          required: true,
          in: 'query',
          schema: {
            type: 'string'
          }
        }
      ],
      responses: response200
    }
  },
  '/s_/revenue/admin': {
    get: {
      tags: ['revenue'],
      summary: 'company get revenue',
      parameters: [...findSchema],
      responses: response200
    }
  },
  '/s_/revenue/admin/statistic-company-date': {
    get: {
      tags: ['revenue'],
      parameters: [
        {
          name: 'start_time',
          required: true,
          in: 'query',
          schema: {
            type: 'string'
          }
        },
        {
          name: 'end_time',
          required: true,
          in: 'query',
          schema: {
            type: 'string'
          }
        },
        {
          name: 'company_id',
          required: true,
          in: 'query',
          schema: {
            type: 'string'
          }
        }
      ],
      responses: response200
    }
  },
  '/s_/revenue/company/menu/period': {
    get: {
      tags: ['revenue'],
      summary: 'menu revenue by time (date to date)',
      parameters: [
        {
          name: 'start_time',
          required: true,
          in: 'query',
          schema: {
            type: 'string'
          }
        },
        {
          name: 'end_time',
          required: true,
          in: 'query',
          schema: {
            type: 'string'
          }
        },
        {
          name: 'store_id',
          required: true,
          in: 'query',
          schema: {
            type: 'string'
          }
        },
        {
          name: 'date_order',
          required: true,
          in: 'query',
          schema: {
            type: 'string',
            enum: ['decreasing', 'increasing']
          }
        }
      ],
      responses: response200
    }
  },
  '/s_/revenue/company/menu/date': {
    get: {
      tags: ['revenue'],
      summary: 'menu revenue by specific date',
      parameters: [
        {
          name: 'date',
          required: true,
          in: 'query',
          schema: {
            type: 'string'
          }
        },
        {
          name: 'store_id',
          required: true,
          in: 'query',
          schema: {
            type: 'string'
          }
        },
        {
          name: 'sort',
          required: true,
          in: 'query',
          schema: {
            type: 'string'
          }
        }
      ],
      responses: response200
    }
  }
};
