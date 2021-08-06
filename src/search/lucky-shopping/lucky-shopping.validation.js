import Joi from '@hapi/joi';

export default {
  get: {
    query: {
      date: Joi.date().iso()
    }
  },
  setDate: {
    body: {
      product_ids: Joi.array()
        .items(Joi.string().regex(/^[0-9a-fA-F]{24}$/, { name: 'object id' }))
        .required(),
      date: Joi.date().iso().required()
    }
  },
  put: {
    body: {
      _id: Joi.string()
        .regex(/^[0-9a-fA-F]{24}$/, { name: 'object id' })
        .required(),
      product_id: Joi.string()
        .regex(/^[0-9a-fA-F]{24}$/, { name: 'object id' })
        .required(),
      number_prizes: Joi.number().positive(),
      order_ids: Joi.array().items(Joi.string().regex(/^[0-9a-fA-F]{24}$/, { name: 'object id' }))
    }
  }
};
