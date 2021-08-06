import Joi from '@hapi/joi';
import BaseError from '../utils/base-error';
import errorCode from '../utils/error-code';
const joiOptions = {
  abortEarly: false
};

const isValid = (option) => (req, res, next) => {
  let types = Object.keys(option);
  let errors = {},
    messages = {};
  types.forEach((type) => {
    let result = Joi.validate(req[type], option[type], joiOptions);
    if (result.error) {
      result.error.details.forEach((err) => {
        errors[err.path[0]] = errorCode[err.type];
        messages[err.path[0]] = err && err.message && err.message;
      });
    }
    req[type] = result.value;
  });
  if (Object.keys(errors).length)
    throw new BaseError({
      statusCode: 400,
      error: errorCode['validate'],
      errors
    }).addMeta({ messages });
  if (req.query.limit === undefined) req.query.limit = 20;
  next();
};

export default isValid;
