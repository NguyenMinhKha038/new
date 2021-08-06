import Joi from '@hapi/joi';

const createSchema = Joi.object().keys({
  receiver_phone: Joi.string()
    .regex(/^\+84[3|5|7|8|9][0-9][0-9]{7}$/)
    .required(),
  value: Joi.number().min(50000).required(),
  // code: Joi.string().required(),
  PIN: Joi.string()
    .regex(/^[0-9]{6}$/)
    .required()
});

const findSchema = Joi.object().keys({
  limit: Joi.number().optional(),
  page: Joi.number().when('limit', {
    is: Joi.exist(),
    then: Joi.required(),
    otherwise: Joi.optional()
  }),
  sort: Joi.string().optional(),
  value: Joi.number().optional(),
  start_time: Joi.date().iso().optional(),
  end_time: Joi.date().iso().min(Joi.ref('start_time')).optional(),
  type: Joi.string().valid(['receiver', 'sender']).required()
});

const adminFind = Joi.object().keys({
  limit: Joi.number().optional(),
  page: Joi.number().when('limit', {
    is: Joi.exist(),
    then: Joi.required(),
    otherwise: Joi.optional()
  }),
  sort: Joi.string().optional(),
  receiver_id: Joi.string()
    .regex(/^[0-9a-zA-Z]{24}$/)
    .optional(),
  value: Joi.number().optional(),
  sender_id: Joi.string()
    .regex(/^[0-9a-zA-Z]{24}$/)
    .optional(),
  start_time: Joi.date().iso().optional(),
  end_time: Joi.date().iso().min(Joi.ref('start_time')).optional()
});

const statistic = Joi.object().keys({
  start_time: Joi.date().iso(),
  end_time: Joi.date().iso().min(Joi.ref('start_time')),
  sender_id: Joi.string().regex(/^[0-9a-zA-Z]{24}$/),
  receiver_id: Joi.string().regex(/^[0-9a-zA-Z]{24}$/)
});

export default {
  user: {
    createSchema,
    findSchema
  },
  admin: {
    findSchema: adminFind,
    statistic
  }
};

// const adminFindSchema = Joi.object
