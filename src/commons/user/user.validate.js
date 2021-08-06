import Joi from '@hapi/joi';

// const idSchema =

const findSchema = Joi.object().keys({
  status: Joi.string()
    .valid(['non-kyc', 'approve-kyc', 'reject-kyc', 'pending-kyc', 'disabled'])
    .optional(),
  start: Joi.date().optional(),
  end: Joi.when('start', { is: Joi.exist(), then: Joi.date().required() }),
  limit: Joi.number().optional(),
  page: Joi.number().optional(),
  sort: Joi.string().optional(),
  phone: Joi.string().optional()
});

const rawAdminFind = Joi.object().keys({
  status: Joi.string()
    .valid(['non-kyc', 'approve-kyc', 'reject-kyc', 'pending-kyc', 'disabled'])
    .optional(),
  start_time: Joi.date().iso().optional(),
  end_time: Joi.when('start_time', {
    is: Joi.exist(),
    then: Joi.date().iso().required(),
    otherwise: Joi.date().iso().optional()
  }),
  limit: Joi.number().optional(),
  page: Joi.number().optional(),
  sort: Joi.string().optional(),
  phone: Joi.string().optional(),
  _id: Joi.string()
    .regex(/[0-9a-zA-Z]{24}$/)
    .optional(),
  excepted_status: Joi.string()
    .valid(['non-kyc', 'approve-kyc', 'reject-kyc', 'pending-kyc', 'disabled'])
    .optional(),
  user_ids: Joi.array()
    .items(Joi.string().regex(/^[a-fA-F0-9]{24}$/))
    .optional()
});

const refCode = Joi.object().keys({
  ref_code: Joi.string()
    .regex(/^[A-Z]{6}$/)
    .required()
});

const userSchema = Joi.object()
  .keys({
    name: Joi.string().min(3).max(40).required(),
    email: Joi.string().email({ minDomainSegments: 2 }),
    fb_id: Joi.string().alphanum().required(),
    gender: Joi.string().alphanum(),
    birthday: Joi.string().regex(/[0-1][0-9]\/[0-3][0-9]\/[0-9]{4}$/), //mm/dd/yyyy
    phone: Joi.string().regex(/^\+84[3|5|7|8|9][0-9][0-9]{7}$/)
  })
  .pattern(/./, Joi.string());

const userRegister = Joi.object()
  .keys({
    email: Joi.string()
      .regex(/^[a-z][a-z0-9_\.]{4,32}@[a-z0-9]{2,}(\.[a-z0-9]{2,4}){1,2}$/)
      .email({ minDomainSegments: 2 })
      .allow(null)
      // .default(null)
      .optional(),
    phone: Joi.string()
      .regex(/^\+84[3|5|7|8|9][0-9][0-9]{7}$/)
      .when('email', { is: null, then: Joi.required() }),
    password: Joi.string().min(8).required(),
    name: Joi.string().required()
  })
  .pattern(/./, Joi.string());

const userLogin = Joi.object().keys({
  user: Joi.string().required(),
  password: Joi.string().required()
});

const userKYC = Joi.object()
  .keys({
    real_name: Joi.string().required(),
    birthday: Joi.string().required(),
    passport_type: Joi.string()
      .valid(['national_identity_card', 'driving_license', 'passport'])
      .required(),
    address: Joi.string().required(),
    front_passport_image: Joi.string().required(),
    backside_passport_image: Joi.string().required(),
    selfy_image: Joi.string().required(),
    passport_provide_date: Joi.string(),
    passport_provide_location: Joi.string()
  })
  .unknown(false);

const updateKYC = Joi.object().keys({
  name: Joi.string().required(),
  birthday: Joi.string().required(),
  passport_type: Joi.string()
    .valid(['national_identity_card', 'driving_license', 'passport'])
    .required(),
  address: Joi.string().required(),
  front_passport: Joi.string().required(),
  backside_passport: Joi.string().required(),
  selfy: Joi.string().required(),
  passport_provide_date: Joi.string().required(),
  passport_provide_location: Joi.string().required(),
  passport_number: Joi.string().required()
});

const adminUpdateStatusKYC = Joi.object()
  .keys({
    id: Joi.string().required(),
    selfy_status: Joi.string().required(),
    front_passport_status: Joi.string().required(),
    backside_passport_status: Joi.string().required()
  })
  .unknown(false);

const statusUser = Joi.object().keys({
  id: Joi.string().required(),
  status: Joi.string().required()
});

const periodTime = Joi.object()
  .keys({
    start: Joi.date().required(),
    end: Joi.date().required()
  })
  .unknown();

const updateinformation = Joi.object()
  .keys({
    birthday: Joi.string()
      .regex(/^(19|20)[0-9]{2}-(0[0-9]|1[0-2])-(0[0-9]|[1-2][0-9]|3[0-1])$/)
      .optional(),
    gender: Joi.string().allow('').optional(),
    phone: Joi.string()
      .regex(/^\+84[3|5|7|8|9][0-9][0-9]{7}$/)
      .optional(),
    avatar: Joi.string().allow('').optional(),
    about_me: Joi.string().allow('').optional(),
    email: Joi.string().email({ minDomainSegments: 2 }).optional(),
    addresses: Joi.array().items(Joi.string()).optional(),
    bank: Joi.string().optional(),
    bank_account_number: Joi.string().optional(),
    bank_branch: Joi.string().optional(),
    user_bank_name: Joi.string().optional()
  })
  .unknown(false);

const Pin = Joi.object()
  .keys({
    PIN: Joi.string()
      .regex(/^[0-9]{6}$/)
      .required()
  })
  .unknown(false);

const updatePin = Joi.object()
  .keys({
    new_code: Joi.string()
      .regex(/^[0-9]{6}$/)
      .required(),
    old_code: Joi.string()
      .regex(/^[0-9]{6}$/)
      .allow('')
      .required(),
    password: Joi.string().optional()
  })
  .unknown(false);

const specificFieldSchema = Joi.object().keys({
  email: Joi.string().email({ minDomainSegments: 2 }).optional(),
  phone: Joi.string()
    .regex(/^\+84[3|5|7|8|9][0-9][0-9]{7}$/)
    .optional(),
  _id: Joi.string()
    .regex(/^[a-zA-Z0-9]{24}$/)
    .optional()
});

function validatePin(data) {
  return Joi.validate(data, updatePin);
}

const findByPhone = Joi.object().keys({
  phone: Joi.string()
    .regex(/^\+84[3|5|7|8|9][0-9][0-9]{7}$/)
    .optional()
});

const changePass = Joi.object()
  .keys({
    old_pass: Joi.string().required(),
    new_pass: Joi.string().required()
  })
  .unknown(false);

const getRefUsers = Joi.object().keys({
  limit: Joi.number(),
  page: Joi.number(),
  sort: Joi.number(),
  // select: Joi.string(),
  phone: Joi.string().regex(/^\+84[3|5|7|8|9][0-9]{8}$/)
});

const resetPin = Joi.object().keys({
  password: Joi.string().required(),
  new_code: Joi.string().length(6)
});
export default {
  admin: {
    findSchema,
    periodTime,
    statusUser,
    adminUpdateStatusKYC,
    rawAdminFind,
    findByPhone
  },
  user: {
    findByPhone,
    validatePin,
    specificFieldSchema,
    refCode,
    updateinformation,
    userLogin,
    userRegister,
    userKYC,
    userSchema,
    Pin,
    updatePin,
    updateKYC,
    changePass,
    getRefUsers,
    resetPin
  }
};
