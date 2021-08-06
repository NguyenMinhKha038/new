import Joi from '@hapi/joi';

export default {
  company: {
    get: {
      query: {
        limit: Joi.number().min(1).max(50),
        page: Joi.number().min(1),
        select: Joi.string(),
        sort: Joi.string(),
        is_read: Joi.boolean(),
        exclude_types: Joi.string(),
        type: Joi.string(), //support old version
        include_types: Joi.string()
      }
    },
    updateDevice: {
      body: {
        token: Joi.string().allow('').required(),
        platform: Joi.valid('mobile', 'web').required(),
        device_id: Joi.string().max(200)
      }
    },
    getById: {
      params: {
        id: Joi.string().regex(/^[0-9a-fA-F]{24}$/, {
          name: 'object id'
        })
      }
    }
  },
  user: {
    get: {
      query: {
        limit: Joi.number().min(1).max(50),
        page: Joi.number().min(1),
        select: Joi.string(),
        sort: Joi.string(),
        is_read: Joi.boolean(),
        exclude_types: Joi.string(),
        type: Joi.string(), //support old version
        include_types: Joi.string()
      }
    },
    updateDevice: {
      body: {
        token: Joi.string().allow('').required(),
        platform: Joi.valid('mobile', 'web').required(),
        device_id: Joi.string().max(200)
      }
    }
  },
  read: {
    query: {
      _id: Joi.string().regex(/^[0-9a-fA-F]{24}$/, {
        name: 'object id'
      })
    }
  },
  mall: {
    updateDevice: {
      body: {
        token: Joi.string().allow('').required(),
        platform: Joi.valid('mobile', 'web').required(),
        device_id: Joi.string().max(200)
      }
    }
  }
};
