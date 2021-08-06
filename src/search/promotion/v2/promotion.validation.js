import Joi from '@hapi/joi';
import promotionConfig from '../promotion.config';

//owner

const modelSchema = {
  model_id: Joi.string()
    .regex(/^[a-zA-Z0-9]{24}$/)
    .required(),
  unlimited: Joi.boolean().required(),
  total: Joi.number()
    .integer()
    .when('unlimited', { is: false, then: Joi.required(), otherwise: Joi.forbidden() })
};

const createdSchema = Joi.object()
  .keys({
    product_scope: Joi.string().valid(promotionConfig.SCOPE).required(),
    unlimit: Joi.boolean().when('product_scope', {
      is: 'partial',
      then: Joi.forbidden(),
      otherwise: Joi.required()
    }),
    products: Joi.when('product_scope', {
      is: 'partial',
      then: Joi.array()
        .min(1)
        .items({
          product_id: Joi.string()
            .regex(/^[a-zA-Z0-9]{24}$/)
            .required(),
          models: Joi.when('model_scope', {
            is: 'all',
            then: Joi.array().length(0).default([]),
            otherwise: Joi.array().items(modelSchema)
          }),
          model_scope: Joi.string().valid(promotionConfig.SCOPE).required(),
          unlimited: Joi.when('model_scope', {
            is: 'all',
            then: Joi.boolean().required(),
            otherwise: Joi.forbidden()
          }),
          total: Joi.when('unlimited', {
            is: false,
            then: Joi.number().integer().required(),
            otherwise: Joi.forbidden()
          })
        })
        .required()
        .unique((a, b) => a.product_id.toString() === b.product_id.toString()),
      otherwise: Joi.forbidden()
    }),
    total: Joi.number()
      .integer()
      .min(1)
      .when('unlimit', { is: false, then: Joi.required(), otherwise: Joi.forbidden() }),
    store_id: Joi.string()
      .regex(/^[a-zA-Z0-9]{24}$/)
      .required(),
    name: Joi.string().min(1).max(200).required(),
    description: Joi.string().min(1).max(3000).optional(),
    type: Joi.string().default('percent'),
    value: Joi.when('type', {
      is: 'percent',
      then: Joi.number().min(0).max(1).precision(2),
      otherwise: Joi.number().min(0)
    }).required(),
    refund: Joi.number().greater(0).max(1).precision(2).required(),
    start_at: Joi.date()
      .iso()
      .min(new Date().getTime() - 60 * 5 * 1000)
      .required(),
    expire_at: Joi.date().iso().min(Joi.ref('start_at')).required(),
    conditions: Joi.array()
      .items(
        Joi.object({
          type: Joi.string().valid(promotionConfig.TYPE_CONDITIONS),
          value: Joi.when('type', {
            is: 'min-quantity',
            then: Joi.number().min(1).required(),
            otherwise: Joi.number().min(10000).required()
          })
        })
      )
      .unique((a, b) => a.type === b.type)
      .optional(),
    max_discount: Joi.number().integer().positive()
  })
  .unknown(false);

const idSchema = Joi.object().keys({
  id: Joi.string()
    .regex(/^[0-9a-zA-Z]{24}$/)
    .required()
});

const updateSchema = Joi.object()
  .keys({
    promotion_id: Joi.string()
      .regex(/^[a-zA-Z0-9]{24}$/)
      .required(),
    product_scope: Joi.string().valid(promotionConfig.SCOPE),
    unlimit: Joi.boolean().when('product_scope', {
      is: 'all',
      then: Joi.required(),
      otherwise: Joi.forbidden()
    }),
    products: Joi.when('product_scope', {
      is: 'partial',
      then: Joi.array()
        .min(1)
        .items({
          product_id: Joi.string()
            .regex(/^[a-zA-Z0-9]{24}$/)
            .required(),
          models: Joi.when('model_scope', {
            is: 'all',
            then: Joi.array().length(0),
            otherwise: Joi.array().items(modelSchema).default([])
          }),
          model_scope: Joi.string().valid(promotionConfig.SCOPE).required(),
          unlimited: Joi.when('model_scope', {
            is: 'all',
            then: Joi.boolean().required(),
            otherwise: Joi.forbidden()
          }),
          total: Joi.when('unlimited', {
            is: false,
            then: Joi.number().integer().required(),
            otherwise: Joi.forbidden()
          })
        })
        .required(),
      otherwise: Joi.forbidden()
    }),
    total: Joi.number()
      .integer()
      .min(1)
      .when('unlimit', { is: false, then: Joi.required(), otherwise: Joi.forbidden() }),
    store_id: Joi.string()
      .regex(/^[a-zA-Z0-9]{24}$/)
      .required(),
    name: Joi.string().min(1).max(200),
    description: Joi.string().min(1).max(3000),
    type: Joi.string().default('percent'),
    value: Joi.when('type', {
      is: 'percent',
      then: Joi.number().min(0).max(1).precision(2),
      otherwise: Joi.number().min(0)
    }).required(),
    refund: Joi.number().greater(0).max(1).precision(2),
    start_at: Joi.date()
      .iso()
      .min(new Date().getTime() - 60 * 5 * 1000)
      .required(),
    expire_at: Joi.date().iso().min(Joi.ref('start_at')).required(),
    conditions: Joi.array()
      .items(
        Joi.object({
          type: Joi.string().valid(promotionConfig.TYPE_CONDITIONS),
          value: Joi.when('type', {
            is: 'min-quantity',
            then: Joi.number().min(1).required(),
            otherwise: Joi.number().min(10000).required()
          })
        })
      )
      .unique((a, b) => a.type === b.type),
    max_discount: Joi.number().integer().positive()
  })
  .unknown(false);

const updateStatusSchema = Joi.object()
  .keys({
    promotion_id: Joi.string()
      .regex(/^[0-9a-zA-Z]{24}$/)
      .required(),
    status: Joi.string().valid(['active', 'disabled'])
  })
  .unknown(false);

const getById = Joi.object().keys({
  select: Joi.string()
});

export const promotionValidationV2 = {
  company: {
    createdSchema,
    updateStatusSchema,
    updateSchema,
    getById
  },
  idSchema
};
