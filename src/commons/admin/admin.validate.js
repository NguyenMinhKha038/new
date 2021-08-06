import Joi from '@hapi/joi';
const get = Joi.object().keys({
  limit: Joi.number(),
  page: Joi.number(),
  permission_group_id: Joi.string()
});

export default {
  get
};
