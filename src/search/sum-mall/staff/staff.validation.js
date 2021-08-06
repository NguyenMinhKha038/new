import Joi from '@hapi/joi';
import { MallStaffRoles, MallStaffStatuses } from './staff.config';
import { UpdateStaffRoles } from './staff.config';

const periodTimeSchema = Joi.object({
  from: Joi.number().min(0).max(24).required(),
  to: Joi.number().min(0).max(24).required()
}).required();

const weekDayScheduleSchema = Joi.array().items(periodTimeSchema).unique();

export default {
  admin: {
    get: {
      query: {
        limit: Joi.number().min(0).max(50),
        page: Joi.number().min(1),
        select: Joi.string(),
        sort: Joi.string(),
        mall_id: Joi.string().regex(/^[0-9a-fA-F]{24}$/, { name: 'object id' }),
        status: Joi.string().valid(Object.values(MallStaffStatuses)),
        roles: Joi.string().valid(Object.values(MallStaffRoles)),
        user_id: Joi.string().regex(/^[0-9a-fA-F]{24}$/, { name: 'object id' })
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
    },
    updateManagerStatus: {
      params: {
        id: Joi.string()
          .regex(/^[0-9a-fA-F]{24}$/, { name: 'object id' })
          .required()
      },
      body: {
        status: Joi.string().valid(Object.values(MallStaffStatuses)).required()
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
        status: Joi.string().valid(Object.values(MallStaffStatuses)),
        roles: Joi.string().valid(Object.values(MallStaffRoles)),
        user_id: Joi.string().regex(/^[0-9a-fA-F]{24}$/, { name: 'object id' })
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
    },
    create: {
      body: {
        roles: Joi.array()
          .items(Joi.string().valid(Object.values(UpdateStaffRoles)))
          .unique()
          .required(),
        user_id: Joi.string()
          .regex(/^[0-9a-fA-F]{24}$/, { name: 'object id' })
          .required(),
        salary_per_hour: Joi.number().min(0).required(),
        schedule: Joi.object({
          monday: weekDayScheduleSchema,
          tuesday: weekDayScheduleSchema,
          wednesday: weekDayScheduleSchema,
          thursday: weekDayScheduleSchema,
          friday: weekDayScheduleSchema,
          saturday: weekDayScheduleSchema,
          sunday: weekDayScheduleSchema
        }).required()
      }
    },
    update: {
      params: {
        id: Joi.string()
          .regex(/^[0-9a-fA-F]{24}$/, { name: 'object id' })
          .required()
      },
      body: {
        status: Joi.string().valid(Object.values(MallStaffStatuses)),
        salary_per_hour: Joi.number().min(0),
        roles: Joi.array()
          .items(Joi.string().valid(Object.values(UpdateStaffRoles)))
          .unique(),
        schedule: Joi.object({
          monday: weekDayScheduleSchema,
          tuesday: weekDayScheduleSchema,
          wednesday: weekDayScheduleSchema,
          thursday: weekDayScheduleSchema,
          friday: weekDayScheduleSchema,
          saturday: weekDayScheduleSchema,
          sunday: weekDayScheduleSchema
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
        status: Joi.string().valid(Object.values(MallStaffStatuses)),
        roles: Joi.string().valid(Object.values(MallStaffRoles))
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
  search: {
    query: {
      staff_name: Joi.string().min(0).trim().required(),
      limit: Joi.number().min(0).max(50),
      page: Joi.number().min(1)
    }
  }
};
