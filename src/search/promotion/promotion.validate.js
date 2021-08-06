import Joi from '@hapi/joi';
import promotionConfig from './promotion.config';

//basic user
const findSchema = Joi.object().keys({
  limit: Joi.number().optional(),
  page: Joi.number().optional(),
  type: Joi.string()
    .regex(/(percent)|(money)/)
    .optional(),
  company_id: Joi.string()
    .regex(/^[0-9a-zA-Z]{24}$/)
    .optional(),
  product_ids: Joi.string()
    .regex(/^[0-9a-zA-Z]{24}$/)
    .optional(),
  store_id: Joi.string()
    .regex(/^[0-9a-zA-Z]{24}$/)
    .optional(),
  sort: Joi.string().optional(),
  reference: Joi.string().optional().trim()
});

//owner
const createdSchema = Joi.object()
  .keys({
    product_scope: Joi.string().valid(promotionConfig.SCOPE).required(),
    store_scope: Joi.string().valid(promotionConfig.SCOPE).default('all'),
    product_ids: Joi.array()
      .items(Joi.string().regex(/^[a-zA-Z0-9]{24}$/))
      .when('product_scope', {
        is: 'partial',
        then: Joi.required(),
        otherwise: Joi.optional()
      }),
    store_ids: Joi.array().items(Joi.string().regex(/^[a-zA-Z0-9]{24}$/)),
    // .when('store_scope', {
    //   is: 'partial',
    //   then: Joi.required(),
    //   otherwise: Joi.optional()
    // }),
    name: Joi.string().trim().min(1).max(200).required(),
    description: Joi.string().trim().min(1).max(3000).optional(),
    type: Joi.string().default('percent'),
    value: Joi.when('type', {
      is: 'percent',
      then: Joi.number().min(0).max(1).precision(2),
      otherwise: Joi.number().min(0)
    }).required(),
    start_at: Joi.date()
      .iso()
      .min(new Date().getTime() - 60 * 5 * 1000)
      .required(),
    expire_at: Joi.date().iso().min(Joi.ref('start_at')).required(),
    total: Joi.number().min(-1).required(),
    unlimit: Joi.when('total', {
      is: -1,
      then: Joi.boolean().default(true).valid(true),
      otherwise: Joi.boolean().default(false).valid(false)
    }),
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
    max_discount: Joi.number().optional(),
    refund: Joi.number().greater(0).max(1).precision(2).required(),
    status: Joi.string().valid(promotionConfig.STATUS).optional()
  })
  .unknown(false);

const idSchema = Joi.object().keys({
  id: Joi.string()
    .regex(/^[0-9a-zA-Z]{24}$/)
    .required()
});

const updatedSchema = Joi.object()
  .keys({
    id: Joi.string()
      .regex(/^[0-9a-zA-Z]{24}$/)
      .required(),
    name: Joi.string().trim().optional(),
    description: Joi.string().trim().optional(),
    type: Joi.string().valid(promotionConfig.TYPE_DISCOUNT).optional(),
    value: Joi.when('type', {
      is: 'percent',
      then: Joi.number().min(0).max(100).required(),
      otherwise: Joi.number().min(0).required()
    }),
    expire_at: Joi.date().optional(),
    start_at: Joi.date().optional(),
    // product_storing_ids: Joi.array().optional(),
    remain: Joi.number().optional(),
    total: Joi.number().optional(),
    max_discount: Joi.number().optional(),
    refund: Joi.number().min(0).max(99).optional(),
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
      .optional()
  })
  .unknown(false);

const updateStatusSchema = Joi.object()
  .keys({
    promotion_id: Joi.string()
      .regex(/^[0-9a-zA-Z]{24}$/)
      .required()
  })
  .unknown(false);

