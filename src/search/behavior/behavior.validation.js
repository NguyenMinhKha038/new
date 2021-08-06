import Joi from '@hapi/joi';
import { Types } from './behavior.config';

export default {
  get: {
    query: {
      limit: Joi.number().min(1).max(50),
      page: Joi.number().min(1),
      select: Joi.string(),
      sort: Joi.string(),
      company_id: Joi.string().regex(/^[0-9a-fA-F]{24}$/, { name: 'object id' }),
      store_id: Joi.string().regex(/^[0-9a-fA-F]{24}$/, { name: 'object id' }),
      product_id: Joi.string().regex(/^[0-9a-fA-F]{24}$/, { name: 'object id' }),
      user_id: Joi.string().regex(/^[0-9a-fA-F]{24}$/, { name: 'object id' }),
      comment_id: Joi.string().regex(/^[0-9a-fA-F]{24}$/, { name: 'object id' }),
      type: Joi.string().valid(Object.keys(Types).map((key) => Object.values(Types[key]))),
      created_from: Joi.date().iso(),
      created_to: Joi.date().iso().min(Joi.ref('created_from')),
      province_code: Joi.number().integer().min(1)
    }
  },
  getById: {
    params: {
      id: Joi.string()
        .regex(/^[0-9a-fA-F]{24}$/, { name: 'object id' })
        .required()
    }
  }
};
