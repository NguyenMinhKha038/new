import Joi from '@hapi/joi';
import {
  pathIdSchema,
  textSchema,
  booleanSchema,
  isoDateSchema,
  integerSchema,
  numberSchema,
  getFindSchema
} from '../../commons/utils';
import { Types, PaymentMethods, PaymentTypes, Statuses, SaleForms } from '../order/v2/order.config';

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
      status: textSchema.only([...Object.values(Statuses), 'pending']),
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
    getRefresh: {
      params: {
        id: pathIdSchema.required()
      },
      query: {
        populate: textSchema
      }
    },
    createOffline: {
      query: {
        populate: textSchema
      },
      body: {
        store_id: pathIdSchema.required(),
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
          .required(),
        note: textSchema.max(256),
        position: textSchema.max(256),
        is_created_from_menu: booleanSchema.default(false)
      }
    },
    updateOffline: {
      params: {
        id: pathIdSchema.required()
      },
      query: {
        populate: textSchema
      },
      body: {
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
          ),
        note: textSchema.max(256),
        position: textSchema.max(256),
        status: textSchema.only([Statuses.UserCanceled])
      }
    }
  },
  company: {
    getRefresh: {
      params: {
        id: pathIdSchema.required()
      },
      query: {
        populate: textSchema
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
              selection: {
                type_selection_id: pathIdSchema.required(),
                selection_id: pathIdSchema.required()
              },
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
    updateOffline: {
      params: {
        id: pathIdSchema.required()
      },
      query: {
        populate: textSchema
      },
      body: {
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
        position: textSchema.max(256),
        status: textSchema.only([
          Statuses.UserCanceled,
          Statuses.UserRejected,
          Statuses.CompanyCanceled
        ])
      }
    }
  },
  admin: {}
};
