import { response200 } from '../commons/responses.schema';
import pathIDSchema from '../commons/path-id.schema';
import findSchema from '../commons/find.schema';

export default {
  '/s_/behavior/admin': {
    get: {
      tags: ['behavior'],
      description: "Admin get the user's behaviors.",
      summary: "Admin get the user's behaviors.",
      parameters: [
        ...findSchema,
        {
          name: 'company_id',
          type: 'string',
          required: false,
          in: 'query'
        },
        {
          name: 'store_id',
          type: 'string',
          required: false,
          in: 'query'
        },
        {
          name: 'product_id',
          type: 'string',
          required: false,
          in: 'query'
        },
        {
          name: 'user_id',
          type: 'string',
          required: false,
          in: 'query'
        },
        {
          name: 'comment_id',
          type: 'string',
          required: false,
          in: 'query'
        },
        {
          name: 'type',
          required: false,
          schema: {
            type: 'string',
            enum: [
              'buy_online',
              'buy_offline',
              'cancel_order',
              'view_product',
              'share_product',
              'like_product',
              'unlike_product',
              'favorite_product',
              'unfavorite_product',
              'view_company',
              'like_company',
              'unlike_company',
              'rate_company',
              'unrate_company',
              'follow_company',
              'unfollow_company',
              'share_company',
              'comment'
            ]
          },
          in: 'query'
        },
        {
          name: 'created_from',
          type: 'iso date',
          required: false,
          in: 'query'
        },
        {
          name: 'created_to',
          type: 'iso date',
          required: false,
          in: 'query'
        },
        {
          name: 'province_code',
          type: 'string',
          required: false,
          in: 'query'
        }
      ],

      responses: response200
    }
  },
  '/s_/behavior/admin/{id}': {
    get: {
      tags: ['behavior'],
      description: "Admin get a user's behaviors.",
      summary: "Admin get a user's behaviors.",
      parameters: [pathIDSchema],

      responses: response200
    }
  }
};
