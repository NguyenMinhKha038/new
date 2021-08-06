import Joi from '@hapi/joi';
import { pathIdSchema } from '../../../commons/utils';
import { ScheduleStatuses } from './work-schedule.config';

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
        mall_id: Joi.string().regex(/^[0-9a-fA-F]{24}$/, { name: 'object id' }),
        staff_id: Joi.string().regex(/^[0-9a-fA-F]{24}$/, { name: 'object id' }),
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
    }
  },
  mall: {
    get: {
      query: {
        limit: Joi.number().min(0).max(50),
        page: Joi.number().min(1),
        select: Joi.string(),
        sort: Joi.string(),
        status: Joi.string().valid(Object.values(ScheduleStatuses)),
        staff_id: Joi.string().regex(/^[0-9a-fA-F]{24}$/, { name: 'object id' }),
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
        staff_id: Joi.string()
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
        details: Joi.when('schedule', {
          is: Joi.exist(),
          then: Joi.forbidden(),
          otherwise: Joi.array()
            .items({
              date: Joi.when('schedule', {
                is: Joi.exist(),
                then: Joi.forbidden(),
                otherwise: Joi.date().iso().greater('now').required()
              }),
              work_shifts: Joi.when('schedule', {
                is: Joi.exist(),
                then: Joi.forbidden(),
                otherwise: Joi.array().items(periodTime).min(1).required()
              })
            })
            .unique()
            .required()
        })
      }
    },
    update: {
      body: {
        staff_id: pathIdSchema.required(),
        update: Joi.array()
          .items({
            id: Joi.string().regex(/^[0-9a-fA-F]{24}$/, { name: 'object id' }),
            date: Joi.when('id', {
              is: Joi.exist(),
              then: Joi.forbidden(),
              otherwise: Joi.date().iso().min('now')
            }),
            work_shifts: Joi.array().items(periodTime).required()
          })
          .min(1)
          .unique((a, b) => a.id === b.id && a.date === b.date)
          .required()
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
