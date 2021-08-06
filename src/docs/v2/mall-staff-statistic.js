import { limitSchema, pageSchema, selectSchema, sortSchema } from '../commons/find.schema';
import { response200 } from '../commons/responses.schema';

export default {
  '/s_/sum-mall/mall-staff-statistic/admin': {
    get: {
      summary: 'Admin get all staff statistic',
      tags: ['mall-staff-statistic'],
      parameters: [
        selectSchema,
        sortSchema,
        pageSchema,
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
          name: 'mall_id',
          in: 'query',
          required: false,
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
    }
  },
  '/s_/sum-mall/mall-staff-statistic/mall': {
    get: {
      summary: 'Mall get all staff statistic',
      tags: ['mall-staff-statistic'],
      parameters: [
        selectSchema,
        sortSchema,
        pageSchema,
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
  '/s_/sum-mall/mall-staff-statistic/staff': {
    get: {
      summary: 'Admin get all staff statistic',
      tags: ['mall-staff-statistic'],
      parameters: [
        selectSchema,
        sortSchema,
        pageSchema,
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
  }
};
