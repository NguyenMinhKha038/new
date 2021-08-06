import Joi, { number } from '@hapi/joi';

export default {
  get: {
    query: {
      name: Joi.string().max(64),
      limit: Joi.number().min(0).max(50),
      page: Joi.number().min(1),
      select: Joi.string(),
      sort: Joi.string(),
      type: Joi.number().valid(1, 2, 3),
      parent_id: Joi.string().regex(/^[0-9a-fA-F]{24}$/, { name: 'object id' }),
      _id: Joi.alternatives().try(
        Joi.array().items(Joi.string().regex(/^[0-9a-fA-F]{24}$/, { name: 'object id' })),
        Joi.string().regex(/^[0-9a-fA-F]{24}$/, { name: 'object id' })
      )
    }
  },
  getById: {
    params: {
      id: Joi.string()
        .regex(/^[0-9a-fA-F]{24}$/, { name: 'object id' })
        .required()
    }
  },
  admin: {
    get: {
      query: {
        name: Joi.string().max(64),
        status: Joi.string().valid(['active', 'disabled', 'pending']),
        limit: Joi.number().min(0).max(50),
        page: Joi.number().min(1),
        select: Joi.string(),
        sort: Joi.string(),
        type: Joi.number().valid(1, 2, 3),
        company_id: Joi.string().regex(/^[0-9a-fA-F]{24}$/, {
          name: 'object id'
        }),
        parent_id: Joi.string().regex(/^[0-9a-fA-F]{24}$/, {
          name: 'object id'
        }),
        _id: Joi.alternatives().try(
          Joi.array().items(Joi.string().regex(/^[0-9a-fA-F]{24}$/, { name: 'object id' })),
          Joi.string().regex(/^[0-9a-fA-F]{24}$/, { name: 'object id' })
        )
      }
    },
    getById: {
      params: {
        id: Joi.string()
          .regex(/^[0-9a-fA-F]{24}$/, { name: 'object id' })
          .required()
      }
    },
    post: {
      body: {
        name: Joi.string().max(64).required(),
        image: Joi.string(),
        status: Joi.string().valid(['active', 'disabled', 'pending']),
        parent_id: Joi.string()
          .regex(/^[0-9a-fA-F]{24}$/, { name: 'object id' })
          .when('type', {
            is: Joi.number().valid(2, 3),
            then: Joi.string().required(),
            otherwise: Joi.forbidden()
          }),
        type: Joi.number().valid(1, 2, 3).required(),
        fee_rate: Joi.number().max(1).min(0).when('type', {
          is: 2,
          then: Joi.required(),
          otherwise: Joi.forbidden()
        }),
        fee_type: Joi.number().positive().when('type', {
          is: 2,
          then: Joi.required(),
          otherwise: Joi.forbidden()
        }),
        priority: Joi.number().positive()
      }
    },
    put: {
      params: {
        id: Joi.string()
          .regex(/^[0-9a-fA-F]{24}$/, { name: 'object id' })
          .required()
      },
      body: {
        name: Joi.string().max(64),
        status: Joi.string().valid(['active', 'disabled']),
        image: Joi.string(),
        type: Joi.number().valid(1, 2, 3),
        parent_id: Joi.string()
          .regex(/^[0-9a-fA-F]{24}$/, { name: 'object id' })
          .when('type', { is: 2, then: Joi.required() })
          .when('type', { is: 3, then: Joi.required() }),
        fee_rate: Joi.number().max(1).min(0).when('type', {
          is: 2,
          then: Joi.required(),
          otherwise: Joi.forbidden()
        }),
        fee_type: Joi.number().positive().when('type', {
          is: 2,
          then: Joi.required(),
          otherwise: Joi.forbidden()
        }),
        priority: Joi.number().positive()
      }
    },
    delete: {
      params: {
        id: Joi.string()
          .regex(/^[0-9a-fA-F]{24}$/, { name: 'object id' })
          .required()
      }
    }
  },
  company: {
    post: {
      body: {
        name: Joi.string().max(64).required(),
        parent_id: Joi.string()
          .regex(/^[0-9a-fA-F]{24}$/, { name: 'object id' })
          .required(),
        type: Joi.number().valid(2, 3).required()
      }
    }
  }
};
