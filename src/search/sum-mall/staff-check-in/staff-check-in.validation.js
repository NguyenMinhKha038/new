import Joi from '@hapi/joi';
import { CheckInStatuses, CheckInRoles } from './staff-check-in.config';

export default {
  admin: {
    get: {
      query: {
        limit: Joi.number().min(0).max(50),
        page: Joi.number().min(1),
        select: Joi.string(),
        sort: Joi.string(),
        staff_id: Joi.string().regex(/^[0-9a-fA-F]{24}$/, { name: 'object id' }),
        mall_id: Joi.string().regex(/^[0-9a-fA-F]{24}$/, { name: 'object id' }),
        is_finish: Joi.boolean(),
        check_in_by: Joi.string().valid(Object.values(CheckInRoles)),
        status: Joi.string().valid(Object.values(CheckInStatuses)),
        from: Joi.date().iso(),
        to: Joi.when('from', {
          is: Joi.exist(),
          then: Joi.date().iso().greater(Joi.ref('from')).required(),
          otherwise: Joi.forbidden()
        })
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
        staff_id: Joi.string().regex(/^[0-9a-fA-F]{24}$/, { name: 'object id' }),
        is_finish: Joi.boolean(),
        check_in_by: Joi.string().valid(Object.values(CheckInRoles)),
        status: Joi.string().valid(Object.values(CheckInStatuses)),
        from: Joi.date().iso(),
        to: Joi.when('from', {
          is: Joi.exist(),
          then: Joi.date().iso().greater(Joi.ref('from')).required(),
          otherwise: Joi.forbidden()
        })
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
    checkIn: {
      body: {
        check_in_id: Joi.string()
          .regex(/^[0-9a-fA-F]{24}$/, { name: 'object id' })
          .required()
      }
    },
    update: {
      params: {
        id: Joi.string()
          .regex(/^[0-9a-fA-F]{24}$/, { name: 'object id' })
          .required()
      },
      body: {
        status: Joi.string().valid(CheckInStatuses.Active, CheckInStatuses.ManagerDisabled)
      }
    },
    checkout: {
      params: {
        id: Joi.string()
          .regex(/^[0-9a-fA-F]{24}$/, { name: 'object id' })
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
        is_finish: Joi.boolean(),
        check_in_by: Joi.string().valid(Object.values(CheckInRoles)),
        status: Joi.string().valid(Object.values(CheckInStatuses)),
        from: Joi.date().iso(),
        to: Joi.when('from', {
          is: Joi.exist(),
          then: Joi.date().iso().greater(Joi.ref('from')).required(),
          otherwise: Joi.forbidden()
        })
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
    checkIn: {
      body: {
        check_in_id: Joi.string()
          .regex(/^[0-9a-fA-F]{24}$/, { name: 'object id' })
          .required()
      }
    },
    checkout: {
      params: {
        id: Joi.string()
          .regex(/^[0-9a-fA-F]{24}$/, { name: 'object id' })
          .required()
      }
    }
  }
};
