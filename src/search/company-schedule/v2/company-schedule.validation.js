import Joi from '@hapi/joi';
import { pathIdSchema } from '../../../commons/utils';
import { Levels } from '../company-schedule.config';
import { ScheduleStatuses } from '../company-schedule.config';

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
        to: Joi.date().iso(),
        level: Joi.string().valid(Object.values(Levels))
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
        to: Joi.date().iso(),
        level: Joi.string().valid(Object.values(Levels))
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
        permission_group_id: pathIdSchema.required(),
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
          .unique()
          .required()
      }
    }
  }
};
