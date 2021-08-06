import Joi from '@hapi/joi';
import { ScheduleStatuses } from './company-schedule.config';

const periodTime = Joi.object({
  from: Joi.number().min(0).max(24).required(),
  to: Joi.number().min(0).max(24).required()
});
const weekDay = Joi.array().items(periodTime).unique().min(1);
export default {
  admin: {
    get: {
      query: {
        limit: Joi.number().min(0).max(50),
        page: Joi.number().min(1),
        select: Joi.string(),
        sort: Joi.string(),
        populate: Joi.string(),
        company_id: Joi.string().regex(/^[0-9a-fA-F]{24}$/, { name: 'object id' }),
        user_id: Joi.string().regex(/^[0-9a-fA-F]{24}$/, { name: 'object id' }),
        store_id: Joi.string().regex(/^[0-9a-fA-F]{24}$/, { name: 'object id' }),
        permission_group_id: Joi.string().regex(/^[0-9a-fA-F]{24}$/, { name: 'object id' }),
        status: Joi.string().valid(Object.values(ScheduleStatuses)),
        from: Joi.date().iso(),
        to: Joi.date().iso()
      }
    },
    getById: {
      params: {
        id: Joi.string()
          .regex(/^[0-9a-fA-F]{24}$/, { name: 'object id' })
          .required()
      },
      query: {
        select: Joi.string(),
        populate: Joi.string()
      }
    }
  },
  company: {
    get: {
      query: {
        limit: Joi.number().min(0).max(50),
        page: Joi.number().min(1),
        select: Joi.string(),
        sort: Joi.string(),
        populate: Joi.string(),
        status: Joi.string().valid(Object.values(ScheduleStatuses)),
        permission_group_id: Joi.string().regex(/^[0-9a-fA-F]{24}$/, { name: 'object id' }),
        user_id: Joi.string().regex(/^[0-9a-fA-F]{24}$/, { name: 'object id' }),
        store_id: Joi.string().regex(/^[0-9a-fA-F]{24}$/, { name: 'object id' }),
        from: Joi.date().iso(),
        to: Joi.date().iso()
      }
    },
    getById: {
      params: {
        id: Joi.string()
          .regex(/^[0-9a-fA-F]{24}$/, { name: 'object id' })
          .required()
      },
      query: {
        select: Joi.string(),
        populate: Joi.string()
      }
    },
    updateStatus: {
      params: {
        id: Joi.string()
          .regex(/^[0-9a-fA-F]{24}$/, { name: 'object id' })
          .required()
      },
      body: {
        status: Joi.string()
          .valid(ScheduleStatuses.Active, ScheduleStatuses.ManagerDisabled)
          .required()
      }
    },
    create: {
      body: {
        permission_group_id: Joi.string()
          .regex(/^[0-9a-fA-F]{24}$/, { name: 'object id' })
          .required(),
        schedule: Joi.object({
          monday: weekDay,
          tuesday: weekDay,
          wednesday: weekDay,
          thursday: weekDay,
          friday: weekDay,
          saturday: weekDay,
          sunday: weekDay
        }),
        date: Joi.when('schedule', {
          is: Joi.exist(),
          then: Joi.forbidden(),
          otherwise: Joi.date().iso().greater('now').required()
        }),
        work_shifts: Joi.when('schedule', {
          is: Joi.exist(),
          then: Joi.forbidden(),
          otherwise: Joi.array().items(periodTime).required()
        })
      }
    },
    update: {
      params: {
        id: Joi.string()
          .regex(/^[0-9a-fA-F]{24}$/, { name: 'object id' })
          .required()
      },
      body: {
        work_shifts: Joi.array().items(periodTime).required()
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
        status: Joi.string().valid(Object.values(ScheduleStatuses)),
        from: Joi.date().iso(),
        to: Joi.date().iso()
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
    register: {
      body: {
        schedule: Joi.object({
          monday: weekDay,
          tuesday: weekDay,
          wednesday: weekDay,
          thursday: weekDay,
          friday: weekDay,
          saturday: weekDay,
          sunday: weekDay
        }).required()
      }
    },
    update: {
      body: {
        schedule: Joi.object({
          monday: weekDay,
          tuesday: weekDay,
          wednesday: weekDay,
          thursday: weekDay,
          friday: weekDay,
          saturday: weekDay,
          sunday: weekDay
        }).required(),
        status: Joi.string().valid(ScheduleStatuses.Active, ScheduleStatuses.Disabled)
      }
    },
    updateStatus: {
      params: {
        id: Joi.string()
          .regex(/^[0-9a-fA-F]{24}$/, { name: 'object id' })
          .required()
      },
      body: {
        status: Joi.string().valid(ScheduleStatuses.Active, ScheduleStatuses.Disabled).required()
      }
    }
  }
};
