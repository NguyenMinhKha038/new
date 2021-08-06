import * as Joi from '@hapi/joi';
import companyConfig from './company-activity.config';

export default {
  getById: {
    params: {
      id: Joi.string()
        .regex(/^[0-9a-fA-F]{24}$/, {
          name: 'object id'
        })
        .required()
    },
    query: {
      select: Joi.string()
    }
  },
  get: {
    query: {
      select: Joi.string(),
      sort: Joi.string(),
      limit: Joi.number().integer().min(1).max(companyConfig.DefaultLimit),
      page: Joi.number().min(1),
      user_id: Joi.string().regex(/^[0-9a-fA-F]{24}$/, {
        name: 'object id'
      }),
      created_from: Joi.date().iso(),
      created_to: Joi.date().iso().min(Joi.ref('created_from')),
      on_model: Joi.string(),
      resource: Joi.string(),
      object_id: Joi.string().regex(/^[0-9a-fA-F]{24}$/, {
        name: 'object id'
      }),
      parent_action_id: Joi.string().regex(/^[0-9a-fA-F]{24}$/, {
        name: 'object id'
      })
    }
  }
};
