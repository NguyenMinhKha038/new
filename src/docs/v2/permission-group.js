import findSchema, { limitSchema, pageSchema, sortSchema } from '../commons/find.schema';
import { response200, response201 } from '../commons/responses.schema';

export default {
  '/permission-group/create-new': {
    post: {
      tags: ['permission-group'],
      summary: 'group permission: create new',
      requestBody: {
        $ref: '#/components/requestBodies/Body6'
      },
      responses: response201
    }
  },
  '/permission-group/update-permission': {
    post: {
      tags: ['permission-group'],
      summary: 'group permission: update permission',
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['id', 'permissions_id'],
              properties: {
                id: {
                  type: 'string'
                },
                permissions_id: {
                  type: 'array',
                  items: {
                    type: 'string'
                  }
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
  '/permission-group/get-groups-permissions': {
    get: {
      tags: ['permission-group'],
      summary: 'group permission: get all',
      parameters: [limitSchema, pageSchema],
      responses: response200
    }
  },
  '/permission-group/get-group-permission-by-id': {
    get: {
      tags: ['permission-group'],
      summary: 'get group permission by id',
      parameters: [
        {
          name: 'id',
          in: 'query',
          required: true,
          schema: {
            type: 'string'
          }
        }
      ],
      responses: response200
    }
  },
  '/permission-group/delete-group-permission-by-id': {
    delete: {
      tags: ['permission-group'],
      summary: 'delete group permission by id',
      parameters: [
        {
          name: 'id',
          in: 'query',
          required: true,
          schema: {
            type: 'string'
          }
        }
      ],
      responses: response200
    }
  },
  '/permission-group/members/{id}': {
    get: {
      tags: ['permission-group'],
      summary: 'permission-group: get members',
      responses: response200
    },
    parameters: [
      {
        name: 'id',
        in: 'path',
        required: true,
        schema: {
          type: 'string'
        }
      }
    ]
  },
  '/s_/permission-group/owner/status': {
    put: {
      tags: ['permission-group'],
      summary: 'update status permission-group',
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['id', 'status'],
              properties: {
                id: {
                  type: 'string'
                },
                status: {
                  type: 'string',
                  description: 'active , disabled'
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
  '/s_/permission-group/owner/': {
    put: {
      tags: ['permission-group'],
      summary: 'update permission-group',
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                id: {
                  type: 'string'
                },
                status: {
                  type: 'string',
                  description: 'active , disabled'
                },
                store_id: {
                  type: 'string'
                },
                type: {
                  type: 'array',
                  items: {
                    type: 'string',
                    valid: ['typist', 'company_stock', 'cashier', 'seller', 'store_stock']
                  }
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
  '/s_/permission-group/owner': {
    post: {
      tags: ['permission-group'],
      summary: 'create permission-group',
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['store_id', 'type', 'phone_number'],
              properties: {
                phone_number: {
                  type: 'string'
                },
                store_id: {
                  type: 'string',
                  description:
                    'store is required when type has any value of seller, store_stock, cashier'
                },
                type: {
                  type: 'array',
                  items: {
                    type: 'string',
                    valid: ['typist', 'company_stock', 'cashier', 'seller', 'store_stock']
                  }
                }
              }
            }
          }
        },
        required: true
      },
      responses: response201
    },
    get: {
      tags: ['permission-group'],
      summary: 'company get list staffs',
      parameters: [
        limitSchema,
        pageSchema,
        sortSchema,
        {
          name: 'type',
          in: 'query',
          required: false,
          schema: {
            type: 'string',
            enum: ['typist', 'cashier', 'seller']
          }
        },
        {
          name: 'status',
          in: 'query',
          required: false,
          schema: {
            type: 'string',
            enum: ['active', 'disabled']
          }
        },
        {
          name: 'level',
          in: 'query',
          required: false,
          schema: {
            type: 'string',
            enum: ['company', 'store']
          }
        },
        {
          name: 'store_id',
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
  '/s_/permission-group/owner/mod/:id': {
    get: {
      tags: ['permission-group'],
      summary: 'company get group permisison by id',
      parameters: [
        {
          name: 'id',
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
  '/s_/permission-group/user/': {
    get: {
      tags: ['permission-group'],
      summary: 'user get personal permission',
      parameters: [],
      responses: response200
    }
  },
  '/s_/permission-group/admin': {
    get: {
      tags: ['permission-group'],
      summary: 'admin get list groups permisison',
      parameters: [
        limitSchema,
        pageSchema,
        sortSchema,
        {
          name: 'company_id',
          in: 'query',
          required: false,
          schema: {
            type: 'string'
          }
        },
        {
          name: 'store_id',
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
            valid: 'active, disabled'
          }
        },
        {
          name: 'type',
          in: 'query',
          required: false,
          schema: {
            type: 'string',
            valid: ['typist', 'company_stock', 'cashier', 'seller', 'store_stock']
          }
        },
        {
          name: 'user_id',
          in: 'query',
          required: false
        },
        {
          name: 'user_ids',
          in: 'query',
          required: false
        }
      ],
      responses: response200
    }
  },
  '/s_/permission-group/admin/raw': {
    get: {
      tags: ['permission-group'],
      summary: 'admin get list groups permisison',
      parameters: [
        limitSchema,
        pageSchema,
        sortSchema,
        {
          name: 'company_ids',
          in: 'query',
          required: false,
          schema: {
            type: 'array',
            items: {
              type: 'string'
            }
          }
        },
        {
          name: 'store_ids',
          in: 'query',
          required: false,
          schema: {
            type: 'array',
            items: {
              type: 'string'
            }
          }
        },
        {
          name: 'user_ids',
          in: 'query',
          required: false,
          schema: {
            type: 'array',
            items: {
              type: 'string'
            }
          }
        },
        {
          name: 'status',
          in: 'query',
          required: false,
          schema: {
            type: 'string',
            valid: 'active, disabled'
          }
        },
        {
          name: 'type',
          in: 'query',
          required: false,
          schema: {
            type: 'string',
            valid: ['typist', 'company_stock', 'cashier', 'seller', 'store_stock']
          }
        }
      ],
      responses: response200
    }
  },
  '/s_/permission-group/admin/:id': {
    get: {
      tags: ['permission-group'],
      summary: 'admin get group permisison by id',
      parameters: [
        {
          name: 'id',
          in: 'path',
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
