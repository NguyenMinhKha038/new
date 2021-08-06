import Joi from '@hapi/joi';

export default {
  get: {
    query: {
      limit: Joi.number().min(1).max(50),
      page: Joi.number().min(1),
      select: Joi.string(),
      sort: Joi.string()
    }
  },
  post: {
    body: {
      company_id: Joi.string()
        .regex(/^[0-9a-fA-F]{24}$/, { name: 'object id' })
        .required()
    }
  },
  delete: {
    query: {
      company_id: Joi.string()
        .regex(/^[0-9a-fA-F]{24}$/, { name: 'object id' })
        .required()
    }
  }
};
