import Joi from '@hapi/joi';
export const autoGetSchema = Joi.object().keys({
  product_id: Joi.string()
    .regex(/^[0-9a-zA-Z]{24}$/)
    .required(),
  store_id: Joi.string()
    .regex(/^[0-9a-zA-Z]{24}$/)
    .required(),
  apply_count: Joi.number().required(),
  promotion_code_id: Joi.string().regex(/^[0-9a-zA-Z]{24}$/),
  model_id: Joi.string()
    .regex(/^[0-9a-zA-Z]{24}$/)
    .required()
});
