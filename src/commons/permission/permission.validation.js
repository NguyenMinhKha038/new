import Joi from '@hapi/joi';

const create = Joi.object().keys({
  path: Joi.string().required(),
  description: Joi.string().required()
});
const update = Joi.object().keys({
  id: Joi.string()
    .regex(/^[a-fA-F0-9]{24}$/)
    .required(),
  path: Joi.string(),
  description: Joi.string()
});

export const permissionValidation = {
  create,
  update
};
