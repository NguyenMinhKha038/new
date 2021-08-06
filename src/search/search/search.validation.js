import Joi from '@hapi/joi';
import searchConfig from './search.config';

export default {
  get: {
    query: {
      query: Joi.string().min(0).max(128),
      location: Joi.string().regex(/^(\-?\d+(\.\d+)?).?,\s*(\-?\d+(\.\d+)?)$/),
      type_category_id: Joi.string().regex(/^[0-9a-fA-F]{24}$/, {
        name: 'object id'
      }),
      province_code: Joi.string().min(0).max(128),
      distance: Joi.number()
        .min(1)
        .max(50)
        .when('location', { is: Joi.exist(), then: Joi.required() }),
      type: Joi.string().valid('store', 'product', 'all'),
      group_store: Joi.bool(),
      sort: Joi.string().valid('max_refund', 'max_discount'),
      size: Joi.number(),
      from: Joi.number(),
      in_menu: Joi.boolean()
    }
  },
  autoComplete: {
    query: {
      query: Joi.string().max(256).required(),
      location: Joi.string().regex(/^(\-?\d+(\.\d+)?).?,\s*(\-?\d+(\.\d+)?)$/)
    }
  },
  getCoordinates: {
    query: {
      query: Joi.string().max(256).required()
    }
  },
  getAddress: {
    query: {
      location: Joi.string()
        .regex(/^(\-?\d+(\.\d+)?).?,\s*(\-?\d+(\.\d+)?)$/)
        .required()
    }
  },
  admin: {
    getByName: {
      query: {
        type: Joi.string().valid(Object.keys(searchConfig.SearchTypes)).required(),
        company_id: Joi.string().regex(/^[0-9a-fA-F]{24}$/, { name: 'object id' }),
        name: Joi.string().trim().max(64),
        limit: Joi.number().min(0).max(searchConfig.MaxLimit).default(searchConfig.DefaultLimit),
        select: Joi.string().trim(),
        populate: Joi.string().trim(),
        sort: Joi.string().trim()
      }
    }
  }
};
