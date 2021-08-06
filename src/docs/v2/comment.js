import findSchema from '../commons/find.schema';
import pathIDSchema from '../commons/path-id.schema';
import { response200, response201 } from '../commons/responses.schema';

export default {
  '/s_/comment/user': {
    get: {
      tags: ['comment'],
      summary: 'user get personal comment',
      parameters: [...findSchema],
      responses: response200
    },
    post: {
      tags: ['comment'],
      summary: 'user create comment',
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['company_id', 'content', 'product_id'],
              properties: {
                content: {
                  type: 'string',
                  minLength: 1,
                  maxLength: 1024
                },
                company_id: {
                  type: 'string'
                },
                product_id: {
                  type: 'string'
                }
              }
            }
          }
        },
        required: true
      },
      responses: response201
    },
    put: {
      tags: ['comment'],
      summary: 'user update comment',
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['content', 'id'],
              properties: {
                content: {
                  type: 'string'
                },
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
    },
    delete: {
      tags: ['comment'],
      summary: 'user delete comment',
      parameters: [pathIDSchema],
      responses: response200
    }
  },
  '/s_/comment/user/reply': {
    post: {
      tags: ['comment'],
      summary: 'user create reply',
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['comment_id', 'company_id', 'content', 'product_id'],
              properties: {
                content: {
                  type: 'string',
                  minLength: 1,
                  maxLength: 1024
                },
                company_id: {
                  type: 'string'
                },
                product_id: {
                  type: 'string'
                },
                comment_id: {
                  type: 'string'
                }
              }
            }
          }
        },
        required: true
      },
      responses: response201
    }
  },
  '/s_/comment/company': {
    get: {
      tags: ['comment'],
      summary: 'Company get comments on their product',
      description: 'Company get comments on their product',
      parameters: [...findSchema],
      responses: response200
    }
  },
  '/s_/comment/admin': {
    get: {
      tags: ['comment'],
      summary: 'admin get comment',
      parameters: [
        ...findSchema,
        {
          name: 'product_id',
          in: 'query',
          required: false,
          schema: {
            type: 'string'
          }
        },
        {
          name: 'user_id',
          in: 'query',
          required: false,
          schema: {
            type: 'string'
          }
        },
        {
          name: 'status',
          in: 'query',
          required: false,
          schema: {
            type: 'string',
            enum: ['approved', 'pending', 'rejected']
          }
        },
        {
          name: 'type',
          in: 'query',
          required: false,
          schema: {
            type: 'string',
            enum: ['comment', 'reply']
          }
        },
        {
          name: 'parent_comment_id',
          in: 'query',
          required: false,
          schema: {
            type: 'string'
          }
        },
        {
          name: 'company_id',
          in: 'query',
          required: false,
          schema: {
            type: 'string'
          }
        }
      ],
      responses: response200
    }
  },
  '/s_/comment/admin/approve': {
    post: {
      tags: ['comment'],
      summary: 'admin approve comment',
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['content', 'id'],
              properties: {
                content: {
                  type: 'string',
                  minLength: 1,
                  maxLength: 1024
                },
                id: {
                  type: 'string'
                },
                status: {
                  type: 'string',
                  enum: ['approved', 'rejected', 'pending']
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
  '/s_/comment/product/{id}': {
    get: {
      tags: ['comment'],
      summary: 'get comment by product id',
      parameters: [...findSchema, pathIDSchema],
      responses: response200
    }
  },
  '/s_/comment/{id}': {
    get: {
      tags: ['comment'],
      summary: 'get comment by id',
      parameters: [pathIDSchema],
      responses: response200
    }
  },
  '/s_/comment/{id}/reply': {
    get: {
      tags: ['comment'],
      summary: 'get reply of comment',
      parameters: [...findSchema, pathIDSchema],
      responses: response200
    }
  }
};
