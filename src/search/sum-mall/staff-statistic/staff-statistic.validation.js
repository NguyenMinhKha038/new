import Joi from '@hapi/joi';

export default {
  admin: {
    get: {
      query: {
        limit: Joi.number().min(0).max(50),
        page: Joi.number().min(1),
        select: Joi.string(),
        sort: Joi.string(),
        staff_id: Joi.string().regex(/^[0-9a-fA-F]{24}$/, { name: 'object id' }),
        from: Joi.date().iso(),
        to: Joi.when('from', {
          is: Joi.exist(),
          then: Joi.date().iso().greater(Joi.ref('from')).required(),
          otherwise: Joi.forbidden()
        }),
        mall_id: Joi.string().regex(/^[0-9a-fA-F]{24}$/, { name: 'object id' })
      }
    }
  },
  mall: {
    get: {
      query: {
        limit: Joi.number().min(0).max(50),
        page: Joi.number().min(1),
        select: Joi.string(),
        sort: Joi.string(),
        staff_id: Joi.string().regex(/^[0-9a-fA-F]{24}$/, { name: 'object id' }),
        from: Joi.date().iso(),
        to: Joi.when('from', {
          is: Joi.exist(),
          then: Joi.date().iso().greater(Joi.ref('from')).required(),
          otherwise: Joi.forbidden()
        })
      }
    }
  },
  staff: {
    get: {
      query: {
        limit: Joi.number().min(0).max(50),
        page: Joi.number().min(1),
        select: Joi.string(),
        sort: Joi.string(),
        from: Joi.date().iso(),
        to: Joi.when('from', {
          is: Joi.exist(),
          then: Joi.date().iso().greater(Joi.ref('from')).required(),
          otherwise: Joi.forbidden()
        })
      }
    }
  }
};
