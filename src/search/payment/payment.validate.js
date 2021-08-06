import Joi from '@hapi/joi';

const createSchema = Joi.object().keys({
  type: Joi.string().valid(['tel-card', 'electic-bill', 'water-bill']).required(),
  card_type: Joi.string().when('type', {
    is: 'tel-card',
    then: Joi.required(),
    otherwise: Joi.optional()
  }),
  value: Joi.number().min(10000).required(),
  destination: Joi.when('card_type', {
    is: Joi.exist(),
    then: Joi.string()
      .regex(/^\+84[3|5|7|8|9][0-9][0-9]{7}$/)
      .required(),
    otherwise: Joi.optional()
  })
});

const userFindSchema = Joi.object().keys({
  limit: Joi.number().optional(),
  page: Joi.number().when('limit', {
    is: Joi.exist(),
    then: Joi.required(),
    otherwise: Joi.optional()
  }),
  type: Joi.string().valid(['tel-card', 'electic-bill', 'water-bill']).optional(),
  value: Joi.number().optional(),
  sort: Joi.string().optional(),
  status: Joi.string().valid(['success', 'canceled']).optional()
});

const adminFindSchema = Joi.object().keys({
  limit: Joi.number().optional(),
  page: Joi.number().when('limit', {
    is: Joi.exist(),
    then: Joi.required(),
    otherwise: Joi.optional()
  }),
  user_id: Joi.string()
    .regex(/^[0-9a-zA-Z]{24}$/)
    .optional(),
  type: Joi.string().valid(['tel-card', 'electic-bill', 'water-bill']).optional(),
  type_card: Joi.string().valid(['viettel', 'vinaphone', 'mobiphone', 'vietnamoblie']).optional(),
  value: Joi.number().optional(),
  sort: Joi.string().optional(),
  status: Joi.string().valid(['success', 'canceled']).optional()
});

const updateSchema = Joi.object().keys({
  id: Joi.string()
    .regex(/^[0-9a-zA-Z]{24}$/)
    .required(),
  status: Joi.string().valid(['success', 'canceled']).required()
});

export default {
  user: {
    createSchema,
    userFindSchema
  },
  admin: {
    adminFindSchema,
    updateSchema
  }
};
