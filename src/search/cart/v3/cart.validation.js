import Joi from '@hapi/joi';
import { pathIdSchema } from '../../../commons/utils';
import { SaleForms } from '../../order/v2/order.config';

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
        product_storing_id: Joi.string()
          .regex(/^[0-9a-fA-F]{24}$/, { name: 'object id' })
          .required(),
        quantity: Joi.number().integer().min(1),
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
        old_model_id: Joi.string().regex(/^[0-9a-fA-F]{24}$/, { name: 'object id' }) // when update product in cart,
      }
    },
    removeProduct: {
      body: {
        product_storing_id: Joi.string()
          .regex(/^[0-9a-fA-F]{24}$/, { name: 'object id' })
          .required(),
        model_id: pathIdSchema.required(),
        store_id: Joi.string()
          .regex(/^[0-9a-fA-F]{24}$/, { name: 'object id' })
          .required()
      }
    },
    checkout: {
      body: {
        address_id: Joi.string().regex(/^[0-9a-fA-F]{24}$/, { name: 'object id' }),
        payment_method: Joi.string().valid('COD', 'WALLET', 'VNPAY', 'ALEPAY').required(),
        order: {
          logistics_provider: Joi.string(),
          is_received_at_store: Joi.boolean(),
          expected_received_date: Joi.date()
            .iso()
            .greater('now')
            .when('is_received_at_store', { is: true, then: Joi.required() }),
          note: Joi.string().allow('').max(1024),
          // product_storing_id: Joi.string().regex(/^[0-9a-fA-F]{24}$/, { name: 'object id' }),
          store_id: Joi.string()
            .regex(/^[0-9a-fA-F]{24}$/, { name: 'object id' })
            .when('is_received_at_store', { is: true, then: Joi.required() })
        },
        change_store: {
          to_store_id: Joi.string()
            .regex(/^[0-9a-fA-F]{24}$/, { name: 'object id' })
            .required(),
          product_storing_id: Joi.string()
            .regex(/^[0-9a-fA-F]{24}$/, { name: 'object id' })
            .required(),
          from_store_id: Joi.string()
            .regex(/^[0-9a-fA-F]{24}$/, { name: 'object id' })
            .required()
        }
      }
    },
    getStore: {
      query: {
        location: Joi.string().regex(/^(\-?\d+(\.\d+)?).?,\s*(\-?\d+(\.\d+)?)$/),
        product_id: Joi.string()
          .regex(/^[0-9a-fA-F]{24}$/, { name: 'object id' })
          .required(),
        company_id: Joi.string()
          .regex(/^[0-9a-fA-F]{24}$/, { name: 'object id' })
          .required(),
        address_id: Joi.string().regex(/^[0-9a-fA-F]{24}$/, { name: 'object id' }),
        is_received_at_store: Joi.boolean()
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
