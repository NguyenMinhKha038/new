import { limitSchema, sortSchema, pageSchema } from '../commons/find.schema';
import { response200 } from '../commons/responses.schema';

export default {
  '/s_/recommend/product': {
    get: {
      tags: ['recommend'],
      description: 'Get recommended products.',
      summary: 'Get recommended products.',
      parameters: [
        limitSchema,
        sortSchema,
        pageSchema,
        {
          name: 'id',
          type: 'string',
          required: false,
          in: 'query'
        },
        {
          name: 'type_category_id',
          type: 'string',
          required: false,
          in: 'query'
        },
        {
          name: 'company_category_id',
          type: 'string',
          required: false,
          in: 'query'
        },
        {
          name: 'sub_category_id',
          type: 'string',
          required: false,
          in: 'query'
        },
        {
          name: 'price',
          type: 'number',
          required: false,
          in: 'query'
        }
      ],

      responses: response200
    }
  }
};
