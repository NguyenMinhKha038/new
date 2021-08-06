import Joi from '@hapi/joi';

export default {
  user: {
    autoGet: {
      body: {
        global_promotion_code_id: Joi.string().regex(/^[0-9a-zA-Z]{24}$/),
        product_storing_id: Joi.string()
          .regex(/^[0-9a-zA-Z]{24}$/)
          .required(),
        apply_count: Joi.number().min(0).required(),
        model_id: Joi.string().regex(/^[0-9a-zA-Z]{24}$/)
      }
    }
  }
};
