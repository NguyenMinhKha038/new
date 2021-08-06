import joi from '@hapi/joi';
import over from '../over_function/over';

const idSchema = joi.object().keys({
  id: joi
    .string()
    .regex(/^[a-fA-F0-9]{24}$/)
    .required()
});

const validate = (reqField, validateSchema) => (req, res, next) => {
  let { error, value } = joi.validate(req[reqField], validateSchema, {
    abortEarly: false,
    allowUnknown: true
  });
  if (error) {
    return next(over.getJoiError(error));
  }
  req.validate = value;
  req.data = value;
  if (reqField === 'query' && typeof req.query.limit === 'undefined') {
    req.validate.limit = 20;
    req.data.limit = 20;
    req.query.limit = 20;
  }
  return next();
};

export const joiValidate = {
  validate,
  idSchema
};

export default { validate, idSchema };
