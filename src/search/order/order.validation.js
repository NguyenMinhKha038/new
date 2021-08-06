import Joi from '@hapi/joi';
import { pathIdSchema, textSchema } from '../../commons/utils';
import { OrderStatusTypes, OrderStatus, PopulatedFields } from './order.config';
import { SaleForms } from './v2/order.config';

export default {
  user: {
    pay: {
      params: {
        code: Joi.string().min(9).max(12).required()
      },
      body: {
        // payment_method: Joi.valid('WALLET', 'CASH', 'VNPAY')
        payment_method: Joi.valid('WALLET', 'CASH')
      }
    },
    confirm: {
      params: {
        code: Joi.string().min(9).max(12).required()
      },
      body: {
        note: Joi.string().max(256)
      }
    },
    confirmAndPay: {
      params: {
        code: Joi.string().min(9).max(12).required()
      },
      body: {
        payment_method: Joi.valid('WALLET', 'CASH', 'VNPAY'),
        note: Joi.string().max(256)
      }
    },
    getUnconfirmed: {
      query: {
        store_id: Joi.string()
          .regex(/^[0-9a-fA-F]{24}$/, { name: 'object id' })
          .required(),
        limit: Joi.number().min(0).max(50),
        page: Joi.number().integer().min(1),
        select: Joi.string(),
        sort: Joi.string(),
        populate: Joi.string()
      }
    },
    get: {
      query: {
        is_received_at_store: Joi.boolean(),
        date: Joi.date().iso(),
        progress_status: Joi.string().valid('pending', 'handling', 'ready'),
        limit: Joi.number().min(1).max(50),
        page: Joi.number().min(1),
        select: Joi.string(),
        sort: Joi.string(),
        status: Joi.string().valid(Object.values(OrderStatus))
      }
    },
    getByCode: {
      params: {
        code: Joi.string()
      }
    },

    put: {
      body: {
        status: Joi.string().valid('user_canceled'),
        reason_canceled: Joi.string().min(0).max(256)
      }
    },
    post: {
      body: {
        store_id: Joi.string()
          .regex(/^[0-9a-fA-F]{24}$/, {
            name: 'object id'
          })
          .required(),
        company_id: Joi.string()
          .regex(/^[0-9a-fA-F]{24}$/, {
            name: 'object id'
          })
          .required(),
        position: Joi.string(),
        note: Joi.string().allow(''),
        products: Joi.array()
          .min(1)
          .items(
            Joi.object({
              product_storing_id: Joi.string()
                .regex(/^[0-9a-fA-F]{24}$/, { name: 'object id' })
                .required(),
              quantity: Joi.number().integer().min(1).required(),
              note: Joi.string().allow(''),
              options: Joi.array()
                .items({
                  type_option_id: pathIdSchema.required(),
                  option_id: pathIdSchema.required()
                })
                .unique()
                .min(1),
              model_id: pathIdSchema.required(),
              accompanied_products: Joi.array()
                .items({
                  product_storing_id: pathIdSchema.required(),
                  quantity: Joi.number().integer().min(1).required()
                })
                .unique((p1, p2) => p1.product_storing_id === p2.product_storing_id)
                .min(1),
              type: Joi.string().valid(Object.values(SaleForms)).required()
            })
          )
          .required()
      }
    },
    countStatus: {
      query: { statuses: Joi.string().required() }
    }
  },
  company: {
    pay: {
      params: {
        code: Joi.string().max(12).required()
      },
      body: {
        payment_method: Joi.string().valid('WALLET', 'CASH').required(),
        payment_code: Joi.number()
          .max(1e13)
          .when('payment_method', { is: 'WALLET', then: Joi.required() }),
        phone_number: Joi.string().max(12),
        store_id: Joi.string().regex(/^[0-9a-fA-F]{24}$/, { name: 'object id' })
      }
    },
    post: {
      body: {
        store_id: Joi.string().regex(/^[0-9a-fA-F]{24}$/, {
          name: 'object id'
        }),
        without_product: Joi.bool().required(),
        total: Joi.number().integer().greater(1).when('without_product', {
          is: true,
          then: Joi.required()
        }),
        products: Joi.array()
          .min(1)
          .items(
            Joi.object({
              product_storing_id: Joi.string()
                .regex(/^[0-9a-fA-F]{24}$/, { name: 'object id' })
                .required(),
              quantity: Joi.number().integer().min(1).required()
            })
          )
          .unique((a, b) => a.product_storing_id === b.product_storing_id)
          .when('without_product', {
            is: false,
            then: Joi.required()
          }),
        note: Joi.string().trim().allow('')
      }
    },
    confirm: {
      body: {
        code: Joi.string().max(12).required(),
        note: Joi.string().allow('')
      }
    },
    confirmOffline: {
      body: {
        code: Joi.string().max(12).required(),
        note: Joi.string().allow('')
      }
    },
    get: {
      query: {
        is_received_at_store: Joi.boolean(),
        date: Joi.date().iso(),
        progress_status: Joi.string().valid('pending', 'handling', 'ready'),
        limit: Joi.number().min(1).max(50),
        page: Joi.number().min(1),
        select: Joi.string(),
        sort: Joi.string(),
        status: Joi.string().valid(Object.values(OrderStatus)),
        type: Joi.string().valid('online', 'offline'),
        start_time: Joi.date().iso(),
        end_time: Joi.date().iso().min(Joi.ref('start_time')),
        staff_id: Joi.string().regex(/^[0-9a-fA-F]{24}$/, {
          name: 'object id'
        }),
        store_id: Joi.string().regex(/^[0-9a-fA-F]{24}$/, {
          name: 'object id'
        }),
        promotion_id: Joi.string().regex(/^[0-9a-fA-F]{24}$/, {
          name: 'object id'
        }),
        populate: textSchema
      }
    },
    get_v2: {
      query: {
        limit: Joi.number().min(1).max(50),
        page: Joi.number().min(1),
        sort: Joi.string(),
        without_product: Joi.boolean(),
        status: Joi.string().valid([
          'completed',
          'picking',
          'user_canceled',
          'company_canceled',
          'handling',
          'delivering',
          'delivered',
          'user_rejected'
        ]),
        type: Joi.string().valid('online', 'offline'),
        user_id: Joi.string().regex(/^[0-9a-fA-F]{24}$/, { name: 'object id' }),
        store_id: Joi.string().regex(/^[0-9a-fA-F]{24}$/, { name: 'object id' }),
        company_id: Joi.string().regex(/^[0-9a-fA-F]{24}$/, { name: 'object id' }),
        is_created_from_menu: Joi.boolean(),
        position: Joi.string(),
        progress_status: Joi.string().valid('pending', 'handling', 'ready'),
        code: Joi.string(),
        payment_method: Joi.string().valid('CASH', 'WALLET', 'VNPAY'),
        is_confirmed: Joi.boolean(),
        is_paid: Joi.boolean(),
        seller_id: Joi.string().regex(/^[0-9a-fA-F]{24}$/, { name: 'object id' }),
        cashier_id: Joi.string().regex(/^[0-9a-fA-F]{24}$/, { name: 'object id' }),
        user_name: Joi.string().trim(),
        user_phone: Joi.string().trim(),
        from_date: Joi.date().timestamp(),
        to_date: Joi.date().timestamp().min(Joi.ref('from_date')),
        date: Joi.date().timestamp(),
        is_received_at_store: Joi.boolean()
      }
    },
    getByCode: {
      params: {
        code: Joi.string().required()
      },
      query: {
        populate: textSchema
      }
    },
    put: {
      body: {
        status: Joi.string().valid('company_canceled', 'delivered', 'user_rejected'),
        progress_status: Joi.string().valid('ready'),
        reason_canceled: Joi.string().min(0).max(256),
        reason_rejected: Joi.string().min(0).max(256)
      }
    },
    updateOfflineOrderStatus: {
      params: {
        code: Joi.string().required()
      },
      body: {
        type: Joi.string().valid(Object.keys(OrderStatusTypes)).required(),
        value: Joi.string().when(Joi.ref('type'), {
          is: 'status',
          then: Joi.valid(OrderStatusTypes['status']),
          otherwise: Joi.valid(OrderStatusTypes['progress_status'])
        }),
        reason_canceled: Joi.string().min(0).max(256),
        reason_rejected: Joi.string().min(0).max(256)
      }
    },
    statisticCustomer: {
      // type: Joi.string().valid(['customer','store']).required(),
      sort: Joi.string(),
      limit: Joi.number(),
      page: Joi.number(),
      store_id: Joi.string().regex(/^[0-9a-fA-F]{24}$/, { name: 'object id' }),
      user_id: Joi.string().regex(/^[0-9a-fA-F]{24}$/, { name: 'object id' }),
      created_from: Joi.date().iso(),
      created_to: Joi.date().iso().min(Joi.ref('created_from')),
      type: Joi.string().valid('normal', 'anonymous')
    },
    statisticProduct: {
      query: {
        type: Joi.string().default('product'),
        created_from: Joi.date().iso().required(),
        created_to: Joi.date().iso().required(),
        status: Joi.string(),
        store_id: Joi.string().regex(/^[0-9a-fA-F]{24}$/, { name: 'object id' })
      }
    }
  },
  admin: {
    get: {
      query: {
        is_received_at_store: Joi.boolean(),
        date: Joi.date().iso(),
        progress_status: Joi.string().valid('pending', 'handling', 'ready'),
        limit: Joi.number().min(1).max(50),
        page: Joi.number().min(1),
        select: Joi.string(),
        code: Joi.string(),
        sort: Joi.string(),
        status: Joi.string().valid(Object.values(OrderStatus)),
        type: Joi.string().valid('online', 'offline'),
        company_id: Joi.string().regex(/^[0-9a-fA-F]{24}$/, {
          name: 'object id'
        }),
        product_id: Joi.string().regex(/^[0-9a-fA-F]{24}$/, {
          name: 'object id'
        }),
        seller_id: Joi.string().regex(/^[0-9a-fA-F]{24}$/, {
          name: 'object id'
        }),
        cashier_id: Joi.string().regex(/^[0-9a-fA-F]{24}$/, {
          name: 'object id'
        }),
        user_id: Joi.string().regex(/^[0-9a-fA-F]{24}$/, { name: 'object id' }),
        start_time: Joi.date().iso(),
        end_time: Joi.date().iso(),
        is_lucky: Joi.boolean()
        // progress_status: Joi.string().valid('pending', 'handling', 'ready')
      }
    },
    getByCode: {
      params: {
        code: Joi.string()
      }
    },
    approve: {
      body: {
        code: Joi.string().max(12).required()
      }
    },
    payFee: {
      body: {
        code: Joi.string().max(12).required()
      }
    },
    statistic: {
      query: {
        start_time: Joi.date().iso(),
        end_time: Joi.date().iso().min(Joi.ref('start_time')),
        company_id: Joi.string().regex(/^[0-9a-fA-F]{24}$/, {
          name: 'object id'
        }),
        type: Joi.string().valid(['online', 'offline']).allow(''),
        status: Joi.string().valid(Object.values(OrderStatus))
      }
    }
  }
};
