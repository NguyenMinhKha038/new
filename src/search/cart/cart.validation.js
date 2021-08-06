import Joi from '@hapi/joi';

export default {
  user: {
    get: {
      query: {
        limit: Joi.number().min(1).max(50),
        page: Joi.number().min(1),
        select: Joi.string(),
        sort: Joi.string(),
        is_paid: Joi.bool()
      }
    },
    addProduct: {
      body: {
        company_id: Joi.string()
          .regex(/^[0-9a-fA-F]{24}$/, { name: 'object id' })
          .required(),
        product_id: Joi.string()
          .regex(/^[0-9a-fA-F]{24}$/, { name: 'object id' })
          .required(),
        quantity: Joi.number().integer().min(1),
        promotion_code: Joi.string(),
        has_promotion: Joi.bool()
      }
    },
    removeProduct: {
      body: {
        product_id: Joi.string()
          .regex(/^[0-9a-fA-F]{24}$/, { name: 'object id' })
          .required(),
        company_id: Joi.string()
          .regex(/^[0-9a-fA-F]{24}$/, { name: 'object id' })
          .required()
      }
    },
    checkout: {
      body: {
        address_id: Joi.string().regex(/^[0-9a-fA-F]{24}$/, { name: 'object id' }),
        payment_method: Joi.string().valid('COD', 'WALLET', 'VNPAY').required(),
        order: {
          logistics_provider: Joi.string(),
          is_received_at_store: Joi.boolean(),
          company_id: Joi.string()
            .regex(/^[0-9a-fA-F]{24}$/, { name: 'object id' })
            .when('is_received_at_store', { is: Joi.exist(), then: Joi.required() }),
          expected_received_date: Joi.date()
            .iso()
            .greater('now')
            .when('is_received_at_store', { is: true, then: Joi.required() }),
          note: Joi.string().allow('').max(1024),
          store_id: Joi.string()
            .regex(/^[0-9a-fA-F]{24}$/, { name: 'object id' })
            .when('is_received_at_store', { is: true, then: Joi.required() })
        }
      }
    },
    confirm: {
      body: {
        company_id: Joi.string().regex(/^[0-9a-fA-F]{24}$/, { name: 'object id' }),
        product_id: Joi.string()
          .regex(/^[0-9a-fA-F]{24}$/, { name: 'object id' })
          .when('company_id', { is: Joi.exist(), then: Joi.required() })
          .required(),
        address_id: Joi.string()
          .regex(/^[0-9a-fA-F]{24}$/, { name: 'object id' })
          .when('company_id', { is: Joi.exist(), then: Joi.required() })
          .required(),
        quantity: Joi.number()
          .integer()
          .min(1)
          .when('company_id', { is: Joi.exist(), then: Joi.required() })
      }
    },
    pay: {
      params: {
        id: Joi.string()
          .regex(/^[0-9a-fA-F]{24}$/, { name: 'object id' })
          .required()
      }
    }
  }
};
