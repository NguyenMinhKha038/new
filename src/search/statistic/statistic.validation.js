import Joi from '@hapi/joi';

export default {
  admin: {
    statics: {
      query: {
        start_time: Joi.date().iso(),
        end_time: Joi.date().iso().min(Joi.ref('start_time'))
      }
    },
    get: {
      query: {
        limit: Joi.number().min(0).max(50),
        page: Joi.number().min(1),
        select: Joi.string(),
        sort: Joi.string(),
        start_time: Joi.date().iso(),
        end_time: Joi.date().iso().min(Joi.ref('start_time'))
      }
    }
  },
  getById: {
    params: {
      id: Joi.string()
        .regex(/^[0-9a-fA-F]{24}$/, { name: 'object id' })
        .required()
    }
  },
  statisticByTimeType: {
    query: {
      start_time: Joi.date().iso(),
      end_time: Joi.date().iso().min(Joi.ref('start_time')),
      time_type: Joi.string().valid(['day', 'week', 'month'])
    }
  }
};
