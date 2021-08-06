import Joi from '@hapi/joi';
import { getDate } from '../../commons/utils';
export default {
  get: {
    query: {
      limit: Joi.number().min(1).max(50),
      position: Joi.number().valid(1, 2, 3, 4, 5),
      page: Joi.number().min(1),
      select: Joi.string(),
      sort: Joi.string(),
      company_id: Joi.string().regex(/^[0-9a-fA-F]{24}$/, { name: 'object id' })
    }
  },
  getById: {
    params: {
      id: Joi.string()
        .regex(/^[0-9a-fA-F]{24}$/, { name: 'object id' })
        .required()
    }
  },
  company: {
    get: {
      query: {
        limit: Joi.number().min(1).max(50),
        page: Joi.number().min(1),
        select: Joi.string(),
        sort: Joi.string(),
        status: Joi.string().valid('pending', 'approved', 'rejected', 'disabled'),
        active: Joi.bool(),
        start_time: Joi.date()
          .iso()
          .when('custom_status', {
            is: Joi.string().exist().valid('created', 'started', 'ended'),
            then: Joi.required(),
            otherwise: Joi.strip()
          }),
        end_time: Joi.date()
          .iso()
          .when('custom_status', {
            is: Joi.string().exist().valid('created', 'started', 'ended'),
            then: Joi.required(),
            otherwise: Joi.strip()
          }),
        custom_status: Joi.string().valid(
          'upcoming',
          'expired',
          'running',
          'created',
          'started',
          'ended'
        )
      }
    },
    getSlot: {
      query: {
        position: Joi.number().positive(),
        _newDate: Joi.date().default(getDate, 'new Date'),
        start_time: Joi.date().iso().greater(Joi.ref('_newDate')).required(),
        end_time: Joi.date().iso().greater(Joi.ref('start_time')).required()
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
    post: {
      body: {
        image: Joi.string().required(),
        name: Joi.string().max(256).required(),
        start_time: Joi.date().iso().greater('now').required(),
        end_time: Joi.date().iso().greater(Joi.ref('start_time')).required(),
        position: Joi.number().valid(1, 2, 3, 4, 5).required()
      }
    },
    put: {
      params: {
        id: Joi.string()
          .regex(/^[0-9a-fA-F]{24}$/, { name: 'object id' })
          .required()
      },
      body: {
        image: Joi.string(),
        name: Joi.string().max(256),
        start_time: Joi.date().iso().greater('now'),
        end_time: Joi.date()
          .iso()
          .greater(Joi.ref('start_time'))
          .when('start_time', { is: Joi.exist(), then: Joi.required() }),
        position: Joi.number().valid(1, 2, 3, 4, 5),
        status: Joi.string().valid('disabled', 'pending')
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
        company_id: Joi.string().regex(/^[0-9a-fA-F]{24}$/, {
          name: 'object id'
        }),
        status: Joi.string().valid('pending', 'approved', 'rejected', 'disabled'),
        active: Joi.bool(),
        start_time: Joi.date()
          .iso()
          .when('custom_status', {
            is: Joi.string().exist().valid('created', 'started', 'ended'),
            then: Joi.required(),
            otherwise: Joi.strip()
          }),
        end_time: Joi.date()
          .iso()
          .when('custom_status', {
            is: Joi.string().exist().valid('created', 'started', 'ended'),
            then: Joi.required(),
            otherwise: Joi.strip()
          }),
        custom_status: Joi.string().valid(
          'upcoming',
          'expired',
          'running',
          'created',
          'started',
          'ended'
        ),
        is_admin_posted: Joi.boolean()
      }
    },
    post: {
      body: {
        image: Joi.string().required(),
        name: Joi.string().max(256).required(),
        start_time: Joi.date().iso().greater('now').required(),
        end_time: Joi.date().iso().greater(Joi.ref('start_time')).required(),
        position: Joi.number().valid(1, 2, 3, 4, 5).required(),
        status: Joi.string().valid('pending', 'approved', 'disabled')
      }
    },
    put: {
      params: {
        id: Joi.string()
          .regex(/^[0-9a-fA-F]{24}$/, { name: 'object id' })
          .required()
      },
      body: {
        image: Joi.string(),
        name: Joi.string().max(256),
        start_time: Joi.date().iso().greater('now'),
        end_time: Joi.date().iso().greater(Joi.ref('start_time')),
        position: Joi.number().valid(1, 2, 3, 4, 5),
        status: Joi.string().valid('pending', 'approved', 'disabled')
      }
    },
    getById: {
      params: {
        id: Joi.string()
          .regex(/^[0-9a-fA-F]{24}$/, { name: 'object id' })
          .required()
      }
    },
    approve: {
      params: {
        id: Joi.string()
          .regex(/^[0-9a-fA-F]{24}$/, { name: 'object id' })
          .required()
      },
      body: {
        status: Joi.string().valid('approved', 'rejected').required()
      }
    }
  }
};
