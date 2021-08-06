import { response200 } from '../commons/responses.schema';

export default {
  '/s_/payment-gateway/admin/alepay/restore': {
    post: {
      tags: ['payment-gateway'],
      summary: 'handle if payment is paid but not hooked',
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['code', 'type'],
              properties: {
                code: {
                  type: 'string'
                },
                type: {
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
  }
};
