import { response200 } from '../commons/responses.schema';

export default {
  '/s_/company/user-start-chat': {
    post: {
      tags: ['chat'],
      summary: 'user start chat with company',
      requestBody: {
        content: {
          'application/json': {
            schema: {
              required: ['id'],
              properties: {
                id: {
                  type: 'string'
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
