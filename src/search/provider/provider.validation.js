import Joi from '@hapi/joi';
import { Statuses } from './provider.config';

export default {
  get: {
    query: {
      limit: Joi.number().min(0).max(50),
      page: Joi.number().min(1),
      select: Joi.string(),
      sort: Joi.string(),
      status: Joi.string().valid(Object.values(Statuses)),
      company_id: Joi.string().regex(/^[0-9a-fA-F]{24}$/, { name: 'object id' }),
      admin_id: Joi.string().regex(/^[0-9a-fA-F]{24}$/, { name: 'object id' })
    }
  },
  getById: {
    params: {
      id: Joi.string()
        .regex(/^[0-9a-fA-F]{24}$/, { name: 'object id' })
        .required()
    },
    query: {
      select: Joi.string().trim()
    }
  },
  create: {
    body: {
      name: Joi.string().trim().required(),
      address: Joi.string().trim(),
      location: Joi.string().regex(/^(\-?\d+(\.\d+)?).?,\s*(\-?\d+(\.\d+)?)$/)
    }
  },
  getOne: {
    body: {
      name: Joi.string().trim().required(),
      address: Joi.string().trim(),
      location: Joi.string().regex(/^(\-?\d+(\.\d+)?).?,\s*(\-?\d+(\.\d+)?)$/)
    }
  },
  update: {
    params: {
      id: Joi.string()
        .regex(/^[0-9a-fA-F]{24}$/, { name: 'object id' })
        .required()
    },
    body: {
      name: Joi.string().trim().required(),
      address: Joi.string().trim(),
      location: Joi.string().regex(/^(\-?\d+(\.\d+)?).?,\s*(\-?\d+(\.\d+)?)$/)
    }
  },
  delete: {
    params: {
      id: Joi.string()
        .regex(/^[0-9a-fA-F]{24}$/, { name: 'object id' })
        .required()
    }
  }
};
