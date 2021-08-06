import Joi from '@hapi/joi';

const provinceValidation = {
  get: {
    query: {
      type: Joi.number().valid([1, 2, 3]),
      parent_code: Joi.string()
        .regex(/\d+/)
        .when('type', { is: Joi.number().valid([2, 3]), then: Joi.required() })
    }
  }
};

export default provinceValidation;
