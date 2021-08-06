import Joi from '@hapi/joi';

export default {
  product: {
    query: {
      id: Joi.string().regex(/^[0-9a-fA-F]{24}$/, { name: 'object id' }),
      type_category_id: Joi.string().regex(/^[0-9a-fA-F]{24}$/, { name: 'object id' }),
      price: Joi.number(),
      company_category_id: Joi.string().regex(/^[0-9a-fA-F]{24}$/, { name: 'object id' }),
      sub_category_id: Joi.string().regex(/^[0-9a-fA-F]{24}$/, { name: 'object id' }),
      limit: Joi.number().integer().min(1),
      sort: Joi.string(),
      select: Joi.string()
    }
  }
};
