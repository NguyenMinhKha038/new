import Joi from '@hapi/joi';
import userHistoryConfig from './user-history.config';
import historyConfig from './user-history.config';

export default {
  admin: {
    get: {
      query: {
        limit: Joi.number().min(1).max(50),
        page: Joi.number().min(1),
        select: Joi.string(),
        sort: Joi.string(),
        user_id: Joi.string().regex(/^[0-9a-fA-F]{24}$/, { name: 'object id' }),
        company_id: Joi.string().regex(/^[0-9a-fA-F]{24}$/, {
          name: 'object id'
        }),
        transaction_id: Joi.string().regex(/^[0-9a-fA-F]{24}$/, {
          name: 'object id'
        }),
        start_time: Joi.date().iso(),
        type: Joi.string().valid(historyConfig.TYPE),
        end_time: Joi.date().iso().min(Joi.ref('start_time')),
        onModel: Joi.string().valid(userHistoryConfig.MODEL)
      }
    }
  },
  user: {
    get: {
      query: {
        limit: Joi.number().min(1).max(50),
        page: Joi.number().min(1),
        select: Joi.string(),
        type: Joi.string().valid(historyConfig.TYPE),
        sort: Joi.string(),
        start_time: Joi.date().iso(),
        end_time: Joi.date().iso().min(Joi.ref('start_time')),
        onModel: Joi.string().valid(historyConfig.MODEL)
      }
    }
  }
};
