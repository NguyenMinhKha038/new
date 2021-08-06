import findSchema, {
  limitSchema,
  pageSchema,
  sortSchema,
  selectSchema
} from '../commons/find.schema';
import { response200, response201 } from '../commons/responses.schema';

export default {
  '/s_/search': {
    get: {
      summary: 'search',
      tags: ['search'],
      parameters: [
        {
          name: 'query',
          in: 'query',
          required: false,
          schema: {
            type: 'string'
          }
        },
        {
          name: 'province_code',
          in: 'query',
          required: false,
          schema: {
            type: 'string'
          }
        },
        {
          name: 'in_menu',
          in: 'query',
          required: false,
          schema: {
            type: 'boolean'
          }
        },
        {
          name: 'type',
          in: 'query',
          required: false,
          schema: {
            type: 'string',
            enum: ['store', 'product', 'all'],
            default: 'all'
          }
        },
        {
          name: 'type_category_id',
          in: 'query',
          required: false,
          schema: {
            type: 'string'
          }
        },
        {
          name: 'location',
          in: 'query',
          required: false,
          schema: {
            type: 'string'
          }
        },
        {
          name: 'distance',
          in: 'query',
          required: false,
          schema: {
            type: 'string'
          }
        },
        {
          name: 'group_store',
          in: 'query',
          required: false,
          schema: {
            type: 'boolean'
          }
        },
        {
          name: 'sort',
          in: 'query',
          required: false,
          schema: {
            type: 'string',
            enum: ['max_refund', 'max_discount']
          }
        },
        {
          name: 'from',
          in: 'query',
          required: false,
          schema: {
            type: 'number'
          }
        },
        {
          name: 'size',
          in: 'query',
          required: false,
          schema: {
            type: 'number'
          }
        }
      ],
      responses: response200
    }
  },
  '/s_/search/company/text-search': {
    get: {
      summary:
        'Company search products|stores|companies|categories|users|promotion|provider by name.',
      description:
        'Company search products|stores|companies|categories|users|promotion|provider by name.',
      tags: ['search'],
      parameters: [
        {
          name: 'type',
          in: 'query',
          required: true,
          schema: {
            type: 'string',
            enum: ['product', 'store', 'company', 'category', 'user', 'promotion', 'provider'],
            example: 'product'
          }
        },
        {
          name: 'name',
          in: 'query',
          required: false,
          schema: {
            type: 'string',
            example: 'May hut bui'
          }
        },
        {
          ...selectSchema,
          schema: {
            type: 'string',
            example: 'name pure_name'
          }
        },
        {
          ...sortSchema,
          schema: {
            type: 'string',
            example: 'name'
          }
        },
        {
          ...limitSchema,
          schema: {
            type: 'number',
            example: 20
          }
        }
      ],
      responses: response200
    }
  },
  '/s_/search/admin/text-search': {
    get: {
      summary:
        'Admin search products|stores|companies|categories|users|promotion|provider by name.',
      description:
        'Admin search products|stores|companies|categories|users|promotion|provider by name.',
      tags: ['search'],
      parameters: [
        {
          name: 'type',
          in: 'query',
          required: true,
          schema: {
            type: 'string',
            enum: ['product', 'store', 'company', 'category', 'user', 'promotion', 'provider'],
            example: 'product'
          }
        },
        {
          name: 'name',
          in: 'query',
          required: false,
          schema: {
            type: 'string',
            example: 'May hut bui'
          }
        },
        {
          ...selectSchema,
          schema: {
            type: 'string',
            example: 'name pure_name'
          }
        },
        {
          name: 'populate',
          in: 'query',
          required: false,
          schema: {
            type: 'string',
            example: 'type_category_id company_category_id'
          }
        },
        {
          ...sortSchema,
          schema: {
            type: 'string',
            example: 'name'
          }
        },
        {
          ...limitSchema,
          schema: {
            type: 'number',
            example: 20
          }
        }
      ],
      responses: response200
    }
  },
  '/s_/search/auto-complete': {
    get: {
      summary: 'search',
      tags: ['search'],
      parameters: [
        {
          name: 'query',
          in: 'query',
          required: false,
          schema: {
            type: 'string'
          }
        },
        {
          name: 'location',
          in: 'query',
          required: false,
          schema: {
            type: 'string',
            example: '10.8608434,106.7824432'
          }
        }
      ],
      responses: response200
    }
  },
  '/s_/search/address': {
    get: {
      summary: 'search',
      tags: ['search'],
      parameters: [
        {
          name: 'location',
          in: 'query',
          required: false,
          schema: {
            type: 'string',
            example: '10.8608434,106.7824432'
          }
        }
      ],
      responses: response200
    }
  },
  '/s_/search/coordinates': {
    get: {
      summary: 'search',
      tags: ['search'],
      parameters: [
        {
          name: 'query',
          in: 'query',
          required: false,
          schema: {
            type: 'string'
          }
        }
      ],
      responses: response200
    }
  }
};
