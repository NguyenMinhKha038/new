import Joi from '@hapi/joi';

const addressValidation = {
  post: {
    body: {
      is_default: Joi.bool(),
      province: Joi.string().required(),
      district: Joi.string().required(),
      ward: Joi.string().required(),
      province_code: Joi.string().required(),
      district_code: Joi.string().required(),
      ward_code: Joi.string().required(),
      text: Joi.string().required(),
      receiver: Joi.string().required(),
      phone_number: Joi.string().required()
    }
  },
  put: {
    params: {
      id: Joi.string().regex(/^[0-9a-fA-F]{24}$/, { name: 'object id' })
    },
    body: {
      is_default: Joi.bool(),
      province: Joi.string(),
      district: Joi.string(),
      ward: Joi.string(),
      province_code: Joi.string(),
      district_code: Joi.string(),
      ward_code: Joi.string(),
      text: Joi.string(),
      receiver: Joi.string(),
      phone_number: Joi.string().length(10)
    }
  },
  delete: {
    params: {
      id: Joi.string().regex(/^[0-9a-fA-F]{24}$/, { name: 'object id' })
    }
  }
};

export default addressValidation;
