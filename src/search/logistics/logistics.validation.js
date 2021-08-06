import Joi from '@hapi/joi';

export default {
  company: {
    get: {},
    put: {
      body: {
        provider: Joi.string().required(),
        status: Joi.string().valid('active', 'disabled'),
        is_default: Joi.boolean()
      }
    }
  },
  user: {
    getAvailable: {
      query: {
        company_id: Joi.string()
          .regex(/^[0-9a-fA-F]{24}$/, { name: 'object id' })
          .required()
      }
    }
  }
};
