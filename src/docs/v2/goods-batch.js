import findSchema, {
  limitSchema,
  idSchema,
  selectSchema,
  statusSchema,
  booleanSchema,
  numberSchema,
  textSchema,
  isoDateSchema,
  populateSchema
} from '../commons/find.schema';
import pathIDSchema from '../commons/path-id.schema';
import withSchema from '../commons/with-schema';
import { response200, response201 } from '../commons/responses.schema';

export default {
  '/s_/goods-batch/{id}': {
    get: {
      summary: 'stock staff get goods batch by id',
      tags: ['goods-batch'],
      parameters: [pathIDSchema, selectSchema, populateSchema],
      responses: response200
    }
  },
  '/s_/goods-batch/': {
    get: {
      summary: 'stock staff browse goods batches',
      tags: ['goods-batch'],
      parameters: [
        ...findSchema,
        populateSchema,
        withSchema(idSchema, { name: '_id' }),
        withSchema(textSchema, { name: 'batch_code' }),
        withSchema(idSchema, { name: 'product_id' }),
        withSchema(isoDateSchema, { name: 'manufacturing_date_from' }),
        withSchema(isoDateSchema, { name: 'manufacturing_date_to' }),
        withSchema(isoDateSchema, { name: 'expiry_date_from' }),
        withSchema(isoDateSchema, { name: 'expiry_date_to' }),
        withSchema(isoDateSchema, { name: 'stock_keeping_unit' }),
        withSchema(isoDateSchema, {
          name: 'place_of_stock',
          'schema.enum': ['mall', 'warehouse', 'store']
        }),
        withSchema(idSchema, { name: 'company_id' }),
        withSchema(idSchema, { name: 'mall_id' }),
        withSchema(idSchema, { name: 'store_id' }),
        withSchema(idSchema, { name: 'provider_id' }),
        withSchema(booleanSchema, {
          name: 'on_sales',
          description: 'true: on_sales_stock > 0, otherwise: false'
        }),
        withSchema(booleanSchema, {
          name: 'in_stock',
          description: 'true: stock > 0, otherwise, false'
        }),
        withSchema(booleanSchema, {
          name: 'out_of_stock',
          description: 'true: on_sales_stock + stock <= 0, otherwise, true'
        })
      ],
      responses: response200
    }
  },
  '/s_/goods-batch/admin/{id}': {
    get: {
      summary: 'admin get goods batch by id',
      tags: ['goods-batch'],
      parameters: [pathIDSchema, selectSchema, populateSchema],
      responses: response200
    }
  },
  '/s_/goods-batch/admin': {
    get: {
      summary: 'admin get goods batches',
      tags: ['goods-batch'],
      parameters: [
        ...findSchema,
        populateSchema,
        withSchema(idSchema, { name: '_id' }),
        withSchema(textSchema, { name: 'batch_code' }),
        withSchema(idSchema, { name: 'product_id' }),
        withSchema(booleanSchema, { name: 'on_sales' }),
        withSchema(statusSchema, {
          name: 'status',
          'schema.enum': ['active', 'disabled', 'exported']
        }),
        withSchema(isoDateSchema, { name: 'import_date_from' }),
        withSchema(isoDateSchema, { name: 'import_date_to' }),
        withSchema(isoDateSchema, { name: 'export_date_from' }),
        withSchema(isoDateSchema, { name: 'export_date_to' }),
        withSchema(isoDateSchema, { name: 'manufacturing_date_from' }),
        withSchema(isoDateSchema, { name: 'manufacturing_date_to' }),
        withSchema(isoDateSchema, { name: 'expiry_date_from' }),
        withSchema(isoDateSchema, { name: 'expiry_date_to' }),
        withSchema(isoDateSchema, { name: 'stock_keeping_unit' }),
        withSchema(booleanSchema, { name: 'on_sales' }),
        withSchema(isoDateSchema, {
          name: 'place_of_stock',
          'schema.enum': ['mall', 'warehouse', 'store']
        }),
        withSchema(idSchema, { name: 'company_id' }),
        withSchema(idSchema, { name: 'mall_id' }),
        withSchema(idSchema, { name: 'store_id' }),
        withSchema(idSchema, { name: 'provider_id' }),
        withSchema(booleanSchema, { name: 'out_of_stock' })
      ],
      responses: response200
    }
  },
  '/s_/goods-batch/company-mall/{id}': {
    get: {
      summary: '[warehouse|store|mall] stock staff get goods batch by id',
      tags: ['goods-batch'],
      parameters: [pathIDSchema, selectSchema, populateSchema],
      responses: response200
    },
    put: {
      summary: 'stock staff update goods batch by id',
      tags: ['goods-batch'],
      parameters: [pathIDSchema],
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                manufacturing_date: { type: 'string' },
                expiry_date: { type: 'string' },
                origin: { type: 'string' },
                stock_keeping_unit: { type: 'string' },
                batch_stock: {
                  type: 'number'
                },
                on_sales_stock: {
                  type: 'number'
                },
                provider_id: { type: 'string' },
                note: { type: 'string' },
                on_sales: { type: 'boolean' }
              }
            }
          }
        }
      },
      responses: response200
    },
    delete: {
      summary: 'stock staff delete goods batch by id',
      tags: ['goods-batch'],
      parameters: [pathIDSchema],
      responses: response200
    }
  },
  '/s_/goods-batch/company-mall/sku/{sku}': {
    get: {
      deprecated: true,
      summary: '[warehouse|store|mall] stock staff get goods batch by sku',
      tags: ['goods-batch'],
      parameters: [
        withSchema(textSchema, { name: 'sku', required: true }),
        selectSchema,
        populateSchema
      ],
      responses: response200
    }
  },
  '/s_/goods-batch/company-mall/': {
    get: {
      summary: '[warehouse|store|mall] stock staff get goods batches',
      tags: ['goods-batch'],
      parameters: [
        ...findSchema,
        populateSchema,
        withSchema(idSchema, { name: '_id' }),
        withSchema(textSchema, { name: 'batch_code' }),
        withSchema(idSchema, { name: 'product_id' }),
        withSchema(booleanSchema, { name: 'on_sales' }),
        withSchema(statusSchema, {
          name: 'status',
          'schema.enum': ['active', 'disabled', 'exported']
        }),
        withSchema(isoDateSchema, { name: 'import_date_from' }),
        withSchema(isoDateSchema, { name: 'import_date_to' }),
        withSchema(isoDateSchema, { name: 'export_date_from' }),
        withSchema(isoDateSchema, { name: 'export_date_to' }),
        withSchema(isoDateSchema, { name: 'manufacturing_date_from' }),
        withSchema(isoDateSchema, { name: 'manufacturing_date_to' }),
        withSchema(isoDateSchema, { name: 'expiry_date_from' }),
        withSchema(isoDateSchema, { name: 'expiry_date_to' }),
        withSchema(isoDateSchema, { name: 'stock_keeping_unit' }),
        withSchema(isoDateSchema, {
          name: 'place_of_stock',
          'schema.enum': ['mall', 'warehouse', 'store']
        }),
        withSchema(idSchema, { name: 'company_id' }),
        withSchema(idSchema, { name: 'mall_id' }),
        withSchema(idSchema, { name: 'store_id' }),
        withSchema(idSchema, { name: 'provider_id' }),
        withSchema(booleanSchema, { name: 'out_of_stock' })
      ],
      responses: response200
    }
  },
  '/s_/goods-batch/request-move': {
    post: {
      summary: '[mall|warehouse|store] stock staff creates a request for moving goods batches',
      tags: ['goods-batch'],
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                moving_type: { type: 'string', required: true },
                requester_type: { type: 'string', enum: ['from', 'to'], required: true },
                ignore_approval: { type: 'boolean', default: false },
                batches: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: { type: 'string', required: true },
                      stock: { type: 'number' }
                    },
                    min: 1,
                    example: { id: '600817044642fcc12ab5dacd', stock: 50 }
                  }
                },
                from_warehouse_id: { type: 'string' },
                to_warehouse_id: { type: 'string' },
                from_store_id: { type: 'string' },
                to_store_id: { type: 'string' },
                from_mall_id: { type: 'string' },
                to_mall_id: { type: 'string' },
                note: { type: 'string' }
              }
            }
          }
        }
      },
      responses: response201
    }
  },
  '/s_/goods-batch/approve-move': {
    post: {
      summary: '[mall|warehouse|store] stock staff approves the move request',
      tags: ['goods-batch'],
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                product_stock_history_id: { type: 'string', required: true },
                batches: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: { type: 'string', required: true },
                      status: { type: 'string', enum: ['approved', 'cancelled'], required: true }
                    },
                    min: 1
                  }
                },
                note: { type: 'string' }
              }
            }
          }
        }
      },
      responses: response200
    }
  },
  '/s_/goods-batch/confirm-move': {
    post: {
      summary: '[mall|warehouse|store] stock staff confirms that received goods batches',
      tags: ['goods-batch'],
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                product_stock_history_id: { type: 'string', required: true },
                batches: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: { type: 'string', required: true },
                      stock: { type: 'number', required: true },
                      position: { type: 'string' }
                    },
                    min: 1,
                    example: {
                      id: '600817044642fcc12ab5dacd',
                      stock: 50,
                      position: 'H3K5'
                    }
                  }
                },
                note: { type: 'string' }
              }
            }
          }
        }
      },
      responses: response200
    }
  },
  '/s_/goods-batch/confirm-difference': {
    post: {
      summary:
        '[mall|warehouse|store] stock staff confirms the difference from requested quantity and received quantity',
      description:
        '[mall|warehouse|store] stock staff confirms the difference from requested quantity and received quantity',
      tags: ['goods-batch'],
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                product_stock_history_id: { type: 'string', required: true },
                batches: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: { type: 'string', required: true },
                      different_move_quantity: { type: 'number', required: true }
                    },
                    min: 1,
                    example: { id: '600817044642fcc12ab5dacd', different_move_quantity: 8 }
                  }
                },
                note: { type: 'string' }
              }
            }
          }
        }
      },
      responses: response200
    }
  },
  '/s_/goods-batch/update-move': {
    post: {
      summary: '[mall|warehouse|store] stock staff updates the move request',
      tags: ['goods-batch'],
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                product_stock_history_id: { type: 'string', required: true },
                status: { type: 'string', enum: ['cancelled'] },
                batches: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: { type: 'string', required: true },
                      stock: { type: 'number', required: true }
                    },
                    min: 1,
                    example: { id: '600817044642fcc12ab5dacd', stock: 40 }
                  }
                },
                note: { type: 'string' }
              }
            }
          }
        }
      },
      responses: response200
    }
  },
  '/s_/goods-batch/import': {
    post: {
      summary: '[mall|warehouse|store] stock staff imports new goods batch',
      tags: ['goods-batch'],
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                place_of_stock: {
                  type: 'string',
                  enum: ['mall', 'warehouse', 'store'],
                  description: 'Only import at `warehouse` now',
                  required: true
                },
                product_id: { type: 'string', required: true },
                model_id: { type: 'string' },
                manufacturing_date: { type: 'string', required: true },
                expiry_date: { type: 'string', required: true },
                stock_keeping_unit: { type: 'string' },
                stock: { type: 'number', required: true },
                mall_id: { type: 'string' },
                warehouse_id: { type: 'string' },
                store_id: { type: 'string' },
                provider_id: { type: 'string', required: true },
                note: { type: 'string' }
              }
            }
          }
        }
      },
      responses: response201
    }
  },
  '/s_/goods-batch/export': {
    post: {
      summary: '[mall|warehouse|store] stock staff exports goods batches',
      description: '[mall|warehouse|store] stock staff exports goods batches',
      tags: ['goods-batch'],
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                batches: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: { type: 'string', required: true },
                      stock: { type: 'number' }
                    },
                    min: 1,
                    example: { id: '600817044642fcc12ab5dacd', stock: 69 }
                  }
                },
                note: { type: 'string' },
                place_of_stock: { type: 'string', enum: ['mall', 'warehouse', 'store'] },
                export_type: { type: 'string', enum: ['destructing', 'other'] },
                warehouse_id: { type: 'string' },
                store_id: { type: 'string' },
                mall_id: { type: 'string' }
              }
            }
          }
        }
      },
      responses: response200
    }
  },
  '/s_/goods-batch/import-export': {
    post: {
      summary: '[mall|store] stock staff imports/exports goods batches for sale',
      description: '[mall|store] stock staff imports/exports goods batches for sale',
      tags: ['goods-batch'],
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                type: { type: 'string', enum: ['local_import', 'local_export'] },
                place_of_stock: { type: 'string', enum: ['mall', 'store'] },
                store_id: { type: 'string' },
                mall_id: { type: 'string' },
                note: { type: 'string' },
                batches: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: { type: 'string' },
                      product_storing_id: { type: 'string' },
                      mall_storing_id: { type: 'string' },
                      stock: { type: 'number' },
                      model_id: { type: 'string' }
                    }
                  }
                }
              }
            },
            responses: response200
          }
        }
      }
    }
  },
  '/s_/goods-batch/company-mall/on-sales/{id}': {
    put: {
      summary: 'stock staff update `on_sales` status of goods batch by id',
      description: 'stock staff update `on_sales` status of goods batch by id',
      tags: ['goods-batch'],
      parameters: [pathIDSchema],
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                on_sales: { type: 'boolean', required: true, example: false },
                stock: {
                  type: 'number',
                  description: 'required when `on_sales` is false',
                  example: 50
                }
              }
            }
          }
        }
      },
      responses: response200
    }
  }
};
