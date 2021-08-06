import Joi from '@hapi/joi';
import { CompanyStaffRoles } from '../permission-group/permission-group.config';

const PERMISSION_LIST = Object.values(CompanyStaffRoles);

const FindSchema = Joi.object().keys({
  limit: Joi.number().integer().optional(),
  page: Joi.number().integer().optional(),
  sort: Joi.string(),
  type: Joi.string().valid(PERMISSION_LIST),
  path_list: Joi.array().items(Joi.string())
});

const createSchema = Joi.object().keys({
  path_list: Joi.array().items(Joi.string()).required(),
  method: Joi.string().valid(['GET', 'POST', 'PUT']).required(),
  type: Joi.string().valid(PERMISSION_LIST).required(),
  description: Joi.string()
});

const updateSchema = Joi.object().keys({
  id: Joi.string().regex(/^[0-9a-fA-F]{24}$/, {
    name: 'object id'
  }),
  path_list: Joi.array().items(Joi.string()),
  description: Joi.string(),
  type: Joi.string().valid(PERMISSION_LIST)
});

const refreshSchema = Joi.object().keys({
  type: Joi.string().only(['company', 'admin', 'user'])
});

// const idParamsSchema = Joi.object().keys({
//     id: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required()
// });

export default {
  admin: {
    FindSchema,
    createSchema,
    updateSchema,
    refreshSchema
  },
  user: {
    FindSchema
  }
};
