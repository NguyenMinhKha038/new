import { response200, response201 } from '../commons/responses.schema';

export default {
  '/s_/lucky-shopping/winners': {
    get: {
      tags: ['lucky-shopping'],
      description: 'user get lucky-shopping',
      parameters: [
        {
          name: 'date',
          type: 'string',
          required: true
        }
      ],
      responses: response200
    }
  },
  '/s_/lucky-shopping/admin/winners': {
    post: {
      tags: ['lucky-shopping'],
      description: 'admin set winner',
      requestBody: {
        content: {
          'application/json': {
            schema: {
              required: ['product_id', 'order_id'],
              properties: {
                product_id: {
                  type: 'string'
                },
                order_id: {
                  type: 'string'
                },
                winner_id: {
                  type: 'string',
                  description: 'if winner is real member'
                },
                winner_name: {
                  type: 'string required if fake winner'
                }
              },
              example: {
                product_id: '5ebc9f3c516ca936d9dad93d',
                winner_name: 'Doan Cong Minh',
                winner_id: '5e5f2a19ee81e04d90580998',
                order_id: '5ebca4995be00b3be447e6ac'
              }
            }
          }
        }
      },
      responses: {
        ...response200,
        '400': {
          description: "'client.orderNotExist': 7001400, 'client.productNotExist': 7001300"
        }
      }
    }
  },
  '/s_/lucky-shopping/': {
    get: {
      tags: ['lucky-shopping'],
      description: 'user get lucky-shopping',
      parameters: [
        {
          name: 'date',
          type: 'string',
          required: true
        }
      ],
      responses: response200
    }
  },
  '/s_/lucky-shopping/admin/users': {
    get: {
      tags: ['lucky-shopping'],
      description: 'admin get user order statistis',
      parameters: [
        {
          name: 'date',
          type: 'string',
          required: true
        }
      ],
      responses: response200
    }
  },
  '/s_/lucky-shopping/admin/': {
    post: {
      tags: ['lucky-shopping'],
      description: 'admin set winner',
      requestBody: {
        content: {
          'application/json': {
            schema: {
              required: ['product_id', 'order_id'],
              properties: {
                product_id: {
                  type: 'string'
                },
                number_prizes: {
                  type: 'number'
                },
                _id: {
                  type: 'string'
                },
                order_ids: {
                  type: 'array'
                }
              },
              example: {
                product_id: '5ebc9f3c516ca936d9dad93d',
                number_prizes: '5',
                _id: '5e5f2a19ee81e04d90580998',
                order_ids: ['5ebca4995be00b3be447e6ac']
              }
            }
          }
        }
      },
      responses: {
        ...response201,
        '400': {
          description: "'client.orderNotExist': 7001400, 'client.productNotExist': 7001300"
        }
      }
    }
  },
  '/s_/lucky-shopping/admin/sale-date': {
    post: {
      tags: ['lucky-shopping'],
      description: 'admin set sale date of product',
      requestBody: {
        content: {
          'application/json': {
            schema: {
              required: ['product_ids', 'date'],
              properties: {
                product_ids: {
                  type: 'array',
                  items: {
                    type: 'string'
                  }
                },
                date: {
                  type: 'string'
                }
              },
              example: {
                product_ids: ['5ebc9f3c516ca936d9dad93d'],
                date: '2020-05-14T03:04:37.679Z'
              }
            }
          }
        }
      },
      responses: {
        ...response200,
        '400': {
          description: "'client.cannotChangeProductOnSale': 7001305"
        }
      }
    }
  }
};
