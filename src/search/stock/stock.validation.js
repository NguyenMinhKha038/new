import Joi from '@hapi/joi';
import { MovingTypes, RequesterTypes } from './stock.config';

export default {
  company: {
    requestMove: {
      body: {
        moving_type: Joi.string().valid(Object.values(MovingTypes)).required(),
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
        store_id: Joi.string()
          .regex(/^[0-9a-fA-F]{24}$/, { name: 'object id' })
          .required(),
        note: Joi.string().trim().max(300),
        requester_type: Joi.string().valid(RequesterTypes).required()
      }
    },
    confirmMove: {
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
            status: Joi.string().only(['completed', 'cancelled']).required()
          })
          .min(1)
          .unique((a, b) => a.id === b.id)
          .allow(null)
          .default(null),
        status: Joi.string()
          .only(['completed', 'cancelled'])
          .when('products', { is: null, then: Joi.required() }),
        note: Joi.string().default('').trim().max(300)
      }
    },
    approveMove: {
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
        status: Joi.string()
          .only(['approved', 'cancelled'])
          .when('products', { is: null, then: Joi.required() }),
        note: Joi.string().trim().max(300)
      }
    },
    updateStock: {
      body: {
        type: Joi.string().valid(['import', 'export']).required(),
        products: Joi.array()
          .items({
            id: Joi.string()
              .regex(/^[0-9a-fA-F]{24}$/, { name: 'object id' })
              .required(),
            stock: Joi.number().integer().positive().required()
          })
          .min(1),
        note: Joi.string().trim().max(300),
        provider: Joi.string()
          .trim()
          .min(1)
          .max(200)
          .when('type', { is: 'import', then: Joi.required() })
      }
    }
  },
  admin: {}
};
