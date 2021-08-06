import Joi from '@hapi/joi';
import { getDate } from '../../commons/utils';
export default {
  user: {
    checkout: {
      body: {
        publisher: Joi.string().valid('VTT', 'VNM', 'VNP', 'VMS', 'GMB').required(),
        amount: Joi.number().valid(20000, 30000, 50000, 100000, 200000, 300000, 500000).required(),
        combo: Joi.string()
          .valid('three_month', 'six_month', 'twelve_month', 'basic')
          .default('basic'),
        type: Joi.string().valid('fast', 'slow').required()
      }
    },
    pay: {
      body: {
        publisher: Joi.string().valid('VTT', 'VNM', 'VNP', 'VMS', 'GMB').required(),
        amount: Joi.number().valid(20000, 30000, 50000, 100000, 200000, 300000, 500000).required(),
        combo: Joi.string()
          .valid('three_month', 'six_month', 'twelve_month', 'basic')
          .default('basic'),
        type: Joi.string().valid('fast', 'slow').required(),
        receiver: Joi.string()
          .regex(/^0[3|5|7|8|9][0-9]{8}$/)
          .required()
      }
    },
    getCombo: {
      query: {
        limit: Joi.number().min(1).max(50),
        page: Joi.number().min(1),
        select: Joi.string(),
        sort: Joi.string(),
        publisher: Joi.string().valid('VTT', 'VNM', 'VNP', 'VMS', 'GMB'),
        amount: Joi.number().valid(20000, 30000, 50000, 100000, 200000, 300000, 500000),
        combo: Joi.string().valid('three_month', 'six_month', 'twelve_month'),
        type: Joi.string().valid('fast', 'slow'),
        start_time: Joi.date().iso(),
        end_time: Joi.date()
          .iso()
          .when('start_time', { is: Joi.exist(), then: Joi.date().default(getDate, 'now') })
      }
    },
    get: {
      query: {
        limit: Joi.number().min(1).max(50),
        page: Joi.number().min(1),
        select: Joi.string(),
        sort: Joi.string(),
        publisher: Joi.string().valid('VTT', 'VNM', 'VNP', 'VMS', 'GMB'),
        amount: Joi.number().valid(20000, 30000, 50000, 100000, 200000, 300000, 500000),
        combo: Joi.string().valid('three_month', 'six_month', 'twelve_month'),
        type: Joi.string().valid('fast', 'slow'),
        combo_id: Joi.string().regex(/^[0-9a-fA-F]{24}$/, { name: 'object id' }),
        in_combo: Joi.boolean(),
        start_time: Joi.date().iso(),
        end_time: Joi.date()
          .iso()
          .when('start_time', { is: Joi.exist(), then: Joi.date().default(getDate, 'now') })
      }
    }
  },
  admin: {
    getCombo: {
      query: {
        limit: Joi.number().min(1).max(50),
        page: Joi.number().min(1),
        select: Joi.string(),
        sort: Joi.string(),
        publisher: Joi.string().valid('VTT', 'VNM', 'VNP', 'VMS', 'GMB'),
        amount: Joi.number().valid(20000, 30000, 50000, 100000, 200000, 300000, 500000),
        combo: Joi.string().valid('three_month', 'six_month', 'twelve_month'),
        type: Joi.string().valid('fast', 'slow'),
        user_id: Joi.string().regex(/^[0-9a-fA-F]{24}$/, { name: 'object id' }),
        populate: Joi.string(),
        start_time: Joi.date().iso(),
        end_time: Joi.date()
          .iso()
          .when('start_time', { is: Joi.exist(), then: Joi.date().default(getDate, 'now') })
      }
    },
    get: {
      query: {
        limit: Joi.number().min(1).max(50),
        page: Joi.number().min(1),
        select: Joi.string(),
        sort: Joi.string(),
        publisher: Joi.string().valid('VTT', 'VNM', 'VNP', 'VMS', 'GMB'),
        amount: Joi.number().valid(20000, 30000, 50000, 100000, 200000, 300000, 500000),
        combo: Joi.string().valid('three_month', 'six_month', 'twelve_month'),
        type: Joi.string().valid('fast', 'slow'),
        combo_id: Joi.string().regex(/^[0-9a-fA-F]{24}$/, { name: 'object id' }),
        user_id: Joi.string().regex(/^[0-9a-fA-F]{24}$/, { name: 'object id' }),
        in_combo: Joi.boolean(),
        populate: Joi.string(),
        start_time: Joi.date().iso(),
        end_time: Joi.date()
          .iso()
          .when('start_time', { is: Joi.exist(), then: Joi.date().default(getDate, 'now') })
      }
    }
  },
  getById: {
    params: {
      id: Joi.string()
        .regex(/^[0-9a-fA-F]{24}$/, { name: 'object id' })
        .required()
    },
    query: {
      populate: Joi.string()
    }
  }
};
