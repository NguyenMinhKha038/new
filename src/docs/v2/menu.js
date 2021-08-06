import { response200, response201 } from '../commons/responses.schema';
import pathIDSchema from '../commons/path-id.schema';
import { selectSchema, populateSchema, idSchema } from '../commons/find.schema';

export default {
  '/s_/menu/id/{id}': {
    get: {
      tags: ['menu'],
      summary: 'get menu by id',
      description: 'get menu by id',
      parameters: [pathIDSchema, selectSchema, populateSchema],
      responses: response200
    }
  },
  '/s_/menu/store/{id}': {
    get: {
      tags: ['menu'],
      summary: 'get menu by store id',
      description: 'get menu by store id',
      parameters: [pathIDSchema, selectSchema, populateSchema],
      responses: response200
    }
  },
  '/s_/menu/company/{id}': {
    delete: {
      tags: ['menu'],
      summary: 'company remove menu',
      description: 'company remove menu',
      parameters: [pathIDSchema],
      responses: response200
    },
    put: {
      tags: ['menu'],
      summary: 'company update menu by id',
      description: 'company update menu by id',
      parameters: [pathIDSchema],
      requestBody: {
        content: {
          'application/json': {
            schema: {
              properties: {
                store_id: { type: 'string', description: 'For company owner' },
                status: { type: 'string', default: 'active' },
                products: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      product_storing_id: { type: 'string', required: true },
                      status: { type: 'string', default: 'active' },
                      tags: { type: 'array', items: { type: 'string' } },
                      options: {
                        type: 'array',
                        items: {
                          type: 'string'
                        }
                      }
                    }
                  }
                }
              },
              example: {
                products: [
                  {
                    product_storing_id: '5e96b3901181235f7514abfa',
                    options: ['6062e20dd8d38171c64a99fb']
                  }
                ]
              }
            }
          }
        }
      },
      responses: response200
    }
  },
  '/s_/menu/company': {
    post: {
      tags: ['menu'],
      summary: 'company create menu',
      description: 'company create menu',
      requestBody: {
        content: {
          'application/json': {
            schema: {
              properties: {
                products: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      product_storing_id: { type: 'string', required: true },
                      status: { type: 'string', default: 'active' },
                      tags: { type: 'array', items: { type: 'string' } },
                      options: {
                        type: 'array',
                        items: {
                          type: 'string'
                        }
                      }
                    }
                  }
                }
              },
              example: {
                products: [
                  {
                    product_storing_id: '5e96b3901181235f7514abfa',
                    options: ['6062e20dd8d38171c64a99fb']
                  }
                ]
              }
            }
          }
        }
      },
      responses: response201
    }
  }
};
