import Joi, { ref } from '@hapi/joi';
import config from './config';

const create = Joi.object()
  .keys({
    value: Joi.when('type', {
      is: 'withdraw',
      then: Joi.number().min(100000).required(),
      otherwise: Joi.number().required()
    }),
    // bank: Joi.string().optional(),
    type: Joi.string().valid(['deposit', 'withdraw']).required(),
    payment_type: Joi.string().valid(config.PAYMENT_TYPE).required(),

    user_bank_id: Joi.string()
      .regex(/^[a-zA-Z0-9]{24}$/)
      .when('type', { is: 'withdraw', then: Joi.required(), otherwise: Joi.forbidden() }),
    admin_bank_id: Joi.string()
      .regex(/^[a-zA-Z0-9]{24}$/)
      .when('type', { is: 'deposit', then: Joi.required(), otherwise: Joi.forbidden() }),
    // bank_name: Joi.string().required(),
    // full_name: Joi.string().optional(),
    // bank_account_number: Joi.string().optional(),
    // bank_branch: Joi.string().optional(),
    PIN: Joi.string()
      .regex(/^[0-9]{6}$/)
      .when('type', {
        is: 'deposit',
        then: Joi.optional(),
        otherwise: Joi.required()
      }),
    code: Joi.string().when('type', {
      is: 'deposit',
      then: Joi.required(),
      otherwise: Joi.optional()
    })
  })
  .unknown(false);

const confirm = Joi.object()
  .keys({
    status: Joi.string().valid(config.STATUS).required(),
    id: Joi.string()
      .regex(/^[a-zA-Z0-9]{24}$/)
      .required()
  })
  .unknown(false);

const depositCompany = Joi.object()
  .keys({
    value: Joi.number().min(500000).required(),
    // bank: Joi.string().optional(),
    type: Joi.string()
      .valid(['deposit_company', 'withdraw_company'])
      .default('deposit_company')
      .required(),
    payment_type: Joi.string().valid(config.PAYMENT_TYPE).default('manual').required(),
    company_bank_id: Joi.string()
      .regex(/^[a-zA-Z0-9]{24}$/)
      .when('type', { is: 'withdraw_company', then: Joi.required(), otherwise: Joi.forbidden() }),
    admin_bank_id: Joi.string()
      .regex(/^[a-zA-Z0-9]{24}$/)
      .when('type', { is: 'deposit_company', then: Joi.required(), otherwise: Joi.forbidden() }),
    // full_name: Joi.string().optional(),
    // bank_account_number: Joi.string().optional(),
    // bank_branch: Joi.string().optional(),
    PIN: Joi.string()
      .regex(/^[0-9]{6}$/)
      .when('type', {
        is: 'deposit_company',
        then: Joi.optional(),
        otherwise: Joi.required()
      }),
    code: Joi.string().when('type', {
      is: 'deposit_company',
      then: Joi.required(),
      otherwise: Joi.optional()
    })
  })
  .unknown(false);

const search = Joi.object().keys({
  value: Joi.number().optional(),
  bank: Joi.string().optional(),
  status: Joi.string().valid(config.STATUS).optional(),
  user_id: Joi.string()
    .regex(/^[a-zA-Z0-9]{24}$/)
    .optional(),
  limit: Joi.number().optional(),
  page: Joi.number().optional(),
  type: Joi.string().valid(config.TRANSACTION_TYPE).optional(),
  payment_type: Joi.string().valid(config.PAYMENT_TYPE).optional(),
  sort: Joi.string().optional(),
  start_time: Joi.date().iso().optional(),
  end_time: Joi.date().iso().min(Joi.ref('start_time')).optional(),
  company_id: Joi.string()
    .regex(/^[a-zA-Z0-9]{24}$/)
    .optional(),
  cashier_id: Joi.string()
    .regex(/^[a-zA-Z0-9]{24}$/)
    .optional()
  // PIN: Joi.string().when('type',{is:'withdraw', then: Joi.required(), otherwise: Joi.optional()})
});

const companyGet = Joi.object().keys({
  value: Joi.number().optional(),
  bank: Joi.string().optional(),
  status: Joi.string().valid(config.STATUS).optional(),
  limit: Joi.number().optional(),
  page: Joi.number().optional(),
  type: Joi.string().optional(),
  payment_type: Joi.string().valid(config.PAYMENT_TYPE).optional(),
  sort: Joi.string().optional(),
  start_time: Joi.date().iso().optional(),
  end_time: Joi.date().iso().when('start_time', {
    is: Joi.exist(),
    then: Joi.required(),
    otherwise: Joi.optional()
  })
  // PIN: Joi.string().when('type',{is:'withdraw', then: Joi.required(), otherwise: Joi.optional()})
});

const updateImage = Joi.object().keys({
  id: Joi.string()
    .regex(/^[a-zA-Z0-9]{24}$/)
    .required(),
  image: Joi.string()
  // type: Joi.string().valid(['user', 'company']).default('user').required()
});

const statistics = Joi.object().keys({
  start_time: Joi.date().iso().optional(),
  end_time: Joi.date().iso().min(Joi.ref('start_time')).optional(),
  type: Joi.string().optional()
});

const adminCreateTransaction = Joi.object()
  .keys({
    user_id: Joi.string()
      .regex(/^[a-zA-Z0-9]{24}$/)
      .when('type', {
        is: Joi.valid(['deposit']),
        then: Joi.required(),
        otherwise: Joi.optional()
      }),
    company_id: Joi.string()
      .regex(/^[a-zA-Z0-9]{24}$/)
      .when('type', {
        is: Joi.valid(['deposit_company']),
        then: Joi.required(),
        otherwise: Joi.optional()
      }),
    type: Joi.string().valid(['deposit', 'deposit_company']).required(),
    payment_type: Joi.string().valid(config.PAYMENT_TYPE).required(),
    admin_bank_id: Joi.string()
      .regex(/^[a-zA-Z0-9]{24}$/)
      .required(),
    // bank: Joi.string().required(),
    // full_name: Joi.string().required(),
    // bank_account_number: Joi.string().required(),
    // bank_branch: Joi.string().required(),
    value: Joi.number().required(),
    code: Joi.string()
  })
  .unknown(false);

const depositVnPay = Joi.object()
  .keys({
    type: Joi.string().valid(['deposit_company', 'deposit']).required(),
    value: Joi.when('type', {
      is: 'deposit',
      then: Joi.number().min(100000),
      otherwise: Joi.number().min(500000)
    }).required()
  })
  .unknown(false);

export default {
  create,
  search,
  depositCompany,
  companyGet,
  admin: {
    confirm,
    statistics,
    adminCreateTransaction
  },
  updateImage,
  depositVnPay
};
