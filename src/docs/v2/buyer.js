import { limitSchema, pageSchema, selectSchema, sortSchema } from '../commons/find.schema';
import { BuyerStatus } from '../../search/buyer/buyer.config';
import { response200 } from '../commons/responses.schema';

export default {
  '/s_/buyer/admin': {
    get: {
      summary: 'Admin get all buyers',
      tags: ['buyer'],
      parameters: [
        selectSchema,
        sortSchema,
        pageSchema,
        limitSchema,
        {
          name: 'company_id',
          in: 'query',
          required: false,
          schema: {
            type: 'string'
          }
        },
        {
          name: 'phone',
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
            enum: Object.values(BuyerStatus)
          }
        }
      ],
      responses: response200
    }
  },
  '/s_/buyer/admin/{id}': {
    get: {
      summary: 'Admin get buyer by id ',
      tags: ['buyer'],
      parameters: [selectSchema],
      responses: response200
    }
  },
  '/s_/buyer/company': {
    get: {
      summary: 'Company get all buyers',
      tags: ['buyer'],
      parameters: [
        selectSchema,
        sortSchema,
        pageSchema,
        limitSchema,
        {
          name: 'phone',
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
            enum: Object.values(BuyerStatus)
          }
        }
      ],
      responses: response200
    }
  },
  '/s_/buyer/company/{id}': {
    get: {
      summary: 'Company get buyer by id ',
      tags: ['buyer'],
      parameters: [selectSchema],
      responses: response200
    }
  }
};
