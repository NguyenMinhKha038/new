import { response200 } from '../commons/responses.schema';

export default {
  '/s_/logistics/company': {
    get: {
      tags: ['logistics'],
      summary: 'company get using logistics',
      responses: response200
    },
    put: {
      tags: ['logistics'],
      summary: 'company update logistics',
      requestBody: {
        content: {
          'application/json': {
            schema: {
              properties: {
                provider: {
                  type: 'string'
                },
                is_default: {
                  type: 'boolean'
                },
                status: {
                  type: 'string',
                  enum: ['active', 'disabled']
                }
              }
            },
            example: {
              provider: 'ghn',
              token: '95091cfab6c54f0ebc4039d6ffa036a1',
              status: 'active',
              is_default: true
            }
          }
        }
      },
      responses: {
        ...response200,
        '400': {
          description: "'client.logisticsTokenIsNotValid': 7002300"
        }
      }
    }
  },
  '/s_/logistics/user/available': {
    get: {
      tags: ['logistics'],
      summary: 'user get available logistics of a company',
      parameters: [
        {
          name: 'company_id',
          required: true
        }
      ],
      responses: response200
    }
  }
};
