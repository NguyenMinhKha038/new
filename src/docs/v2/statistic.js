import findSchema from '../commons/find.schema';
import pathIDSchema from '../commons/path-id.schema';
import { response200 } from '../commons/responses.schema';

export default {
  '/s_/statistic/admin': {
    get: {
      tags: ['statistic'],
      summary: 'company get statistic',
      parameters: [
        ...findSchema,
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
  '/s_/statistic/admin/{id}': {
    get: {
      summary: 'statistic',
      tags: ['statistic'],
      parameters: [pathIDSchema],
      responses: {}
    }
  },
  '/s_/statistic/admin/statics': {
    get: {
      tags: ['statistic'],
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
  }
};
