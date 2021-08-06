import Joi from '@hapi/joi';

export default {
  get: {
    query: {
      limit: Joi.number().min(0).max(50),
      page: Joi.number().min(1),
      select: Joi.string(),
      sort: Joi.string(),
      key: Joi.string()
    }
  },
  create: {
    body: {
      key: Joi.string().max(256).required(),
      value: Joi.string().max(9999).required(),
      name: Joi.string().required()
    }
  },
  update: {
    body: {
      key: Joi.string().max(256).required(),
      value: Joi.required(),
      name: Joi.string(),
      fee: Joi.number(),
      min: Joi.number(),
      max_per_day: Joi.number()
    }
  },
  delete: {
    query: {
      key: Joi.string().max(256)
    }
  },
  updateAppVersion: {
    body: {
      // : Joi.string()
      enterprise_web: Joi.string(),
      mobile_app: Joi.string(),
      admin_web: Joi.string()
    }
  }
};
