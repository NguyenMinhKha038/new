import { limitSchema, pageSchema, sortSchema, selectSchema } from '../commons/find.schema';
import pathIDSchema from '../commons/path-id.schema';
import { response200, response201 } from '../commons/responses.schema';
import withSchema from '../commons/with-schema';

const adminSelectOptions = [
  'admin',
  'user',
  'company',
  'status',
  'address',
  'name',
  'pure_name',
  'location'
];

const companySelectOptions = ['status', 'address', 'name', 'pure_name', 'location'];

export default {
  '/s_/provider/admin/{id}': {
    get: {
      tags: ['provider'],
      summary: 'Admin get provider by id',
      parameters: [pathIDSchema],
      responses: response200
    },
    put: {
      tags: ['provider'],
      summary: 'Admin update a provider by id',
      parameters: [pathIDSchema],
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                name: {
                  type: 'string'
                },
                location: {
                  type: 'string',
                  description: 'longitude, latitude'
                },
                address: {
                  type: 'string'
                }
              },
              example: {
                name: 'provider A updated',
                location: '10.79581325412731, 106.64917808727098',
                address: 'Hẻm 268 Nguyễn Thái Bình 268/65, Hồ Chí Minh, Việt Nam'
              }
            }
          }
        },
        responses: response200
      }
    },
    delete: {
      tags: ['provider'],
      summary: 'Admin delete a provider by id',
      parameters: [pathIDSchema],
      responses: response200
    }
  },
  '/s_/provider/admin/': {
    get: {
      tags: ['provider'],
      summary: 'Admin get providers',
      parameters: [
        limitSchema,
        sortSchema,
        pageSchema,
        withSchema(selectSchema, { 'schema.enum': adminSelectOptions })
      ],
      responses: response200
    },
    post: {
      tags: ['provider'],
      summary: 'Admin create a provider',
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                name: {
                  type: 'string'
                },
                location: {
                  type: 'string',
                  description: 'longitude, latitude'
                },
                address: {
                  type: 'string'
                }
              },
              example: {
                name: 'provider A',
                location: '10.79581325412731, 106.64917808727098',
                address: 'Hẻm 268 Nguyễn Thái Bình 268/65, Hồ Chí Minh, Việt Nam'
              }
            }
          }
        },
        responses: response201
      }
    }
  },
  '/s_/provider/company/{id}': {
    get: {
      tags: ['provider'],
      summary: 'Company get provider by id',
      parameters: [pathIDSchema],
      responses: response200
    },
    put: {
      tags: ['provider'],
      summary: 'Company update a provider by id',
      parameters: [pathIDSchema],
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                name: {
                  type: 'string'
                },
                location: {
                  type: 'string',
                  description: 'longitude, latitude'
                },
                address: {
                  type: 'string'
                }
              },
              example: {
                name: 'provider A updated',
                location: '10.79581325412731, 106.64917808727098',
                address: 'Hẻm 268 Nguyễn Thái Bình 268/65, Hồ Chí Minh, Việt Nam'
              }
            }
          }
        },
        responses: response200
      }
    },
    delete: {
      tags: ['provider'],
      summary: 'Company delete a provider by id',
      parameters: [pathIDSchema],
      responses: response200
    }
  },
  '/s_/provider/company/': {
    get: {
      tags: ['provider'],
      summary: 'Company get providers',
      parameters: [
        limitSchema,
        sortSchema,
        pageSchema,
        withSchema(selectSchema, { 'schema.enum': companySelectOptions })
      ],
      responses: response200
    },
    post: {
      tags: ['provider'],
      summary: 'Company create a provider',
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                name: {
                  type: 'string'
                },
                location: {
                  type: 'string',
                  description: 'longitude, latitude'
                },
                address: {
                  type: 'string'
                }
              },
              example: {
                name: 'provider A',
                location: '10.79581325412731, 106.64917808727098',
                address: 'Hẻm 268 Nguyễn Thái Bình 268/65, Hồ Chí Minh, Việt Nam'
              }
            }
          }
        },
        responses: response201
      }
    }
  },
  '/s_/provider/company/get': {
    post: {
      tags: ['provider'],
      summary: 'Company get a provider with name (create new if not exist)',
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                name: {
                  type: 'string',
                  required: true
                },
                location: {
                  type: 'string',
                  required: false,
                  description: 'longitude, latitude'
                },
                address: {
                  type: 'string',
                  required: false
                }
              },
              example: {
                name: 'provider F (required)',
                location: '10.79581325412731, 106.64917808727098 (not required)',
                address: 'Hẻm 268 Nguyễn Thái Bình 268/65, Hồ Chí Minh, Việt Nam (not required)'
              }
            }
          }
        },
        responses: response200
      }
    }
  }
};
