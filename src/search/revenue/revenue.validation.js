import Joi from '@hapi/joi';
import { pathIdSchema, textSchema } from '../../commons/utils';

export default {
  company: {
    get: {
      query: {
        limit: Joi.number().min(1).max(50),
        page: Joi.number().min(1),
        select: Joi.string(),
        sort: Joi.string(),
        store_id: Joi.string().regex(/^[0-9a-fA-F]{24}$/, {
          name: 'object id'
        }),
        start_time: Joi.date().iso(),
        end_time: Joi.date().iso().min(Joi.ref('start_time'))
      }
    },
    getByTimeType: {
      query: {
        limit: Joi.number().min(1).max(50),
        page: Joi.number().min(1),
        select: Joi.string(),
        sort: Joi.string(),
        store_id: Joi.string().regex(/^[0-9a-fA-F]{24}$/, {
          name: 'object id'
        }),
        start_time: Joi.date(),
        end_time: Joi.date()
          // .iso()
          .min(Joi.ref('start_time')),
        time_type: Joi.string().valid(['day', 'week', 'month']).required()
      }
    },
    statics: {
      query: {
        start_time: Joi.date().iso(),
        end_time: Joi.date().iso().min(Joi.ref('start_time'))
      }
    },
    staticsStoreDate: {
      query: {
        start_time: Joi.date().iso(),
        end_time: Joi.date().iso().min(Joi.ref('start_time')),
        store_id: Joi.string()
          .regex(/^[0-9a-fA-F]{24}$/, { name: 'object id' })
          .required()
      }
    },
    menuRevenueByPeriod: {
      query: {
        start_time: Joi.date().iso(),
        end_time: Joi.date().iso().min(Joi.ref('start_time')),
        store_id: pathIdSchema,
        date_order: textSchema.only(['increasing', 'decreasing']).default('decreasing')
      }
    },
    menuRevenueByDate: {
      query: {
        date: Joi.date().iso(),
        store_id: pathIdSchema,
        sort: textSchema
      }
    }
  },
  admin: {
    get: {
      query: {
        limit: Joi.number().min(1).max(50),
        page: Joi.number().min(1),
        select: Joi.string(),
        sort: Joi.string(),
        store_id: Joi.string().regex(/^[0-9a-fA-F]{24}$/, {
          name: 'object id'
        }),
        company_id: Joi.string().regex(/^[0-9a-fA-F]{24}$/, {
          name: 'object id'
        }),
        start_time: Joi.date().iso(),
        end_time: Joi.date().iso().min(Joi.ref('start_time'))
      }
    },
    statisticCompanyDate: {
      query: {
        start_time: Joi.date().iso(),
        end_time: Joi.date().iso().min(Joi.ref('start_time')),
        company_id: Joi.string().regex(/^[0-9a-fA-F]{24}$/, {
          name: 'object id'
        }),
        type_category_id: Joi.string().regex(/^[0-9a-fA-F]{24}$/, {
          name: 'object id'
        }),
        category_id: Joi.string().regex(/^[0-9a-fA-F]{24}$/, {
          name: 'object id'
        }),
        group_by: Joi.string().valid(['company', 'category', 'type_category'])
      }
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
