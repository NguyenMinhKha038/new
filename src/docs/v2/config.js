import findSchema from '../commons/find.schema';
import pathIDSchema from '../commons/path-id.schema';
import { response200, response201 } from '../commons/responses.schema';

export default {
  '/config': {
    get: {
      summary: 'get list config',
      tags: ['config'],
      parameters: [...findSchema],
      responses: response200
    },
    post: {
      tags: ['config'],
      summary: 'create a config',
      requestBody: {
        $ref: '#/components/requestBodies/Body3'
      },
      responses: response201
    },
    put: {
      tags: ['config'],
      summary: 'update a config',
      requestBody: {
        $ref: '#/components/requestBodies/Body3'
      },
      responses: response200
    },
    delete: {
      tags: ['config'],
      summary: 'delete a config',
      parameters: [
        {
          name: 'key',
          in: 'query',
          required: true,
          schema: {
            type: 'string'
          }
        }
      ],
      responses: response200
    }
  },
  '/config/init': {
    get: {
      tags: ['config'],
      summary: 'init or reset',
      responses: response200
    }
  },
  '/config/topup': {
    put: {
      tags: ['config'],
      description: 'admin update topup config',
      parameters: [pathIDSchema],
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['path', 'value'],
              description: 'body: {[update key]: value}'
            }
          }
        }
      },
      responses: response200
    }
  },
  '/config/app-version': {
    put: {
      tags: ['config'],
      summary: 'update app version',
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                admin_web: {
                  type: 'string',
                  description: '2.7.0'
                },
                enterprise_web: {
                  type: 'string',
                  description: '2.7.0'
                },
                mobile_app: {
                  type: 'string',
                  description: '2.7.0'
                }
              }
            }
          }
        }
      },
      responses: response200
    }
  }
};
