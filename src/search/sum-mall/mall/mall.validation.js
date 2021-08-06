import Joi from '@hapi/joi';
import { MallStatuses } from './mall.config';

const periodTime = Joi.object({
  from: Joi.number().min(0).max(24).required(),
  to: Joi.number().min(0).max(24).required(),
  active: Joi.boolean().required()
}).required();

const workShifts = Joi.object({
  work_shifts: Joi.array().items(periodTime).unique().min(1).required(),
  active: Joi.boolean().required()
});

export default {
  admin: {
    get: {
      query: {
        limit: Joi.number().min(0).max(50),
        page: Joi.number().min(1),
        select: Joi.string(),
        sort: Joi.string(),
        manager_id: Joi.string().regex(/^[0-9a-fA-F]{24}$/, { name: 'object id' }),
        status: Joi.string().valid(Object.values(MallStatuses)),
        email: Joi.string().email(),
        staff_register_schedule: Joi.boolean()
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
        name: Joi.string().trim().required(),
        description: Joi.string().required(),
        address: Joi.object({
          text: Joi.string().min(0).max(256).required(),
          province: Joi.string().min(0).max(48).required(),
          district: Joi.string().min(0).max(48).required(),
          ward: Joi.string().min(0).max(48).required(),
          province_code: Joi.string().min(0).max(48).required(),
          district_code: Joi.string().min(0).max(48).required(),
          ward_code: Joi.string().min(0).max(48).required(),
          phone_number: Joi.string().length(10),
          manager_name: Joi.string().required()
        }).required(),
        location: Joi.string().regex(/^(\-?\d+(\.\d+)?).?,\s*(\-?\d+(\.\d+)?)$/),
        weekly_work_shifts: Joi.object({
          monday: workShifts,
          tuesday: workShifts,
          wednesday: workShifts,
          thursday: workShifts,
          friday: workShifts,
          saturday: workShifts,
          sunday: workShifts
        }).required(),
        phone_number: Joi.string().length(10).required(),
        working_time: Joi.object({
          monday: periodTime,
          tuesday: periodTime,
          wednesday: periodTime,
          thursday: periodTime,
          friday: periodTime,
          saturday: periodTime,
          sunday: periodTime
        }).required(),
        email: Joi.string().email().required(),
        manager_id: Joi.string()
          .regex(/^[0-9a-fA-F]{24}$/, { name: 'object id' })
          .required()
      }
    },
    updateMallManager: {
      params: {
        id: Joi.string()
          .regex(/^[0-9a-fA-F]{24}$/, { name: 'object id' })
          .required()
      },
      body: {
        manager_id: Joi.string()
          .regex(/^[0-9a-fA-F]{24}$/, { name: 'object id' })
          .required()
      }
    },
    updateStatus: {
      params: {
        id: Joi.string()
          .regex(/^[0-9a-fA-F]{24}$/, { name: 'object id' })
          .required()
      },
      body: {
        status: Joi.string().valid(MallStatuses.Active, MallStatuses.AdminDisabled).required()
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
        status: Joi.string().valid(Object.values(MallStatuses)),
        email: Joi.string().email(),
        staff_register_schedule: Joi.boolean()
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
    update: {
      params: {
        id: Joi.string()
          .regex(/^[0-9a-fA-F]{24}$/, { name: 'object id' })
          .required()
      },
      body: {
        name: Joi.string().trim(),
        description: Joi.string(),
        address: Joi.object({
          text: Joi.string().min(0).max(256).required(),
          province: Joi.string().min(0).max(48).required(),
          district: Joi.string().min(0).max(48).required(),
          ward: Joi.string().min(0).max(48).required(),
          province_code: Joi.string().min(0).max(48).required(),
          district_code: Joi.string().min(0).max(48).required(),
          ward_code: Joi.string().min(0).max(48).required(),
          phone_number: Joi.string().length(10).required(),
          manager_name: Joi.string().required()
        }),
        location: Joi.string().regex(/^(\-?\d+(\.\d+)?).?,\s*(\-?\d+(\.\d+)?)$/),
        weekly_work_shifts: Joi.object({
          monday: workShifts,
          tuesday: workShifts,
          wednesday: workShifts,
          thursday: workShifts,
          friday: workShifts,
          saturday: workShifts,
          sunday: workShifts
        }),
        phone_number: Joi.string().length(10),
        email: Joi.string().email(),
        working_time: Joi.object({
          monday: periodTime,
          tuesday: periodTime,
          wednesday: periodTime,
          thursday: periodTime,
          friday: periodTime,
          saturday: periodTime,
          sunday: periodTime
        }),
        staff_register_schedule: Joi.boolean()
      }
    },
    updateStatus: {
      params: {
        id: Joi.string()
          .regex(/^[0-9a-fA-F]{24}$/, { name: 'object id' })
          .required()
      },
      body: {
        status: Joi.string().valid(MallStatuses.Active, MallStatuses.Disabled).required()
      }
    }
  },
  get: {
    query: {
      limit: Joi.number().min(0).max(50),
      page: Joi.number().min(1),
      select: Joi.string(),
      sort: Joi.string(),
      manager_id: Joi.string().regex(/^[0-9a-fA-F]{24}$/, { name: 'object id' }),
      staff_register_schedule: Joi.boolean()
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
  search: {
    query: {
      mall_name: Joi.string().min(0).trim().required(),
      limit: Joi.number().min(0).max(50),
      page: Joi.number().min(1)
    }
  }
};
