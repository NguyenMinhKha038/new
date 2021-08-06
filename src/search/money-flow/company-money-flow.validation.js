import Joi from '@hapi/joi';

export default {
  get: {
    query: {
      limit: Joi.number().min(1).max(50),
      page: Joi.number().min(1),
      select: Joi.string(),
      sort: Joi.string()
    }
  }
};
