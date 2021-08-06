import Joi from '@hapi/joi';

const find = Joi.object().keys({
  limit: Joi.number().optional(),
  page: Joi.number().optional(),
  type: Joi.string()
    .regex(/(percent)|(money)/)
    .optional(),
  sort: Joi.string().optional(),
  product_id: Joi.string()
    .regex(/^[0-9a-zA-Z]{24}$/)
    .optional(),
  store_id: Joi.string()
    .regex(/^[0-9a-zA-Z]{24}$/)
    .optional(),
  promotion_id: Joi.string()
    .regex(/^[0-9a-zA-Z]{24}$/)
    .optional()
});

export default { find };
