import Joi from '@hapi/joi';
import { pathIdSchema, textSchema } from '../../commons/utils';
export default {
  get: {
    query: {
      limit: Joi.number().min(1).max(50),
      page: Joi.number().min(1),
      select: Joi.string(),
      sort: Joi.string(),
      category_id: Joi.string().regex(/^[0-9a-fA-F]{24}$/, {
        name: 'object id'
      }),
      store_id: Joi.string().regex(/^[0-9a-fA-F]{24}$/, { name: 'object id' }),
      company_id: Joi.string().regex(/^[0-9a-fA-F]{24}$/, {
        name: 'object id'
      }),
      is_lucky: Joi.boolean(),
      updated_from: Joi.date().iso().max('now'),
      updated_to: Joi.date().iso().min(Joi.ref('updated_from')),
      created_from: Joi.date().iso().max('now'),
      created_to: Joi.date().iso().min(Joi.ref('updated_from')),
      'model_list._id': pathIdSchema,
      'model_list.SKU': textSchema
    }
  },
  getTop: {
    query: {
      category_ids: Joi.string(),
      limit: Joi.number().min(1).max(50),
      type: Joi.number().default(1)
    }
  },
  getById: {
    params: {
      id: Joi.string()
        .regex(/^[0-9a-fA-F]{24}$/, { name: 'object id' })
        .required()
    },
    query: {
      select: Joi.string()
    }
  },
  getTransportFee: {
    query: {
      company_id: Joi.string()
        .regex(/^[0-9a-fA-F]{24}$/, { name: 'object id' })
        .required(),
      product_id: Joi.string()
        .regex(/^[0-9a-fA-F]{24}$/, { name: 'object id' })
        .required()
    }
  },
  company: {
    get: {
      query: {
        limit: Joi.number().min(0).max(50),
        page: Joi.number().min(1),
        select: Joi.string(),
        sort: Joi.string(),
        pid: Joi.string(),
        SKU: Joi.string(),
        category_id: Joi.string().regex(/^[0-9a-fA-F]{24}$/, {
          name: 'object id'
        }),
        type_category_id: Joi.string().regex(/^[0-9a-fA-F]{24}$/, {
          name: 'object id'
        }),
        company_category_id: Joi.string().regex(/^[0-9a-fA-F]{24}$/, {
          name: 'object id'
        }),
        sub_category_id: Joi.string().regex(/^[0-9a-fA-F]{24}$/, {
          name: 'object id'
        }),
        _id: Joi.string().regex(/^[0-9a-fA-F]{24}$/, {
          name: 'object id'
        }),
        product_ids: Joi.array().items(
          Joi.string().regex(/^[0-9a-fA-F]{24}$/, {
            name: 'object id'
          })
        ),
        store_id: Joi.string().regex(/^[0-9a-fA-F]{24}$/, {
          name: 'object id'
        }),
        status: Joi.alternatives().try(
          Joi.array().items(Joi.string().valid('pending', 'approved', 'disabled', 'rejected')),
          Joi.string().valid('pending', 'approved', 'disabled', 'rejected')
        ),
        populate: Joi.string().valid(''),
        text: Joi.string().trim().max(200),
        updated_from: Joi.date().iso().max('now'),
        updated_to: Joi.date().iso().min(Joi.ref('updated_from')),
        created_from: Joi.date().iso().max('now'),
        created_to: Joi.date().iso().min(Joi.ref('updated_from')),
        'model_list.model_id': pathIdSchema,
        'model_list.SKU': textSchema
      }
    },
    getById: {
      params: {
        id: Joi.string()
          .regex(/^[0-9a-fA-F]{24}$/, { name: 'object id' })
          .required()
      }
    },
    post: {
      body: {
        name: Joi.string().trim().min(8).max(256).required(),
        description: Joi.string().trim().min(80).max(3096).required(),
        price: Joi.number().positive().required(),
        status: Joi.string().valid('disabled', 'pending'),
        thumbnail: Joi.string().required(),
        images: Joi.array().items(Joi.string().trim()),
        stock: Joi.object()
          .pattern(/^[0-9a-fA-F]{24}$/, Joi.number().min(0))
          .strip(),
        condition: Joi.string().max(256),
        category_id: Joi.string()
          .regex(/^[0-9a-fA-F]{24}$/, {
            name: 'object id'
          })
          .required(),
        refund_rate: Joi.number().greater(0).max(1).required(),
        transportable: Joi.boolean(),
        packaging_weight: Joi.number()
          .integer()
          .min(0)
          .required()
          .when('transportable', { is: false, then: Joi.optional() }),
        packaging_width: Joi.number().integer().min(0),
        packaging_length: Joi.number().integer().min(0),
        packaging_height: Joi.number().integer().min(0),
        is_free_transport: Joi.boolean(),
        is_limited_stock: Joi.boolean(),
        SKU: Joi.string(),
        original_price: Joi.number().positive(),
        warranty_information: Joi.string().trim().max(1024),
        origin: Joi.string().trim().max(100)
      }
    },
    put: {
      params: {
        id: Joi.string()
          .regex(/^[0-9a-fA-F]{24}$/, { name: 'object id' })
          .required()
      },
      body: {
        name: Joi.string().trim().min(8).max(256),
        description: Joi.string().trim().min(80).max(3096),
        price: Joi.number().min(0),
        // store_id: Joi.array().items(Joi.string().regex(/^[0-9a-fA-F]{24}$/, { name: 'object id' })),
        status: Joi.string().valid('disabled', 'pending'),
        condition: Joi.string().max(256),
        thumbnail: Joi.string(),
        images: Joi.array().items(Joi.string().trim()),
        category_id: Joi.string().regex(/^[0-9a-fA-F]{24}$/, {
          name: 'object id'
        }),
        stock: Joi.object()
          .pattern(/^[0-9a-fA-F]{24}$/, Joi.number().min(0))
          .strip(),
        refund_rate: Joi.number().min(0).max(1),
        transportable: Joi.boolean(),
        packaging_weight: Joi.number().integer().min(0),
        packaging_width: Joi.number().integer().min(0),
        packaging_length: Joi.number().integer().min(0),
        packaging_height: Joi.number().integer().min(0),
        is_free_transport: Joi.boolean(),
        is_limited_stock: Joi.boolean(),
        SKU: Joi.string(),
        warranty_information: Joi.string().trim().max(1024),
        origin: Joi.string().trim().max(100)
      }
    },
    delete: {
      params: {
        id: Joi.string()
          .regex(/^[0-9a-fA-F]{24}$/, { name: 'object id' })
          .required()
      }
    },
    updateStock: {
      body: {
        productStorings: Joi.array().items({
          id: Joi.string()
            .regex(/^[0-9a-fA-F]{24}$/, { name: 'object id' })
            .required(),
          stock: Joi.number().integer().required()
        })
      }
    },
    createMoveStockRequest: {
      body: {
        product_id: Joi.string()
          .regex(/^[0-9a-fA-F]{24}$/, { name: 'object id' })
          .required(),
        from_store_id: Joi.string()
          .regex(/^[0-9a-fA-F]{24}$/, { name: 'object id' })
          .required(),
        to_store_id: Joi.string()
          .regex(/^[0-9a-fA-F]{24}$/, { name: 'object id' })
          .required(),
        stock: Joi.number().integer().min(1).required()
      }
    },
    confirmMoveStockRequest: {
      body: {
        product_stock_history_id: Joi.string()
          .regex(/^[0-9a-fA-F]{24}$/, { name: 'object id' })
          .required(),
        stock: Joi.number().integer(),
        note: Joi.string().trim(),
        status: Joi.string().only(['completed', 'cancelled']).required()
      }
    }
  },
  user: {
    like: {
      body: {
        id: Joi.string()
          .regex(/^[0-9a-fA-F]{24}$/, { name: 'object id' })
          .required(),
        state: Joi.string().valid('like', 'unlike').required()
      }
    },
    share: {
      body: {
        id: Joi.string()
          .regex(/^[0-9a-fA-F]{24}$/, { name: 'object id' })
          .required()
      }
    },
    favorite: {
      body: {
        id: Joi.string()
          .regex(/^[0-9a-fA-F]{24}$/, { name: 'object id' })
          .required(),
        state: Joi.string().valid(['favorite', 'unfavorite']).required()
      }
    },
    view: {
      body: {
        id: Joi.string()
          .regex(/^[0-9a-fA-F]{24}$/, { name: 'object id' })
          .required()
      }
    },
    getFavorite: {
      query: {
        limit: Joi.number().min(0).max(50),
        page: Joi.number().min(1),
        select: Joi.string(),
        sort: Joi.string()
      }
    },
    getView: {
      query: {
        limit: Joi.number().min(0).max(50),
        page: Joi.number().min(1),
        select: Joi.string(),
        sort: Joi.string()
      }
    }
  },
  admin: {
    get: {
      query: {
        limit: Joi.number().min(1).max(50),
        page: Joi.number().min(1),
        select: Joi.string(),
        sort: Joi.string(),
        pid: Joi.string(),
        SKU: Joi.string(),
        store_id: Joi.string().regex(/^[0-9a-fA-F]{24}$/, {
          name: 'object id'
        }),
        category_id: Joi.string().regex(/^[0-9a-fA-F]{24}$/, {
          name: 'object id'
        }),
        company_id: Joi.string().regex(/^[0-9a-fA-F]{24}$/, {
          name: 'object id'
        }),
        status: Joi.string().valid('pending', 'approved', 'disabled', 'rejected'),
        start_time: Joi.date().iso(),
        end_time: Joi.date().iso(),
        _id: Joi.string().regex(/^[0-9a-fA-F]{24}$/, {
          name: 'object id'
        }),
        product_ids: Joi.array().items(
          Joi.string().regex(/^[0-9a-fA-F]{24}$/, {
            name: 'object id'
          })
        ),
        text: Joi.string().trim().max(200),
        updated_from: Joi.date().iso().max('now'),
        updated_to: Joi.date().iso().min(Joi.ref('updated_from')),
        created_from: Joi.date().iso().max('now'),
        created_to: Joi.date().iso().min(Joi.ref('updated_from'))
      }
    },
    getById: {
      params: {
        id: Joi.string()
          .regex(/^[0-9a-fA-F]{24}$/, { name: 'object id' })
          .required()
      }
    },
    statisticBySubCategory: {
      company_id: Joi.string().regex(/^[0-9a-fA-F]{24}$/, { name: 'object id' })
    },
    approve: {
      body: {
        id: Joi.string()
          .regex(/^[0-9a-fA-F]{24}$/, { name: 'object id' })
          .required(),
        status: Joi.string().valid('approved', 'rejected').required()
      }
    }
  }
};
