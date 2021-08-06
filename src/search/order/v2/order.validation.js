import Joi from '@hapi/joi';
import {
  pathIdSchema,
  textSchema,
  booleanSchema,
  isoDateSchema,
  integerSchema,
  numberSchema,
  getFindSchema
} from '../../../commons/utils';
import {
  Types,
  PaymentMethods,
  PaymentTypes,
  Statuses,
  StatisticTypes,
  SaleForms
} from './order.config';

export default {
  getById: {
    params: {
      id: pathIdSchema.required()
    },
    query: {
      select: textSchema,
      populate: textSchema
    }
  },
  getByCode: {
    params: {
      code: textSchema.required()
    },
    query: {
      select: textSchema,
      populate: textSchema
    }
  },
  get: {
    query: {
      ...getFindSchema(),
      store_id: pathIdSchema,
      mall_id: pathIdSchema,
      company_id: pathIdSchema,
      user_id: pathIdSchema,
      seller_id: pathIdSchema,
      cashier_id: pathIdSchema,
      is_confirmed: booleanSchema,
      waybill_code: textSchema,
      code: textSchema,
      type: textSchema.only(Object.values(Types)),
      without_product: booleanSchema,
      payment_method: textSchema.only(Object.values(PaymentMethods)),
      payment_type: textSchema.only(Object.values(PaymentTypes)),
      status: textSchema.only(Object.values(Statuses)),
      is_paid: booleanSchema,
      is_created_from_menu: booleanSchema,
      is_lucky: booleanSchema,
      lucky_product_id: pathIdSchema,
      is_received_at_store: booleanSchema,
      date_from: isoDateSchema,
      date_to: isoDateSchema,
      expires_from: isoDateSchema,
      expires_to: isoDateSchema
    }
  },
  user: {
    payOffline: {
      params: {
        code: textSchema.min(9).max(12).required()
      },
      body: {
        payment_method: Joi.valid('WALLET', 'CASH').required()
      }
    }
  },
  company: {
    getStatistics: {
      query: {
        date_from: isoDateSchema,
        date_to: isoDateSchema,
        store_id: pathIdSchema,
        type: textSchema.valid(...Object.values(StatisticTypes))
      }
    },
    createOffline: {
      query: {
        populate: textSchema
      },
      body: {
        store_id: pathIdSchema.required(),
        without_product: booleanSchema.default(false),
        total: numberSchema.greater(0).when('without_product', {
          is: true,
          then: Joi.required()
        }),
        products: Joi.array()
          .min(1)
          .items(
            Joi.object({
              product_storing_id: pathIdSchema.required(),
              quantity: integerSchema.min(1).required(),
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
          .when('without_product', {
            is: false,
            then: Joi.required()
          }),
        note: textSchema.max(256),
        position: textSchema.max(256)
      }
    },
    createOfflineFromCache: {
      query: {
        populate: textSchema
      },
      body: {
        order_caching_id: pathIdSchema.required(),
        note: textSchema.max(256)
      }
    },
    update: {
      params: {
        id: pathIdSchema.required()
      },
      body: {
        status: textSchema.only(Object.values(Statuses)),
        position: textSchema,
        note: textSchema.max(256)
      }
    },
    pay: {
      params: {
        code: Joi.string().max(12).required()
      },
      body: {
        payment_method: Joi.string()
          .required()
          .when('user_type', {
            is: 'user',
            then: Joi.valid('WALLET', 'CASH'),
            otherwise: Joi.valid('CASH')
          }),
        payment_code: Joi.number()
          .max(1e13)
          .when('payment_method', { is: 'WALLET', then: Joi.required() }),
        phone_number: Joi.string().max(12),
        store_id: Joi.string().regex(/^[0-9a-fA-F]{24}$/, { name: 'object id' }),
        user_type: Joi.string().valid('user', 'buyer').required()
      }
    }
  },
  admin: {}
};
