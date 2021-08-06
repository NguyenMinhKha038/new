import findSchema, { limitSchema, pageSchema, sortSchema } from '../commons/find.schema';
import pathIDSchema from '../commons/path-id.schema';
import { response200, response201 } from '../commons/responses.schema';

export default {
  '/s_/promotion-code/user/': {
    get: {
      tags: ['promotion_code'],
      summary: "get user's prmotion-code",
      responses: response200
    },
    post: {
      tags: ['promotion_code'],
      summary: 'create promotion-code by user',
      responses: response201
    }
  },
  '/s_/promotion-code/user/{id}': {
    get: {
      tags: ['promotion_code'],
      summary: 'get promotion of user by id',
      parameters: [pathIDSchema],
      responses: response200
    }
  },
  '/s_/promotion-code/owner/': {
    get: {
      tags: ['promotion_code'],
      summary: 'promotion code: owner get',
      responses: response200
    }
  },
  '/s_/promotion-code/owner/:id': {
    get: {
      tags: ['promotion_code'],
      summary: 'owner find promotion code by id',
      responses: response200
    }
  },
  '/s_/promotion-code/admin/:id': {
    get: {
      tags: ['promotion_code'],
      summary: 'admin find promotion code by id',
      responses: response200
    }
  },
  '/s_/promotion-code/admin/': {
    get: {
      tags: ['promotion_code'],
      summary: 'promotion-code: admin get',
      description: 'if promotion_id is null, server will response all dataa',
      parameters: [
        {
          name: 'promotion_id',
          in: 'query',
          required: false,
          schema: {
            type: 'string'
          }
        },
        limitSchema,
        pageSchema
      ],
      responses: response200
    }
  }
};
