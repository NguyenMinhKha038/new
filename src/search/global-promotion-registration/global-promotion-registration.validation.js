import Joi from '@hapi/joi';

export default {
  admin: {
    get: {
      query: {
        limit: Joi.number().min(1).optional(),
        page: Joi.number().min(1).optional(),
        sort: Joi.string().optional(),
        status: Joi.string().optional().valid('active', 'disabled'),
        company_id: Joi.string()
          .regex(/^[0-9a-zA-Z]{24}$/)
          .optional(),
        select: Joi.string()
      }
    }
  },
  company: {
    register: {
      body: {
        global_promotion_id: Joi.string()
          .regex(/^[0-9a-zA-Z]{24}$/)
          .required(),
        product_storing_ids: Joi.array()
          .items(Joi.string().regex(/^[0-9a-zA-Z]{24}$/))
          .required()
          .unique()
      }
    },
    getMyRegistration: {
      query: {
        limit: Joi.number().min(1).optional(),
        page: Joi.number().min(1).optional(),
        sort: Joi.string().optional(),
        status: Joi.string().valid('active', 'disabled'),
        select: Joi.string()
      }
    },
    update: {
      params: {
        id: Joi.string()
          .regex(/^[0-9a-zA-Z]{24}$/)
          .required()
      },
      body: {
        product_storing_ids: Joi.array()
          .items(Joi.string().regex(/^[0-9a-zA-Z]{24}$/))
          .unique(),
        status: Joi.string().valid('active', 'disabled')
      }
    }
  },
  getById: {
    params: {
      id: Joi.string()
        .regex(/^[0-9a-zA-Z]{24}$/)
        .required()
    }
  }
};
