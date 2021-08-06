import { response200, response201 } from '../commons/responses.schema';

export default {
  '/s_/stock/company/update-stock': {
    post: {
      tags: ['stock'],
      summary: 'Company import/export product stocks.',
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                type: { type: 'string', enum: ['import', 'export'] },
                provider: { type: 'string', description: 'Required when type is `import`' },
                note: { type: 'string' },
                products: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: {
                        type: 'string'
                      },
                      stock: {
                        type: 'number'
                      }
                    }
                  }
                }
              },
              example: {
                products: [
                  { id: '5e7494bf6bd99e6a93fb2bff', stock: 10 },
                  { id: '5e7494bf6bd99e6a93fb2c0a', stock: 5 }
                ],
                provider: 'provider A [Required when type is `import`]',
                note: "<script>window.location = 'http://example.com'</script>",
                type: 'import / export'
              }
            }
          },
          required: true
        }
      },
      responses: {
        ...response200,
        '400': {
          description: "'client.productNotExist': 7001300, 'client.stockCannotBeNegative': 7001303"
        }
      }
    }
  },
  '/s_/stock/company/request-move': {
    post: {
      tags: ['stock'],
      summary: 'Company request move stock from [stock | store]_to_[store | stock].',
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                moving_type: {
                  type: 'string',
                  enum: ['stock_to_store', 'store_to_stock']
                },
                product_id: {
                  type: 'string',
                  description: 'Used when only move stocks of a single product.'
                },
                stock: {
                  type: 'number',
                  description: 'Used when only move stocks of a single product.'
                },
                products: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: {
                        type: 'string',
                        required: true
                      },
                      stock: {
                        type: 'number',
                        required: true
                      }
                    }
                  }
                },
                store_id: {
                  type: 'string',
                  required: true
                },
                note: {
                  type: 'string'
                },
                requester_type: {
                  type: 'string',
                  default: 'store',
                  enum: ['stock', 'store']
                }
              },
              example: {
                moving_type: 'store_to_stock | stock_to_store',
                requester_type: 'store | stock',
                store_id: '5e74819e6bd99e6a93fb004a',
                products: [
                  { id: '5e7494bf6bd99e6a93fb2bff', stock: 30 },
                  { id: '5e7494bf6bd99e6a93fb2c21', stock: 20 }
                ],
                note: "<script>window.location = 'http://example.com'</script>"
              }
            }
          }
        }
      },
      responses: response201
    }
  },
  '/s_/stock/company/confirm-move': {
    post: {
      tags: ['stock'],
      summary: 'Company confirm move request',
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                product_stock_history_id: {
                  type: 'string',
                  required: true
                },
                products: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: {
                        type: 'string',
                        required: true
                      },
                      stock: {
                        type: 'number',
                        required: true
                      },
                      status: {
                        type: 'string',
                        enum: ['completed', 'cancelled'],
                        default: 'completed'
                      }
                    }
                  }
                },
                note: {
                  type: 'string'
                },
                status: {
                  type: 'string',
                  description: '<i>If this field used, then all products have this status.</i>',
                  enum: ['completed', 'cancelled']
                }
              },
              example: {
                product_stock_history_id: '5f0d35ae6c7576412cf80ad6',
                status: 'completed',
                note: 'Đã nhận sản phẩm.'
              }
            }
          }
        }
      },
      responses: response200
    }
  },
  '/s_/stock/company/approve-move': {
    post: {
      tags: ['stock'],
      summary: 'Company approve move request',
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                product_stock_history_id: {
                  type: 'string',
                  required: true
                },
                status: {
                  type: 'string',
                  required: true,
                  enum: ['approved', 'cancelled']
                },
                products: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: {
                        type: 'string',
                        required: true
                      },
                      status: {
                        type: 'string',
                        enum: ['approved', 'cancelled'],
                        default: 'approved'
                      }
                    }
                  }
                },
                note: {
                  type: 'string'
                }
              },
              example: {
                product_stock_history_id: '5f0d35ae6c7576412cf80ad6',
                status: 'approved',
                note: 'Ok.'
              }
            }
          }
        }
      },
      responses: response200
    }
  }
};