const findByOwnerSchema = Joi.object()
  .keys({
    limit: Joi.number().optional(),
    page: Joi.number().optional(),
    status: Joi.string().valid(promotionConfig.STATUS).optional(),
    // converter_status: Joi.string().valid(promotionConfig.STATUS).optional(),
    type: Joi.string()
      .regex(/(percent)|(money)/)
      .optional(),
    // company_id: Joi.string().regex(/^[0-9a-zA-Z]{24}$/).optional(),
    // status_date: Joi.string().valid(promotionConfig.QUERY_STATUS).optional(),
    sort: Joi.string().optional(),
    product_ids: Joi.string()
      .regex(/^[0-9a-zA-Z]{24}$/)
      .optional(),
    store_id: Joi.string()
      .regex(/^[0-9a-zA-Z]{24}$/)
      .optional(),
    _id: Joi.string()
      .regex(/^[0-9a-zA-Z]{24}$/)
      .optional(),
    start_time: Joi.date().iso().optional(),
    end_time: Joi.date().min(Joi.ref('start_time')).iso().optional(),
    start_at: Joi.date().iso().optional(),
    expire_at: Joi.date().min(Joi.ref('start_at')).iso().optional(),
    select: Joi.string().optional(),
    product_scope: Joi.string().valid(['all', 'partial']).optional(),
    reference: Joi.string().optional().trim(),
    promotion_ids: Joi.when('_id', {
      is: Joi.exist(),
      then: Joi.forbidden(),
      otherwise: Joi.array().items(
        Joi.string()
          .regex(/^[0-9a-zA-Z]{24}$/)
          .optional()
      )
    })
  })
  .unknown(false);

const findStatisticSchema = Joi.object().keys({
  limit: Joi.number().optional(),
  page: Joi.number().optional(),
  status: Joi.string()
    .regex(/(active)|(disable)/)
    .optional(),
  type: Joi.string()
    .regex(/(percent)|(money)/)
    .optional(),
  status_date: Joi.string().valid(promotionConfig.QUERY_STATUS).optional(),
  sort: Joi.string().optional(),
  product_id: Joi.string()
    .regex(/^[0-9a-zA-Z]{24}$/)
    .optional(),
  store_id: Joi.string()
    .regex(/^[0-9a-zA-Z]{24}$/)
    .optional(),
  _id: Joi.string()
    .regex(/^[0-9a-zA-Z]{24}$/)
    .optional()
});

//admin
const findByAdminSchema = Joi.object()
  .keys({
    limit: Joi.number().optional(),
    page: Joi.number().optional(),
    status: Joi.string().valid(promotionConfig.STATUS).optional(),
    type: Joi.string().valid(['percent', 'money']).optional(),
    company_id: Joi.string()
      .regex(/^[0-9a-zA-Z]{24}$/)
      .optional(),
    date_status: Joi.string().valid(['waiting', 'running', 'overed']).optional(),
    sort: Joi.string().optional(),
    product_ids: Joi.string()
      .regex(/^[0-9a-zA-Z]{24}$/)
      .optional(),
    store_id: Joi.string()
      .regex(/^[0-9a-zA-Z]{24}$/)
      .optional(),
    start_time: Joi.date().iso().optional(),
    end_time: Joi.date().iso().optional(),
    start_at: Joi.date().iso().optional(),
    expire_at: Joi.date().iso().optional(),
    reference: Joi.string().optional().trim(),
    select: Joi.string().optional(),
    _id: Joi.string()
      .regex(/^[0-9a-zA-Z]{24}$/)
      .optional(),
    promotion_ids: Joi.when('_id', {
      is: Joi.exist(),
      then: Joi.forbidden(),
      otherwise: Joi.array().items(
        Joi.string()
          .regex(/^[0-9a-zA-Z]{24}$/)
          .optional()
      )
    })
  })
  .unknown(false);

export default {
  user: {
    findSchema
  },
  owner: {
    findByOwnerSchema,
    updateStatusSchema,
    updatedSchema,
    createdSchema,
    findStatisticSchema
  },
  admin: {
    findByAdminSchema
  },
  idSchema
};
