import { response200, response201 } from '../commons/responses.schema';
import pathIDSchema from '../commons/path-id.schema';
import findSchema, { selectSchema, limitSchema } from '../commons/find.schema';

export default {
  '/s_/product-template/admin': {
    post: {
      tags: ['product-template'],
      summary: 'create product template',
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                name: {
                  type: 'string',
                  maxLength: 1
                },
                category_id: {
                  type: 'string',
                  example: '5eba59d72e0c14665e0f5660'
                },
                attribute_info: {
                  type: 'array',
                  items: {
                    type: 'object'
                  },
                  example: [
                    {
                      attribute_id: '6098a71381c5bb2dca8a30fe',
                      is_required: true
                    },
                    {
                      attribute_id: '6097dc6565f94c37e1b89797',
                      is_required: false
                    }
                  ]
                },
                allow_unknown_attribute: {
                  type: 'boolean'
                }
              }
            }
          }
        }
      },
      responses: {
        ...response201,
        '400': {
          description: `
            categoryNotExist: 7000300,
            productAttributeNotFound: 7014000,
            categoryMustBeLowestInCategoryTree: 700306
          `
        }
      }
    },
    get: {
      tags: ['product-template'],
      summary: 'Admin get all product template',
      parameters: [...findSchema],
      responses: response200
    }
  },
  '/s_/product-template/admin/{id}': {
    get: {
      tags: ['product-template'],
      summary: 'Admin get product template by id',
      parameters: [pathIDSchema],
      responses: response200
    },
    put: {
      tags: ['product-template'],
      summary: 'Admin update product template when it in pending',
      parameters: [pathIDSchema],
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                name: {
                  type: 'string',
                  maxLength: 1
                },
                category_id: {
                  type: 'string',
                  example: '5eba531ad6e4f660c9b6b4bb'
                },
                allow_unknown_attribute: {
                  type: 'boolean'
                },
                attribute_info: {
                  type: 'array',
                  items: {
                    type: 'object'
                  },
                  example: [
                    {
                      attribute_id: '6098a71381c5bb2dca8a30fe',
                      is_required: true
                    },
                    {
                      attribute_id: '6097dc6565f94c37e1b89797',
                      is_required: false
                    }
                  ]
                }
              }
            }
          }
        }
      },
      responses: {
        ...response200,
        '400': {
          description: `
            cannotUpdateActiveProductTemplate: 7015001
            categoryMustBeLowestInCategoryTree,
            categoryNotExist
          `
        },
        '404': {
          description: `
            productAttributeNotFound: 7014000
          `
        }
      }
    }
  },
  '/s_/product-template/company/get-latest-template': {
    get: {
      tags: ['product-template'],
      summary: 'Company get latest product template by category_id',
      parameters: [
        {
          name: 'category_id',
          in: 'query',
          required: true,
          schema: {
            type: 'string',
            example: '5eba59d72e0c14665e0f5660'
          }
        }
      ],
      responses: {
        ...response200,
        '404': {
          description: `
            productTemplateNotFound: 7015000
          `
        }
      }
    }
  },
  '/s_/product-template/company/update-status/{id}': {
    put: {
      tags: ['product-template'],
      summary:
        'Admin update product template STATUS, change STATUS from PENDING to ACTIVE or DISABLED',
      parameters: [pathIDSchema],
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['status'],
              properties: {
                status: {
                  type: 'string',
                  enum: ['active', 'disabled']
                }
              }
            }
          }
        }
      },
      responses: {
        ...response200,
        '400': {
          description: `
            productTemplateNotInPending: 7015002
          `
        }
      }
    }
  }
};
