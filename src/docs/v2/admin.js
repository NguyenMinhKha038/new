import findSchema from '../commons/find.schema';
import { authBearerSchema } from '../commons/auth-header.schema';
import { response200, response201 } from '../commons/responses.schema';

export default {
  '/admin/get-admins': {},
  '/admin/get-admin/{admin_id}': {
    get: {
      tags: ['admin'],
      summary: 'admin : get admin by id',
      description:
        'only root admin  (permission code is 1)  and admin_mod (permission code\nis 2) can get',
      parameters: [
        {
          name: 'admin_id',
          in: 'query',
          required: true,
          schema: {
            type: 'string'
          }
        }
      ],
      responses: response200
    },
    parameters: [
      {
        name: 'admin_id',
        in: 'path',
        required: true,
        schema: {
          type: 'string'
        }
      }
    ]
  },
  '/admin/get-admin?permission_code={permission_code}': {
    get: {
      tags: ['admin'],
      summary: 'get admin by permission code',
      description: 'only root and admin_mod (permission code 1 and 2) can get ',
      parameters: [
        {
          name: 'permission_code',
          in: 'query',
          required: false,
          schema: {
            type: 'number'
          }
        },
        authBearerSchema
      ],
      responses: {
        '200': {
          description: 'Status 200',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                description:
                  '{\n"statusCode": 200,\n"data":{\n"_id": "5c999efa2fd93332d3e6b94a",\n"user_name": "videos_mod",\n"email": "videos_mod_video@gmail.com",\n"last_name": "videos_mod_video",\n"status": "active",\n"permission_code": 3\n}\n}'
              }
            }
          }
        }
      }
    },
    parameters: [
      {
        name: 'permission_code',
        in: 'path',
        required: true,
        schema: {
          type: 'string'
        }
      }
    ]
  },
  '/admin/create-new': {
    post: {
      tags: ['admin'],
      summary: 'create new admin',
      parameters: [authBearerSchema],
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: [
                'email',
                'first_name',
                'last_name',
                'password',
                'permission_code',
                'user_name'
              ],
              properties: {
                user_name: {
                  type: 'string'
                },
                first_name: {
                  type: 'string'
                },
                last_name: {
                  type: 'string'
                },
                password: {
                  type: 'string'
                },
                email: {
                  type: 'string'
                },
                permission_code: {
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
  '/admin/update-permission-group': {
    post: {
      tags: ['admin'],
      summary: 'set permission',
      parameters: [authBearerSchema],
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['admin_id', 'permission_group_id'],
              properties: {
                admin_id: {
                  type: 'string'
                },
                permission_group_id: {
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
  },
  '/admin/delete-admin': {
    post: {
      tags: ['admin'],
      summary: 'delete admin mod',
      parameters: [authBearerSchema],
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['id'],
              properties: {
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
    }
  },
  '/admin/set-status': {
    post: {
      tags: ['admin'],
      summary: 'set status',
      parameters: [authBearerSchema],
      requestBody: {
        $ref: '#/components/requestBodies/Body4'
      },
      responses: response200
    }
  },
  '/admin/activities/{activity_id}': {
    get: {
      tags: ['admin'],
      summary: "admin: get admin's activities by id",
      parameters: [
        {
          name: 'activity_id',
          in: 'path',
          required: true,
          schema: {
            type: 'string'
          }
        }
      ],
      responses: response200
    }
  },
  '/admin/activities': {
    get: {
      tags: ['admin'],
      summary: "admin: get admin's activities by query",
      parameters: [
        ...findSchema,
        {
          name: 'admin_id',
          in: 'query',
          required: false,
          schema: {
            type: 'string'
          }
        },
        {
          name: 'created_from',
          in: 'query',
          required: false,
          schema: {
            type: 'iso date'
          }
        },
        {
          name: 'created_to',
          in: 'query',
          required: false,
          schema: {
            type: 'iso date'
          }
        },
        {
          name: 'on_model',
          in: 'query',
          required: false,
          schema: {
            type: 'string',
            enum: [
              'admins',
              'Permissions',
              'admin_banks',
              's_banner',
              's_company',
              's_category',
              's_revenue',
              's_comment',
              's_deposit_withdraw',
              's_lucky_shopping',
              's_product',
              's_order',
              's_promotion',
              's_report'
            ]
          }
        },
        {
          name: 'resource',
          in: 'query',
          required: false,
          schema: {
            type: 'string'
          }
        },
        {
          name: 'object_id',
          in: 'query',
          required: false,
          schema: {
            type: 'string'
          }
        },
        {
          name: 'parent_action_id',
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
