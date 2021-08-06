import findSchema, {
  limitSchema,
  idSchema,
  selectSchema,
  statusSchema,
  booleanSchema,
  numberSchema,
  textSchema,
  isoDateSchema,
  populateSchema
} from '../commons/find.schema';
import pathIDSchema from '../commons/path-id.schema';
import withSchema from '../commons/with-schema';
import { response200, response201 } from '../commons/responses.schema';

export default {
  '/s_/tag/{id}': {
    get: {
      summary: 'get tag by id',
      description: 'get tag by id',
      tags: ['tag'],
      parameters: [pathIDSchema, selectSchema, populateSchema],
      responses: response200
    }
  },
  '/s_/tag': {
    get: {
      summary: 'get tags',
      description: 'get tags',
      tags: ['tag'],
      parameters: [
        ...findSchema,
        populateSchema,
        withSchema(idSchema, { name: '_id' }),
        withSchema(textSchema, { name: 'store_id' }),
        withSchema(textSchema, { name: 'type', 'schema.enum': ['permanent', 'flash'] }),
        withSchema(textSchema, {
          name: 'scope',
          'schema.enum': ['global', 'company', 'store', 'mall']
        }),
        withSchema(isoDateSchema, { name: 'expiry_date_from' }),
        withSchema(isoDateSchema, { name: 'expiry_date_to' }),
        withSchema(idSchema, { name: 'company_id' }),
        withSchema(idSchema, { name: 'mall_id' }),
        withSchema(idSchema, { name: 'store_id' })
      ],
      responses: response200
    }
  },
  '/s_/tag/company/{id}': {
    delete: {
      summary: 'company delete tag by id',
      description: 'company delete tag by id',
      tags: ['tag'],
      parameters: [pathIDSchema],
      responses: response200
    },
    put: {
      summary: 'company update tag',
      description: 'company update tag',
      tags: ['tag'],
      parameters: [pathIDSchema],
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                expiry_date: { type: 'string', description: 'only used for type `flash`' },
                name: { type: 'string' },
                value: { type: 'string' },
                description: { type: 'string' },
                image_url: { type: 'string' }
              }
            }
          }
        }
      },
      responses: response200
    }
  },
  '/s_/tag/company': {
    post: {
      summary: 'company create tag',
      description: 'company create tag',
      tags: ['tag'],
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                type: { type: 'string', enum: ['permanent', 'flash'] },
                scope: { type: 'string', enum: ['store', 'company'] },
                store_id: { type: 'string', description: 'only used for company owner' },
                expiry_date: { type: 'string', description: 'only used for type `flash`' },
                name: { type: 'string' },
                value: { type: 'string' },
                description: { type: 'string' },
                image_url: { type: 'string' }
              }
            }
          }
        }
      },
      responses: response201
    }
  }
};
