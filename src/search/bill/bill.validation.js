import Joi from '@hapi/joi';
export default {
  getById: {
    params: {
      id: Joi.string()
        .regex(/^[0-9a-fA-F]{24}$/, { name: 'object id' })
        .required()
    }
  },
  user: {
    get: {
      query: {
        limit: Joi.number().min(1).max(50),
        page: Joi.number().min(1),
        select: Joi.string(),
        sort: Joi.string()
      }
    },
    queryBill: {
      query: {
        publisher: Joi.string().required(),
        type: Joi.string().valid('ELECTRIC', 'FINANCE', 'WATER').required(),
        customer_code: Joi.string().required()
      }
    },
    payBill: {
      body: {
        publisher: Joi.string().required(),
        type: Joi.string().valid('ELECTRIC', 'FINANCE', 'WATER').required(),
        customer_code: Joi.string().required(),
        payment_method: Joi.string()
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
        user_id: Joi.string().regex(/^[0-9a-fA-F]{24}$/, { name: 'object id' })
      }
    }
  }
};
