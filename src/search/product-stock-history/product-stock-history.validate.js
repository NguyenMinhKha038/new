import Joi from '@hapi/joi';
import { MovingTypesExtra, Statuses, RequesterTypes } from '../stock/stock.config';

export default {
  getHistoryById: {
    params: {
      id: Joi.string()
        .regex(/^[0-9a-fA-F]{24}$/, { name: 'object id' })
        .required()
    },
    query: {
      select: Joi.string()
    }
  },
  getHistories: {
    query: {
      limit: Joi.number().min(1).max(50),
      page: Joi.number().min(1),
      select: Joi.string(),
      sort: Joi.string(),
      from_store_id: Joi.string().regex(/^[0-9a-fA-F]{24}$/, { name: 'object id' }),
      to_store_id: Joi.string().regex(/^[0-9a-fA-F]{24}$/, { name: 'object id' }),
      product_id: Joi.string().regex(/^[0-9a-fA-F]{24}$/, { name: 'object id' }),
      company_id: Joi.string().regex(/^[0-9a-fA-F]{24}$/, { name: 'object id' }),
      id: Joi.string().regex(/^[0-9a-fA-F]{24}$/, { name: 'object id' }),
      _id: Joi.string().regex(/^[0-9a-fA-F]{24}$/, { name: 'object id' }),
      type: Joi.string().valid(['import', 'export', 'sell', 'refund', 'move']),
      relate_to: Joi.string().trim(),
      requester_type: Joi.string().valid(RequesterTypes),
      moving_type: Joi.string().valid(Object.values(MovingTypesExtra)),
      created_from: Joi.date().iso(),
      created_to: Joi.date().iso().min(Joi.ref('created_from')),
      user_id: Joi.string().regex(/^[0-9a-fA-F]{24}$/, { name: 'object id' }),
      handled_by_id: Joi.string().regex(/^[0-9a-fA-F]{24}$/, { name: 'object id' }),
      approved_by_id: Joi.string().regex(/^[0-9a-fA-F]{24}$/, { name: 'object id' }),
      status: Joi.string().valid(Statuses),
      need_approved: Joi.boolean(),
      store_id: Joi.string().regex(/^[0-9a-fA-F]{24}$/, { name: 'object id' })
    }
  }
};
