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
  '/s_/group/user/{id}': {
    get: {
      summary: 'user get group by id',
      tags: ['group'],
      parameters: [pathIDSchema, selectSchema, populateSchema],
      responses: response200
    }
  },
  '/s_/group/user': {
    get: {
      summary: 'user get groups',
      tags: ['group'],
      parameters: [
        ...findSchema,
        populateSchema,
        withSchema(idSchema, { name: '_id' }),
        withSchema(booleanSchema, { name: 'is_important' }),
        withSchema(textSchema, { name: 'store_id' }),
        withSchema(idSchema, { name: 'company_id' }),
        withSchema(idSchema, { name: 'mall_id' }),
        withSchema(idSchema, { name: 'store_id' })
      ],
      responses: response200
    }
  },
  '/s_/group/company/{id}': {
    get: {
      summary: 'company get group by id',
      description: 'company get group by id',
      tags: ['group'],
      parameters: [pathIDSchema, selectSchema, populateSchema],
      responses: response200
    },
    put: {
      summary: 'company update group',
      description: 'company update group',
      tags: ['group'],
      parameters: [pathIDSchema],
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                is_important: { type: 'boolean' },
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
    },
    delete: {
      summary: 'company delete group by id',
      description: 'company delete group by id',
      tags: ['group'],
      parameters: [pathIDSchema],
      responses: response200
    }
  },
  '/s_/group/company': {
    get: {
      summary: 'company get groups',
      description: 'company get groups',
      tags: ['group'],
      parameters: [
        ...findSchema,
        populateSchema,
        withSchema(booleanSchema, { name: 'is_important' }),
        withSchema(idSchema, { name: '_id' }),
        withSchema(idSchema, { name: 'store_id' })
      ],
      responses: response200
    },
    post: {
      summary: 'company create group',
      description: 'company create group',
      tags: ['group'],
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                is_important: { type: 'boolean', default: false },
                store_id: { type: 'string', description: 'only used for company owner' },
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
