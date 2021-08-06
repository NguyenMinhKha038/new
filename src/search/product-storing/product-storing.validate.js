import Joi from '@hapi/joi';

export default {
  get: {
    query: {
      limit: Joi.number().min(0).max(50),
      page: Joi.number().min(1),
      select: Joi.string(),
      sort: Joi.string(),
      store_id: Joi.string().regex(/^[0-9a-fA-F]{24}$/, { name: 'object id' }),
      product_id: Joi.string().regex(/^[0-9a-fA-F]{24}$/, { name: 'object id' })
    }
  },
  find: {
    query: {
      limit: Joi.number().min(0).max(50),
      page: Joi.number().min(1),
      select: Joi.string(),
      sort: Joi.string(),
      store_id: Joi.string().regex(/^[0-9a-fA-F]{24}$/, { name: 'object id' }),
      product_id: Joi.string().regex(/^[0-9a-fA-F]{24}$/, { name: 'object id' }),
      populate_store: Joi.boolean().default(false),
      product_status: Joi.string().when('product_id', {
        is: Joi.exist(),
        then: Joi.forbidden(),
        otherwise: Joi.valid(['pending', 'disabled', 'approved', 'rejected'])
      }),
      active: Joi.boolean(),
      is_active_product: Joi.boolean(),
      product_ids: Joi.array().items(Joi.string())
    }
  },
  importProductToStore: {
    body: {
      products: Joi.array().items({
        _id: Joi.string()
          .regex(/^[0-9a-fA-F]{24}$/, { name: 'object id' })
          .required(),
        stock: Joi.number().integer().min(0).default(0)
      }),
      store_id: Joi.string()
        .regex(/^[0-9a-fA-F]{24}$/, { name: 'object id' })
        .required()
    }
  },
  update: {
    params: {
      product_storing_id: Joi.string()
        .regex(/^[0-9a-fA-F]{24}$/, { name: 'object id' })
        .required()
    },
    body: {
      active: Joi.boolean()
    }
  },
  search: {
    query: {
      store_id: Joi.string().regex(/^[0-9a-fA-F]{24}$/, { name: 'object id' }),
      query: Joi.string().max(256),
      limit: Joi.number().max(50)
    }
  },
  updateStock: {
    body: {
      type: Joi.string().valid(['import', 'export']).required(),
      productStorings: Joi.array().items({
        id: Joi.string()
          .regex(/^[0-9a-fA-F]{24}$/, { name: 'object id' })
          .required(),
        stock: Joi.number().integer().positive().required()
      }),
      note: Joi.string().trim().max(300),
      provider: Joi.string().trim().min(1).max(200)
    }
  },
  createMoveStockRequest: {
    body: {
      product_id: Joi.string().regex(/^[0-9a-fA-F]{24}$/, { name: 'object id' }),
      stock: Joi.when('product_id', {
        is: Joi.exist(),
        then: Joi.number().integer().min(1).required()
      }),
      products: Joi.array()
        .items({
          id: Joi.string()
            .regex(/^[0-9a-fA-F]{24}$/, { name: 'object id' })
            .required(),
          stock: Joi.number().integer().min(1).required()
        })
        .min(1)
        .unique((a, b) => a.id === b.id),
      from_store_id: Joi.string()
        .regex(/^[0-9a-fA-F]{24}$/, { name: 'object id' })
        .required(),
      to_store_id: Joi.string()
        .regex(/^[0-9a-fA-F]{24}$/, { name: 'object id' })
        .required(),
      note: Joi.string().trim().max(300)
    }
  },
  approveMoveStockRequest: {
    body: {
      product_stock_history_id: Joi.string()
        .regex(/^[0-9a-fA-F]{24}$/, { name: 'object id' })
        .required(),
      products: Joi.array()
        .items({
          id: Joi.string()
            .regex(/^[0-9a-fA-F]{24}$/, { name: 'object id' })
            .required(),
          stock: Joi.number().integer().min(1),
          status: Joi.string().only(['approved', 'cancelled']).required()
        })
        .min(1)
        .unique((a, b) => a.id === b.id)
        .allow(null)
        .default(null),
      note: Joi.string().trim().max(300),
      status: Joi.string()
        .only(['approved', 'cancelled'])
        .when('products', { is: null, then: Joi.required() })
    }
  },
  confirmMoveStockRequest: {
    body: {
      product_stock_history_id: Joi.string()
        .regex(/^[0-9a-fA-F]{24}$/, { name: 'object id' })
        .required(),
      products: Joi.array()
        .items({
          id: Joi.string()
            .regex(/^[0-9a-fA-F]{24}$/, { name: 'object id' })
            .required(),
          stock: Joi.number().integer().min(1),
          status: Joi.string().only(['completed', 'cancelled']).default('completed')
        })
        .min(1)
        .unique((a, b) => a.id === b.id)
        .allow(null)
        .default(null),
      status: Joi.string()
        .only(['completed', 'cancelled'])
        .when('products', { is: null, then: Joi.required() }),
      note: Joi.string().trim().max(300)
    }
  }
};
