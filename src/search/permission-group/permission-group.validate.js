import Joi from '@hapi/joi';
import { companyPermissionType } from './permission-group.config';
const idSchema = Joi.object().keys({
  id: Joi.string()
    .regex(/^[0-9a-zA-Z]{24}$/)
    .required()
});
const periodTimeSchema = Joi.object({
  from: Joi.number().min(0).max(24).required(),
  to: Joi.number().min(0).max(24).required()
}).required();
const weekDayScheduleSchema = Joi.array().items(periodTimeSchema).unique();
//owner
const createSchema = Joi.object().keys({
  // company_id: Joi.string().regex(/^[0-9a-zA-Z]{24}$/).required(),
  store_id: Joi.string()
    .regex(/^[0-9a-zA-Z]{24}$/)
    .when('type', {
      is: Joi.array().has(['store_stock', 'cashier', 'seller', 'store_manager']),
      then: Joi.required(),
      otherwise: Joi.forbidden()
    }),
  // warehouse_id: Joi.string()
  //   .regex(/^[0-9a-zA-Z]{24}$/)
  //   .when('type', {
  //     is: Joi.array().has(['warehouse_stock', 'warehouse_manager']),
  //     then: Joi.required(),
  //     otherwise: Joi.forbidden()
  //   }),
  phone_number: Joi.string()
    .regex(/^\+84[3|5|7|8|9][0-9][0-9]{7}$/)
    .required(),
  type: Joi.array()
    .items(Joi.string().valid(Object.values(companyPermissionType)))
    .unique()
    .required(),
  schedule: Joi.object({
    monday: weekDayScheduleSchema,
    tuesday: weekDayScheduleSchema,
    wednesday: weekDayScheduleSchema,
    thursday: weekDayScheduleSchema,
    friday: weekDayScheduleSchema,
    saturday: weekDayScheduleSchema,
    sunday: weekDayScheduleSchema
  })
});

const update = Joi.object().keys({
  id: Joi.string()
    .regex(/^[0-9a-zA-Z]{24}$/)
    .required(),
  status: Joi.string().valid(['active', 'disabled']),
  store_id: Joi.string()
    .regex(/^[0-9a-zA-Z]{24}$/)
    .when('type', {
      is: Joi.array().has(['store_stock', 'cashier', 'seller', 'store_manager']).exist(),
      then: Joi.required(),
      otherwise: Joi.forbidden()
    }),
  // warehouse_id: Joi.string()
  //   .regex(/^[0-9a-zA-Z]{24}$/)
  //   .when('type', {
  //     is: Joi.array().has(['warehouse_stock', 'warehouse_manager']),
  //     then: Joi.required(),
  //     otherwise: Joi.forbidden()
  //   }),
  type: Joi.array()
    .items(Joi.string().valid(Object.values(companyPermissionType)))
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
});

const updateStatus = Joi.object().keys({
  id: Joi.string()
    .regex(/^[0-9a-zA-Z]{24}$/)
    .required(),
  status: Joi.string().valid(['active', 'disabled'])
});

const ownerFindSchema = Joi.object().keys({
  limit: Joi.number().optional(),
  page: Joi.number().optional(),
  type: Joi.string().valid(Object.values(companyPermissionType)).optional(),
  sort: Joi.string().optional(),
  status: Joi.string().valid(['active', 'disabled']).optional(),
  level: Joi.string().valid(['company', 'store']),
  store_id: Joi.string().regex(/^[0-9a-zA-Z]{24}$/)
});

//admin
const adminFindSchema = Joi.object().keys({
  limit: Joi.number().optional(),
  page: Joi.number().optional(),
  type: Joi.string().valid(Object.values(companyPermissionType)).optional(),
  company_id: Joi.string()
    .regex(/^[0-9a-zA-Z]{24}$/)
    .optional(),
  store_id: Joi.string()
    .regex(/^[0-9a-zA-Z]{24}$/)
    .optional(),
  user_id: Joi.string()
    .regex(/^[0-9a-zA-Z]{24}$/)
    .optional(),
  user_ids: Joi.array()
    .items(Joi.string().regex(/^[0-9a-zA-Z]{24}$/))
    .optional(),
  status: Joi.string().optional()
});

const rawAdminFindSchema = Joi.object().keys({
  limit: Joi.number().optional(),
  page: Joi.number().optional(),
  type: Joi.string().valid(Object.values(companyPermissionType)).optional(),
  company_ids: Joi.array()
    .items(Joi.string().regex(/[0-9a-zA-Z]{24}$/))
    .optional(),
  store_ids: Joi.array()
    .items(Joi.string().regex(/[0-9a-zA-Z]{24}$/))
    .optional(),
  user_ids: Joi.array()
    .items(Joi.string().regex(/[0-9a-zA-Z]{24}$/))
    .optional(),
  status: Joi.string().optional()
});

//user
const userFindSchema = Joi.object().keys({
  type: Joi.string().valid(Object.values(companyPermissionType)).optional()
});

export default {
  idSchema,
  owner: {
    createSchema,
    ownerFindSchema,
    updateStatus,
    update
  },
  admin: {
    adminFindSchema,
    rawAdminFindSchema
  },
  user: {
    userFindSchema
  }
};
