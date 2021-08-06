import Joi from '@hapi/joi';

const phoneSchema = Joi.object().keys({
  phone_number: Joi.string()
    .regex(/^\+84[3|5|7|8|9][0-9][0-9]{7}$/)
    .required()
});

const verifySchema = Joi.object().keys({
  type: Joi.string().valid(['sms', 'email']).required(),
  phone_number: Joi.string()
    .regex(/^\+84[3|5|7|8|9][0-9][0-9]{7}$/)
    .when('type', {
      is: 'sms',
      then: Joi.required(),
      otherwise: Joi.optional()
    }),
  token: Joi.string().when('type', {
    is: 'email',
    then: Joi.required(),
    otherwise: Joi.optional()
  }),
  email: Joi.string().email({ minDomainSegments: 2 }).when('type', {
    is: 'email',
    then: Joi.required(),
    otherwise: Joi.optional()
  })
});

const verifyBySMS = Joi.object().keys({
  phone: Joi.string()
    .regex(/^\+84[3|5|7|8|9][0-9][0-9]{7}$/)
    .required(),
  code: Joi.string().required(),
  type: Joi.string().valid(['register', 'reset-password']).required()
});

const resendSMS = Joi.object().keys({
  phone: Joi.string()
    .regex(/^\+84[3|5|7|8|9][0-9][0-9]{7}$/)
    .required(),
  type: Joi.string().valid(['reset-password', 'register']).required()
});

const userResetPassword = Joi.object()
  .keys({
    phone: Joi.string()
      .regex(/^\+84[3|5|7|8|9][0-9][0-9]{7}$/)
      .required(),
    token: Joi.string().required(),
    password: Joi.string().min(8).required()
  })
  .unknown(false);

const userRegister = Joi.object()
  .keys({
    phone: Joi.string()
      .regex(/^\+84[3|5|7|8|9][0-9]{8}$/)
      .required(),
    name: Joi.string().min(3).required(),
    password: Joi.string().min(8).required(),
    ref_code: Joi.string()
      .regex(/^\+84[3|5|7|8|9][0-9]{8}$/)
      .optional(),
    token: Joi.string().required()
  })
  .unknown(false);

const userLogin = Joi.object()
  .keys({
    phone: Joi.string()
      .regex(/^\+84[3|5|7|8|9][0-9]{8}$/)
      .required(),
    password: Joi.string().min(8).required()
  })
  .unknown(false);

const updateEnterpriseAppVersion = Joi.object()
  .keys({
    app_version: Joi.string().required(),
    type: Joi.string().valid(['enterprise']).required()
  })
  .unknown(false);

export default {
  phoneSchema,
  verifySchema,
  resendSMS,
  verifyBySMS,
  userResetPassword,
  userRegister,
  userLogin,
  updateEnterpriseAppVersion
};
