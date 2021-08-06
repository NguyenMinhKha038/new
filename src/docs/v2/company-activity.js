import { CompanyActionModels } from '../../search/company-activity/company-activity.config';
import companyActivityValidation from '../../search/company-activity/company-activity.validation';
import findSchema, { selectSchema } from '../commons/find.schema';
import { pathIDSchema } from '../commons/path-id.schema';
import { response200 } from '../commons/responses.schema';

export default {
  '/company/activities/{id}': {
    get: {
      tags: ['company-activity'],
      summary: "company: get company's activities by id",
      parameters: [pathIDSchema, selectSchema],
      responses: response200
    }
  },
  '/company/activities': {
    get: {
      tags: ['company-activity'],
      summary: "company: get company's activities by query",
      parameters: [
        ...findSchema,
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
            type: 'iso date'
          }
        },
        {
          name: 'created_to',
          in: 'query',
          required: false,
          schema: {
            type: 'iso date'
          }
        },
        {
          name: 'on_model',
          in: 'query',
          required: false,
          schema: {
            type: 'string',
            enum: Object.keys(CompanyActionModels)
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
          name: 'object_id',
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
