import Joi from '@hapi/joi';

export default {
  admin: {
    get: {
      query: {
        limit: Joi.number().min(1).max(50),
        page: Joi.number().min(1),
        select: Joi.string(),
        start_time: Joi.date().iso(),
        end_time: Joi.date().iso().min(Joi.ref('start_time')),
        company_id: Joi.string().regex(/^[0-9a-fA-F]{24}$/, { name: 'object id' }),
        sort: Joi.string(),
        type: Joi.string().valid([
          'deposit',
          'withdraw',
          'user_pay_order',
          'pay_service_fee',
          'pay_transport_fee',
          'refund_order',
          'pay_banner_fee'
        ])
      }
    }
  },
  company: {
    get: {
      query: {
        limit: Joi.number().min(1).max(50),
        page: Joi.number().min(1),
        select: Joi.string(),
        sort: Joi.string(),
        start_time: Joi.date().iso(),
        end_time: Joi.date().iso().min(Joi.ref('start_time')),
        type: Joi.string().valid([
          'deposit',
          'withdraw',
          'user_pay_order',
          'pay_service_fee',
          'pay_transport_fee',
          'refund_order',
          'pay_banner_fee'
        ])
      }
    }
  }
};
