import findSchema, { limitSchema, pageSchema, sortSchema } from '../commons/find.schema';
import pathIDSchema from '../commons/path-id.schema';
import { response200, response201 } from '../commons/responses.schema';

export default {
  '/s_/promotion/user/{id}': {
    get: {
      tags: ['promotion'],
      summary: 'Get by promotion id',
      parameters: [
        pathIDSchema,
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
          name: 'product_storing_id',
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
  '/s_/promotion/user/': {
    get: {
      tags: ['promotion'],
      summary: 'Get',
      parameters: [
        limitSchema,
        pageSchema,
        sortSchema,
        {
          name: 'product_storing_id',
          in: 'query',
          required: false,
          schema: {
            type: 'string'
          }
        },
        {
          name: 'status_date',
          in: 'query',
          required: false,
          description: 'waiting, running, overed',
          schema: {
            type: 'string'
          }
        },
        {
          name: 'status',
          in: 'query',
          required: false,
          description: 'active, disable',
          schema: {
            type: 'string'
          }
        },
        {
          name: 'reference',
          in: 'query',
          required: false,
          schema: {
            type: 'string',
            description: 'product store company'
          }
        }
      ],
      responses: response200
    }
  },
  '/s_/promotion/owner/': {
    get: {
      tags: ['promotion'],
      summary: 'get owner promotions',
      parameters: [
        limitSchema,
        sortSchema,
        pageSchema,
        {
          name: 'product_storing_id',
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
            enum: ['handling', 'pending', 'active', 'expired', 'disabled']
          }
        },
        {
          name: 'reference',
          in: 'query',
          required: false,
          schema: {
            type: 'string',
            description: 'product store company'
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
          name: 'promotion_ids',
          in: 'query',
          required: false,
          schema: {
            type: 'array',
            items: {
              type: 'string'
            }
          }
        }
      ],
      responses: response200
    },
    post: {
      tags: ['promotion'],
      summary: 'create owner promotion',
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: [
                'description',
                'expires_at',
                'name',
                'product_scop',
                'product_storing_ids',
                'refund',
                'starts_at',
                'store_scop',
                'total',
                'value'
              ],
              properties: {
                name: {
                  type: 'string',
                  description: 'max length is 30 characters'
                },
                description: {
                  type: 'string',
                  description: 'max length is 3000 characters'
                },
                value: {
                  type: 'number',
                  description: 'between 0 - 0.99'
                },
                refund: {
                  type: 'number'
                },
                start_at: {
                  type: 'string',
                  format: 'date',
                  description: 'iso date string'
                },
                expire_at: {
                  type: 'string',
                  description: 'is date string'
                },
                product_scope: {
                  type: 'string',
                  description: 'all, partial'
                },
                unlimit: {
                  type: 'boolean',
                  description: 'required when product scope is all'
                },
                total: {
                  type: 'number',
                  description: 'required when unlimit is true'
                },
                products: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      product_id: {
                        type: 'string'
                      },
                      model_scope: {
                        type: 'string'
                      },
                      models: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            model_id: {
                              type: 'string'
                            },
                            unlimited: {
                              type: 'boolean'
                            },
                            total: {
                              type: 'number'
                            }
                          }
                        }
                      },
                      unlimited: {
                        type: 'boolean'
                      },
                      total: {
                        type: 'number'
                      }
                    }
                  },
                  description: 'required when product scope is partial'
                },
                store_id: {
                  type: 'string'
                },
                conditions: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      type: {
                        type: 'string',
                        description: 'min-quantity | max-payment'
                      },
                      value: {
                        type: 'string',
                        description: 'required when type is existed'
                      }
                    }
                  }
                },
                max_discount: {
                  type: 'number'
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
  '/s_/promotion/owner/{id}': {
    get: {
      tags: ['promotion'],
      summary: 'get owner protion by id',
      parameters: [pathIDSchema],
      responses: response200
    }
  },
  '/s_/promotion/owner/disabled': {
    put: {
      tags: ['promotion'],
      summary: 'disabled promotion',
      description: 'disabled promotion',
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['promotion_id'],
              properties: {
                promotion_id: {
                  type: 'string'
                }
              }
            }
          }
        },
        required: true
      },
      responses: {
        ...response200,
        '400': {
          description: "'client.global.notFound':7002400"
        }
      }
    }
  },
  '/s_/promotion/v2/company/': {
    post: {
      tags: ['promotion'],
      summary: 'create owner promotion',
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: [
                'description',
                'expire_at',
                'name',
                'product_scope',
                'refund',
                'start_at',
                'store_scope',
                'total',
                'value',
                'store_id'
              ],
              properties: {
                name: {
                  type: 'string',
                  description: 'max length is 30 characters'
                },
                description: {
                  type: 'string',
                  description: 'max length is 3000 characters'
                },
                value: {
                  type: 'number',
                  description: 'between 0 - 0.99'
                },
                refund: {
                  type: 'number'
                },
                start_at: {
                  type: 'string',
                  format: 'date',
                  description: 'iso date string'
                },
                expire_at: {
                  type: 'string',
                  description: 'is date string'
                },
                product_scope: {
                  type: 'string',
                  description: 'all, partial'
                },
                unlimit: {
                  type: 'boolean',
                  description: 'required when product scope is all'
                },
                total: {
                  type: 'number',
                  description: 'required when unlimit is false'
                },
                products: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      product_id: {
                        type: 'string'
                      },
                      model_scope: {
                        type: 'string'
                      },
                      models: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            model_id: {
                              type: 'string'
                            },
                            unlimited: {
                              type: 'boolean'
                            },
                            total: {
                              type: 'number'
                            }
                          }
                        }
                      },
                      unlimited: {
                        type: 'boolean'
                      },
                      total: {
                        type: 'number'
                      }
                    }
                  },
                  description: 'required when product scope is partial'
                },
                store_id: {
                  type: 'string'
                },
                conditions: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      type: {
                        type: 'string',
                        description: 'min-quantity | max-payment'
                      },
                      value: {
                        type: 'string',
                        description: 'required when type is existed'
                      }
                    }
                  }
                },
                max_discount: {
                  type: 'number'
                }
              }
            }
          }
        },
        required: true
      },
      responses: response200
    },
    put: {
      tags: ['promotion'],
      summary: 'update owner promotion',
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: [
                'promotion_id',
                'store_id',
                'expire_at',
                'start_at',
                'product_scope',
                'refund',
                'total',
                'value'
              ],
              properties: {
                name: {
                  type: 'string',
                  description: 'max length is 30 characters'
                },
                description: {
                  type: 'string',
                  description: 'max length is 3000 characters'
                },
                value: {
                  type: 'number',
                  description: 'between 0 - 0.99'
                },
                refund: {
                  type: 'number'
                },
                start_at: {
                  type: 'string',
                  format: 'date',
                  description: 'iso date string'
                },
                expire_at: {
                  type: 'string',
                  description: 'is date string'
                },
                product_scope: {
                  type: 'string',
                  description: 'all, partial'
                },
                unlimit: {
                  type: 'boolean',
                  description: 'required when product scope is all'
                },
                total: {
                  type: 'number',
                  description: 'required when unlimit is false'
                },
                products: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      product_id: {
                        type: 'string'
                      },
                      model_scope: {
                        type: 'string'
                      },
                      models: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            model_id: {
                              type: 'string'
                            },
                            unlimited: {
                              type: 'boolean'
                            },
                            total: {
                              type: 'number'
                            }
                          }
                        }
                      },
                      unlimited: {
                        type: 'boolean'
                      },
                      total: {
                        type: 'number'
                      }
                    }
                  },
                  description: 'required when product scope is partial'
                },
                store_id: {
                  type: 'string'
                },
                conditions: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      type: {
                        type: 'string',
                        description: 'min-quantity | max-payment'
                      },
                      value: {
                        type: 'string',
                        description: 'required when type is existed'
                      }
                    }
                  }
                },
                max_discount: {
                  type: 'number'
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
  '/s_/promotion/v2/company/status': {
    put: {
      tags: ['promotion'],
      summary: 'update owner promotion status',
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['promotion_id', 'status'],
              properties: {
                promotion_id: {
                  type: 'string'
                },
                status: {
                  schema: {
                    type: 'string',
                    valid: 'active, disabled'
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
  '/s_/promotion/v2/admin/{id}': {
    get: {
      tags: ['promotion'],
      summary: 'admin get promotion by id',
      parameters: [pathIDSchema],
      responses: response200
    }
  }
};
