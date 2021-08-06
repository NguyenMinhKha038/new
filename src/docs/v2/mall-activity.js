import { selectSchema, pageSchema, sortSchema, limitSchema } from '../commons/find.schema';
import { response200, response201 } from '../commons/responses.schema';
import { pathIDSchema } from '../commons/path-id.schema';
import { mallActions } from '../../search/sum-mall/mall-activity/mall-activity.config';

export default {
  '/s_/sum-mall/mall-activity/admin': {
    get: {
      summary: 'Admin get all mall activities',
      tags: ['mall-activity'],
      parameters: [
        selectSchema,
        pageSchema,
        sortSchema,
        selectSchema,
        {
          name: 'user_id',
          in: 'query',
          required: false,
          schema: {
            type: 'string'
          }
        },
        {
          name: 'resource',
          in: 'query',
          required: false,
          schema: {
            type: 'string'
          }
        },
        {
          name: 'on_model',
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
          name: 'created_from',
          in: 'query',
          required: false,
          schema: {
            type: 'string'
          }
        },
        {
          name: 'created_to',
          in: 'query',
          required: false,
          schema: {
            type: 'string'
          }
        },
        {
          name: 'action',
          in: 'query',
          required: false,
          schema: {
            type: 'string',
            enum: Object.values(mallActions).map((item) => item.action)
          }
        }
      ],
      responses: response200
    }
  },
  '/s_/sum-mall/mall-activity/admin/{id}': {
    get: {
      summary: 'Admin get mall activity by id',
      tags: ['mall-activity'],
      parameters: [selectSchema],
      responses: response200
    },
    parameters: [pathIDSchema]
  },
  '/s_/sum-mall/mall-activity/mall': {
    get: {
      summary: 'Mall get all mall activities',
      tags: ['mall-activity'],
      parameters: [
        selectSchema,
        pageSchema,
        sortSchema,
        selectSchema,
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
          name: 'resource',
          in: 'query',
          required: false,
          schema: {
            type: 'string'
          }
        },
        {
          name: 'on_model',
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
          name: 'created_from',
          in: 'query',
          required: false,
          schema: {
            type: 'string'
          }
        },
        {
          name: 'created_to',
          in: 'query',
          required: false,
          schema: {
            type: 'string'
          }
        },
        {
          name: 'action',
          in: 'query',
          required: false,
          schema: {
            type: 'string',
            enum: Object.values(mallActions).map((item) => item.action)
          }
        }
      ],
      responses: response200
    }
  },
  '/s_/sum-mall/mall-activity/mall/{id}': {
    get: {
      summary: 'Mall get mall activity by id',
      tags: ['mall-activity'],
      parameters: [selectSchema],
      responses: response200
    },
    parameters: [pathIDSchema]
  }
};
