import Joi from '@hapi/joi';
import { mallActions } from './mall-activity.config';

export default {
  mall: {
    get: {
      query: {
        limit: Joi.number().min(0).max(50),
        page: Joi.number().min(1),
        select: Joi.string(),
        sort: Joi.string(),
        user_id: Joi.string().regex(/^[0-9a-fA-F]{24}$/, { name: 'object id' }),
        resource: Joi.string(),
        on_model: Joi.string(),
        created_from: Joi.date().iso(),
        created_to: Joi.date().iso(),
        action: Joi.string().valid(Object.values(mallActions).map((item) => item.action))
      }
    },
    getById: {
      params: {
        id: Joi.string()
          .regex(/^[0-9a-fA-F]{24}$/, { name: 'object id' })
          .required()
      },
      query: {
        select: Joi.string()
      }
    }
  },
  admin: {
    get: {
      query: {
        limit: Joi.number().min(0).max(50),
        page: Joi.number().min(1),
        select: Joi.string(),
        sort: Joi.string(),
        user_id: Joi.string().regex(/^[0-9a-fA-F]{24}$/, { name: 'object id' }),
        resource: Joi.string(),
        on_model: Joi.string(),
        created_from: Joi.date().iso(),
        created_to: Joi.date().iso(),
        action: Joi.string().valid(Object.values(mallActions).map((item) => item.action)),
        mall_id: Joi.string().regex(/^[0-9a-fA-F]{24}$/, { name: 'object id' })
      }
    },
    getById: {
      params: {
        id: Joi.string()
          .regex(/^[0-9a-fA-F]{24}$/, { name: 'object id' })
          .required()
      },
      query: {
        select: Joi.string()
      }
    }
  }
};
