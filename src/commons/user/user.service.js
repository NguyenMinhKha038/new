import User from './user.model';
import Joi from '@hapi/joi';
import _ from 'lodash';
import { BaseError, logger as Logger, errorCode, mergeObject } from '../utils';
import { upload } from '../middlewares';
import Promise from 'bluebird';
import randomString from 'crypto-random-string';
import chatUtils from '../utils/chat';

const userSchema = Joi.object()
  .keys({
    name: Joi.string().min(3).max(40).required(),
    email: Joi.string().email({ minDomainSegments: 2 }),
    fb_id: Joi.string().alphanum().required(),
    gender: Joi.string().alphanum(),
    birthday: Joi.string().regex(/[0-1][0-9]\/[0-3][0-9]\/[0-9]{4}$/), //mm/dd/yyyy
    phone: Joi.string().regex(/[0-9]{9}[0-9]$/)
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

const userKYC = Joi.object().keys({
  real_name: Joi.string().required(),
  birthday: Joi.string().required(),
  passport_type: Joi.string().required(),
  address: Joi.string().required(),
  front_passport_image: Joi.string().required(),
  backside_passport_image: Joi.string().required(),
  selfy_image: Joi.string().required()
});

const adminUpdateStatusKYC = Joi.object().keys({
  id: Joi.string().required(),
  selfy_status: Joi.string().required(),
  front_passport_status: Joi.string().required(),
  backside_passport_status: Joi.string().required()
});

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

const information = Joi.object()
  .keys({
    birthday: Joi.string()
      .regex(/^(19|20)[0-9]{2}-(0[0-9]{1}|1[1-2]{1})-[0-9]{2}$/)
      .optional(),
    gender: Joi.string().allow('').optional(),
    phone: Joi.string()
      .regex(/^\+84[3|5|7|8|9][0-9][0-9]{7}$/)
      .optional(),
    avatar: Joi.string().allow('').optional(),
    about_me: Joi.string().allow('').optional(),
    email: Joi.string().email({ minDomainSegments: 2 }).optional(),
    PIN: Joi.string()
      .regex(/^[0-9]{8}$/)
      .optional()
  })
  .unknown();

function vaildateinformation(data) {
  return Joi.validate(data, information);
}

function validatePeriodTime(data) {
  return Joi.validate(data, periodTime, { abortEarly: false });
}
function validateStatusUser(data) {
  return Joi.validate(data, statusUser, { abortEarly: false });
}

function validateAdminUpdateStatusKYC(data) {
  return Joi.validate(data, adminUpdateStatusKYC, { abortEarly: false });
}

function validateKYC(data) {
  return Joi.validate(data, userKYC, { abortEarly: false });
}

function validateLogin(data) {
  return Joi.validate(data, userLogin, { abortEarly: false });
}

function validate(data) {
  return Joi.validate(data, userSchema);
}

function validateRegister(data) {
  return Joi.validate(data, userRegister, { abortEarly: false });
}

function getAllowUpdateData(data) {
  const allowFields = ['gender', 'birthday', 'phone', 'avatar', 'about_me'];
  return { error: null, data: _.pick(data, allowFields) };
}

async function findAll(limit, skip, query = {}, options = {}, sort = { createdAt: -1 }) {
  try {
    return await User.find(query, options).limit(limit).skip(skip).lean().sort(sort);
  } catch (err) {
    Logger.error(err);
    throw new BaseError({
      statusCode: 500,
      error: 'Read users data error',
      errors: err
    });
  }
}

async function findById(id, select, options = {}) {
  try {
    const user = await User.findById(id, select, options).lean();
    return user;
  } catch (err) {
    Logger.error(err);
    throw new BaseError({
      statusCode: 500,
      error: 'Read users data error',
      errors: err
    });
  }
}

async function findByIdRaw(id, select, options = {}) {
  try {
    const user = await User.findById(id, select, options);
    return user;
  } catch (err) {
    Logger.error(err);
    throw new BaseError({
      statusCode: 500,
      error: 'Read users data error',
      errors: err
    });
  }
}

const findByPhone = (phone, select) => {
  return User.findOne({ phone }, select);
};

async function findOne(query, select, options) {
  try {
    return await User.findOne(query, select, options);
  } catch (err) {
    Logger.error(err);
    throw new BaseError({
      statusCode: 500,
      error: 'Read users data error',
      errors: err
    });
  }
}
async function find(query, select, options) {
  try {
    return await User.find(query, select, options);
  } catch (err) {
    Logger.error(err);
    throw new BaseError({
      statusCode: 500,
      error: 'Read users data error',
      errors: err
    });
  }
}

async function findEnsure({ select, options, ...query }) {
  try {
    const user = await User.findOne(mergeObject(query), select, options);
    if (!user) {
      throw new BaseError({
        statusCode: 400,
        error: errorCode.client,
        errors: {
          user: errorCode['client.userNotFound']
        }
      });
    }
    return user;
  } catch (error) {
    Logger.error(error);
    throw new BaseError({
      statusCode: 500,
      error: 'Read users data error',
      errors: error
    });
  }
}

async function findSome(query, select, limit = 0, skip = 0, sort = { createdAt: -1 }) {
  try {
    return await User.find(query, select).limit(limit).skip(skip).lean().sort(sort);
  } catch (err) {
    Logger.error(err);
    throw new BaseError({
      statusCode: 500,
      error: 'Read users data error',
      errors: err
    });
  }
}

async function findOneAndUpdate(query, update, options = {}) {
  try {
    return await User.findOneAndUpdate(query, update, {
      new: true,
      ...options
    });
  } catch (err) {
    Logger.error(err);
    throw new BaseError({
      statusCode: 500,
      error: 'Update users data error',
      errors: err
    });
  }
}

async function updateOne(query, update) {
  try {
    return await User.updateOne(query, update, { new: true }).lean();
  } catch (err) {
    Logger.error(err);
    throw new BaseError({
      statusCode: 500,
      error: 'Update users data error',
      errors: {}
    });
  }
}

async function create(data) {
  try {
    const user = await User.create(data);

    try {
      await createChatUser(user);
    } catch (err) {
      Logger.error('Create chat user error %o', err);
    }
    console.log('CREATE CHAT USER ');
    return user;
  } catch (err) {
    Logger.error(err);
    throw new BaseError({
      statusCode: 500,
      error: 'Create user error',
      errors: err
    });
  }
}

async function updateKYC(data) {
  try {
    return await upload.uploadPicturePrivateMiddleware(data);
    // return await User.findByIdAndUpdate(query,data);
  } catch (err) {
    Logger.error(err);
    throw new BaseError({
      statusCode: 500,
      error: 'update KYC error',
      errors: err
    });
  }
}

async function count(query) {
  try {
    return await User.countDocuments(query);
  } catch (err) {
    Logger.error(err);
    throw new BaseError({
      statusCode: 500,
      error: 'count data fail',
      errors: err
    });
  }
}

async function findBetweenPeriodTime(start, end, limit, skip, sort = { createdAt: -1 }) {
  try {
    return await User.find({ createdAt: { $gt: start, $lt: end } })
      .limit(limit)
      .skip(skip)
      .lean()
      .sort(sort);
  } catch (err) {
    Logger.error(err);
    throw new BaseError({
      statusCode: 500,
      error: 'find user fail',
      errors: err
    });
  }
}

async function distinct(query) {
  try {
    return await User.distinct(query).limit(3);
  } catch (err) {
    Logger.error(err);
    throw new BaseError({
      statusCode: 500,
      error: 'distinct data fail',
      errors: err
    });
  }
}

async function aggregate(query) {
  try {
    return await User.aggregate(query);
  } catch (err) {
    Logger.error(err);
    throw new BaseError({
      statusCode: 500,
      error: 'aggregate data fail',
      errors: err
    });
  }
}
async function findActive(_id, select) {
  const user = await User.findOne({ _id, status: { $ne: 'disabled' } }, select);
  if (!user) throw new BaseError({ statusCode: 400, error: 'user is not active' });
  return user;
}

async function findApproved(_id) {
  const user = await User.findOne({ _id, status: { $eq: 'approve-kyc' } });
  if (!user) throw new BaseError({ statusCode: 400, error: 'user is not update kyc' });
  return user;
}

const updatePoint = (user_id, value) => async (session) => {
  const user = await User.findByIdAndUpdate(
    user_id,
    { $inc: { point: +value } },
    { new: true }
  ).session(session);
  if (!user || user.status === 'disabled')
    throw new BaseError({
      statusCode: 403,
      error: errorCode.client,
      errors: { user: errorCode['client.userNotFound'] }
    });
  if (user.point <= 0) {
    throw new BaseError({
      statusCode: 403,
      error: errorCode.client,
      errors: {
        point: errorCode['client.pointNotEnough']
      }
    });
  }
  return user;
};

async function transact(...actions) {
  const session = await User.startSession();
  await session.startTransaction();
  let transactions;
  try {
    transactions = await Promise.map(_.flatten(actions), (action) => action(session));
  } catch (error) {
    await session.abortTransaction();
    await session.endSession();
    throw error;
  }
  await session.commitTransaction();
  await session.endSession();
  return transactions;
}

const updateWallet = (
  user_id,
  fields = {
    'wallet.total': 0,
    'wallet.s_prepaid': 0,
    'wallet.refund': 0,
    'wallet.deposit': 0,
    'wallet.commission': 0,
    'wallet.bonus_available': 0,
    'wallet.withdrawal': 0,
    'wallet.fee': 0,
    'wallet.transfer': 0,
    'wallet.receipt': 0
  },
  PIN = '',
  type = ''
) => async (session) => {
  for (const key in fields) {
    fields[key] = Math.round(fields[key]);
  }
  const user = await User.findByIdAndUpdate(user_id, { $inc: fields }, { new: true }).session(
    session
  );
  if (!user || user.status === 'disabled')
    throw new BaseError({
      statusCode: 403,
      error: errorCode.client,
      errors: { user: errorCode['client.userNotFound'] }
    });
  if (user.wallet.total < 0 || user.wallet.s_prepaid < 0)
    throw new BaseError({
      statusCode: 403,
      error: errorCode.client,
      errors: { user: errorCode['client.MoneyNotEnough'] }
    }).addMeta({ message: 'user wallet is not enough' });
  return user;
};

const getChatUser = async (userId) => {
  const user = await findOne({ _id: userId });
  if (!user) {
    throw new BaseError({
      statusCode: 400,
      message: 'No user found'
    });
  }
  if (!user.chat_username || !user.chat_password) {
    return await createChatUser(user);
  } else {
    return { chat_username: user.chat_username, chat_password: user.chat_password };
  }
};

const createChatUser = async (user) => {
  if (!user) {
    throw new BaseError({
      statusCode: 400,
      message: 'No user found'
    });
  }
  const username =
    process.env.NODE_ENV == 'production'
      ? user.phone.replace('+84', '0')
      : 'dev-' + user.phone.replace('+84', '0');
  if (!user.chat_username || !user.chat_password) {
    const loginSuccess = await chatUtils.loginToChatServer();
    if (!loginSuccess) {
      throw new BaseError({
        statusCode: 500,
        message:
          'Login to chat server error. Please check username/password or connection to chat server'
      });
    }

    try {
      await chatUtils.deleteChatUser(username);
    } catch (err) {}

    const password = randomString({ length: 16 });
    const created = await chatUtils.createChatUser(
      user.name,
      username + '@fake.com',
      username,
      password
    );
    if (created) {
      await updateOne({ _id: user._id }, { chat_username: username, chat_password: password });
      return {
        chat_username: username,
        chat_password: password
      };
    } else {
      throw new BaseError({
        statusCode: 500
      });
    }
  }

  return {
    chat_username: user.chat_username,
    chat_password: user.chat_password
  };
};

async function rawFind({
  query,
  limit,
  skip,
  sort = { createdAt: -1 },
  select,
  options,
  populate
}) {
  try {
    return await User.find(query, select, options)
      .limit(limit)
      .skip(skip)
      .sort(sort)
      .populate(populate);
  } catch (err) {
    Logger.error(err);
    throw new BaseError({
      statusCode: 500,
      error: 'get users fail',
      errors: err
    });
  }
}

function calculateWallet(user, total = 0) {
  let s_prepaid = total,
    bonus_available = 0;
  if (user.wallet.s_prepaid < total) {
    s_prepaid = user.wallet.s_prepaid;
    bonus_available = total - user.wallet.s_prepaid;
  }
  return { s_prepaid, bonus_available };
}

export default {
  find,
  findByPhone,
  findAll,
  findOne,
  findById,
  findByIdRaw,
  findSome,
  findActive,
  findApproved,
  findBetweenPeriodTime,
  updateOne,
  updateKYC,
  create,
  validate,
  validateRegister,
  validateLogin,
  validateKYC,
  validateAdminUpdateStatusKYC,
  validateStatusUser,
  validatePeriodTime,
  vaildateinformation,
  getAllowUpdateData,
  findOneAndUpdate,
  updatePoint,
  count,
  distinct,
  aggregate,
  updateWallet,
  transact,
  getChatUser,
  rawFind,
  calculateWallet,
  createChatUser,
  findEnsure
};
