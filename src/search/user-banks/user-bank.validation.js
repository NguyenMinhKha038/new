import Joi from '@hapi/joi';

const create = Joi.object().keys({
  name: Joi.string().trim().required(),
  branch: Joi.string().trim().required(),
  account_name: Joi.string()
    .trim()
    .min(3)
    // .regex(/^[A-Z]+$/)
    .required(),
  account_number: Joi.string().trim().min(3).required(),
  is_default: Joi.boolean().default(false)
});

const update = Joi.object().keys({
  bank_id: Joi.string()
    .trim()
    // .regex(/^[0-9a-zA-Z]{24}$/)
    .required(),
  name: Joi.string().trim(),
  branch: Joi.string().trim(),
  account_name: Joi.string().trim().min(3),
  account_number: Joi.string().trim().min(3),
  is_default: Joi.boolean()
});

const get = Joi.object().keys({
  limit: Joi.number(),
  page: Joi.number().min(1),
  sort: Joi.string(),
  select: Joi.string()
});

export default {
  create,
  update,
  get
};
