import Joi from '@hapi/joi';

const create = Joi.object().keys({
  bank_name: Joi.string().required(),
  bank_account: Joi.string().required(),
  bank_branch: Joi.string().required(),
  bank_owner_name: Joi.string().required(),
  image_path: Joi.string().required(),
  priority: Joi.number().optional()
});

const update = Joi.object().keys({
  _id: Joi.string().required(),
  bank_name: Joi.string().optional(),
  bank_account: Joi.string().optional(),
  bank_branch: Joi.string().optional(),
  bank_owner_name: Joi.string().optional(),
  image_path: Joi.string().optional(),
  priority: Joi.number().optional(),
  status: Joi.string().only(['active', 'disabled', 'updating']).optional()
});

const find = Joi.object().keys({
  limit: Joi.number().optional(),
  page: Joi.number().optional(),
  sort: Joi.string().optional(),
  bank_name: Joi.string().optional(),
  bank_branch: Joi.string().optional(),
  bank_owner_name: Joi.string().optional(),
  bank_account: Joi.string().optional()
});

export default {
  admin: {
    create,
    update,
    find
  },
  user: {
    find
  }
};
