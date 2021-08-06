import findSchema, { limitSchema, pageSchema, sortSchema } from '../commons/find.schema';
import { response200, response201 } from '../commons/responses.schema';
import { authBearerSchema } from '../commons/auth-header.schema';

export default {
  '/permission/admin/create-new': {
    post: {
      tags: ['permission'],
      summary: 'permission : create new',
      parameters: [authBearerSchema],
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['code', 'name'],
              properties: {
                name: {
                  type: 'string'
                },
                // code: {
                //   type: 'number'
                // },
                description: {
                  type: 'string'
                }
              }
            }
          }
        },
        required: true
      },
      responses: response200
    }
  },
  '/permission/admin/get-permissions': {
    get: {
      tags: ['permission'],
      summary: 'permission : get all',
      parameters: [authBearerSchema],
      responses: response200
    }
  },
  '/permission/admin/update': {
    post: {
      tags: ['permission'],
      summary: 'permission: update',
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                name: {
                  type: 'string'
                },
                // code: {
                //   type: 'string'
                // },
                description: {
                  type: 'string'
                }
              }
            }
          }
        },
        required: true
      },
      responses: response200
    }
  },
  '/permission/admin/delete': {
    post: {
      tags: ['permission'],
      summary: 'permission : delete',
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                id: {
                  type: 'string'
                }
              }
            }
          }
        },
        required: true
      },
      responses: response200
    }
  },
  '/s_/permission/admin': {
    get: {
      tags: ['permission'],
      summary: 'admin get list permissions',
      parameters: [limitSchema, pageSchema, sortSchema],
      responses: response200
    }
  }
};
