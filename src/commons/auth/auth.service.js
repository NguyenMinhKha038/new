// const jwt = require('jsonwebtoken');
import jwt from 'jsonwebtoken';
import Joi from '@hapi/joi';
import bcrypt from 'bcrypt';
import { logger, BaseError } from '../utils';
import * as firebaseAdmin from 'firebase-admin';
// import serviceAccount from '../../../'
//
// var admin = require("firebase-admin");

import serviceAccount from '../../../myvietnam-service-account.json';

firebaseAdmin.initializeApp({
  credential: firebaseAdmin.credential.cert(serviceAccount),
  databaseURL: 'https://myvietnam-49a37.firebaseio.com'
});
// import Nexmo from 'nexmo';
// import nexmo from 'n'

const userResetPassword = Joi.object()
  .keys({
    phone: Joi.string()
      .regex(/^\+84[3|5|7|8|9][0-9][0-9]{7}$/)
      .required(),
    token: Joi.string().required(),
    new_password: Joi.string().min(8).required(),
    confirm_password: Joi.string().min(8).required()
  })
  .unknown(false);

export const firebaseInted = firebaseAdmin;

export default {
  createJwtToken(data) {
    const key = process.env.APP_SECRET_KEY || '23456';
    return jwt.sign(data, key);
  },

  validateUserResetPassword(data) {
    return Joi.validate(data, userResetPassword, { abortEarly: false });
  },

  async comparePassword(inputPassword, indexPassword) {
    try {
      return await bcrypt.compare(inputPassword, indexPassword);
    } catch (err) {
      logger.error(err);
      throw new BaseError({
        statusCode: 500,
        error: 'cannot compare password',
        errors: err
      });
    }
  },
  async hashing(data) {
    try {
      return await bcrypt.hash(data, 10);
    } catch (err) {
      logger.error(err);
      throw new BaseError({
        statusCode: 500,
        error: 'hashing fail',
        errors: {
          code: 5005,
          message: err
        }
      });
    }
  },

  async getUserFirebase(phone) {
    try {
      return await firebaseAdmin.auth().getUserByPhoneNumber(phone);
      // return await nexmo.message.sendSms(from,to,text);
    } catch (err) {
      logger.error(err);
      throw new BaseError({
        statusCode: 500,
        error: 'get user firesbase error',
        errors: err
      });
    }
  }
};
