import Joi from '@hapi/joi';
import {
  GlobalPromotionStatuses,
  GlobalPromotionValueType,
  GlobalPromotionType
} from './global-promotion.config';

export default {
  admin: {
    get: {
      query: {
        limit: Joi.number().min(1).optional(),
        page: Joi.number().min(1).optional(),
        status: Joi.string().valid(Object.values(GlobalPromotionStatuses)).optional(),
        sort: Joi.string().optional(),
        select: Joi.string()
      }
    },
    create: {
      body: {
        name: Joi.string().min(1).max(300).required(),
        value_type: Joi.string().valid(Object.values(GlobalPromotionValueType)).required(),
        description: Joi.string().min(1).required(),
        value: Joi.when('value_type', {
          is: 'percent',
          then: Joi.number().min(0).max(1).required().precision(2),
          otherwise: Joi.number().min(0).required().integer()
        }),
        register_at: Joi.date().iso().greater('now').required(),
        start_at: Joi.date().iso().greater(Joi.ref('register_at')).required(),
        expire_at: Joi.date().iso().greater(Joi.ref('start_at')).required(),
        is_limit_company: Joi.boolean().required(),
        max_company: Joi.when('is_limit_company', {
          is: true,
          then: Joi.number().min(1).integer().required(),
          otherwise: Joi.number().forbidden()
        }),
        image: Joi.string(),
        categories: Joi.when('is_all_categories', {
          is: false,
          then: Joi.array()
            .min(1)
            .items(Joi.string().regex(/^[0-9a-zA-Z]{24}$/))
            .required()
            .unique(),
          otherwise: Joi.forbidden()
        }).required(),
        max_discount: Joi.number().required().min(1),
        min_order_value: Joi.number().required().min(0),
        is_all_categories: Joi.boolean().required(),
        refund: Joi.number().min(0).max(1).precision(2).required()
      }
    },
    update: {
      params: {
        id: Joi.string()
          .regex(/^[0-9a-zA-Z]{24}$/)
          .required()
      },
      body: {
        name: Joi.string().min(1).max(300),
        value_type: Joi.string().valid(Object.values(GlobalPromotionValueType)).required(),
        description: Joi.string().min(1),
        value: Joi.required().when('value_type', {
          is: 'percent',
          then: Joi.number().min(0).max(1).precision(2),
          otherwise: Joi.number().min(0).integer()
        }),
        register_at: Joi.date().iso().greater('now'),
        start_at: Joi.when('register_at', {
          is: Joi.exist(),
          then: Joi.date().iso().greater(Joi.ref('register_at')).required(),
          otherwise: Joi.forbidden()
        }),
        expire_at: Joi.when('register_at', {
          is: Joi.exist(),
          then: Joi.date().iso().greater(Joi.ref('start_at')).required(),
          otherwise: Joi.forbidden()
        }),
        is_limit_company: Joi.boolean(),
        max_company: Joi.when('is_limit_company', {
          is: true,
          then: Joi.number().min(1).integer().required(),
          otherwise: Joi.number().forbidden()
        }),
        image: Joi.string(),
        max_discount: Joi.number().min(1),
        min_order_value: Joi.number().min(0),
        categories: Joi.when('is_all_categories', {
          is: false,
          then: Joi.array()
            .min(1)
            .items(Joi.string().regex(/^[0-9a-zA-Z]{24}$/))
            .required()
            .unique(),
          otherwise: Joi.forbidden()
        }).required(),
        is_all_categories: Joi.boolean(),
        refund: Joi.number().min(0).max(1).precision(2)
      }
    },
    updateStatus: {
      put: {
        params: {
          id: Joi.string()
            .regex(/^[0-9a-zA-Z]{24}$/)
            .required()
        },
        body: {
          status: Joi.string().valid('active', 'disabled').required()
        }
      }
    }
  },
  company: {
    get: {
      query: {
        limit: Joi.number().min(1).optional(),
        page: Joi.number().min(1).optional(),
        sort: Joi.string().optional(),
        select: Joi.string()
      }
    }
  },
  search: {
    query: {
      name: Joi.string().required().allow('').trim(),
      limit: Joi.number().min(1).optional(),
      page: Joi.number().min(1).optional()
    }
  },
  getById: {
    params: {
      id: Joi.string()
        .required()
        .regex(/^[0-9a-zA-Z]{24}$/)
    }
  }
};
