import Joi from '@hapi/joi';

// user
const createSchema = Joi.object().keys({
  promotion_id: Joi.string()
    .regex(/^[0-9a-zA-Z]{24}$/)
    .required()
});

const idSchema = Joi.object().keys({
  id: Joi.string()
    .regex(/^[0-9a-zA-Z]{24}$/)
    .required()
});

const findSchema = Joi.object().keys({
  promotion_id: Joi.string()
    .regex(/^[0-9a-zA-Z]{24}$/)
    .optional(),
  status: Joi.string().valid(['active', 'used', 'expired']).optional(),
  limit: Joi.number().optional(),
  page: Joi.number().optional(),
  sort: Joi.string().optional()
});

const userUsedSchema = Joi.object().keys({
  code: Joi.string()
    .regex(/^[A-Z0-9]{6}-([A-Z0-9]{6}$|[A-Z0-9]{8}$)/)
    .required()
});

const autoGetSchema = Joi.object().keys({
  // user_id: Joi.string().required(),
  product_storing_id: Joi.string().required()
  // store_id: Joi.string().required()
});

//admin
const adminFindSchema = Joi.object().keys({
  promotion_id: Joi.string()
    .regex(/^[0-9a-zA-Z]{24}$/)
    .optional(),
  user_id: Joi.string()
    .regex(/^[0-9a-zA-Z]{24}$/)
    .optional(),
  status: Joi.string().valid(['active', 'used', 'expired']).optional(),
  limit: Joi.number().optional(),
  page: Joi.number().optional(),
  sort: Joi.string().optional()
});

// owner
const ownerFindSchema = Joi.object().keys({
  promotion_id: Joi.string()
    .regex(/^[0-9a-zA-Z]{24}$/)
    .optional(),
  user_id: Joi.string()
    .regex(/^[0-9a-zA-Z]{24}$/)
    .optional(),
  status: Joi.string().valid(['active', 'used', 'expired']).optional(),
  limit: Joi.number().optional(),
  page: Joi.number().optional()
});

export default {
  idSchema,
  user: {
    createSchema,
    findSchema,
    userUsedSchema,
    autoGetSchema
  },
  admin: {
    adminFindSchema
  },
  owner: {
    ownerFindSchema
  }
};
