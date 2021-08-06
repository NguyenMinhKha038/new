import Joi from '@hapi/joi';

const get = Joi.object().keys({
  limit: Joi.number().optional(),
  page: Joi.number().optional(),
  sort: Joi.string().optional(),
  phone: Joi.string()
    .regex(/^\+84[3|5|7|8|9][0-9]{8}$/)
    .optional()
});

export default {
  get
};
