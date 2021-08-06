import Joi from '@hapi/joi';
import { supportReasonCategories } from './support-reason.config';

export default {
  get: {
    query: {
      limit: Joi.number(),
      page: Joi.number(),
      sort: Joi.string(),
      category: Joi.string().valid(supportReasonCategories)
    }
  },
  admin: {
    post: {
      body: {
        category: Joi.string().valid(supportReasonCategories).required(),
        reason_list: Joi.array().items(Joi.string()).min(1).required()
      }
    },
    put: {
      body: {
        _id: Joi.string()
          .regex(/[a-fA-F0-9]{24}$/, { name: 'object id' })
          .required(),
        category: Joi.string().valid(supportReasonCategories),
        reason_list: Joi.array().items(Joi.string())
      }
    }
  }
};
