import _ from 'lodash';
import facebookTool from './facebook.service';
import bcrypt from 'bcrypt';
import facebookService from './facebook.service';
import {
  BaseError,
  BaseResponse,
  errorCode as Errors,
  logger as Logger,
  errorCode
} from '../utils';
import authService from './auth.service';
import Over from '../over_function';
import { userService } from '../user';
import { configService } from '../config';
import { adminService } from '../admin';
import hashingCompare from '../utils/hashing-compare';
import random from 'crypto-random-string';
import permissionGroupService from '../../search/permission-group/permission-group.service';
import sendSMS from '../utils/send-sms';
import phoneRegisterService from '../phone-register/phone-register.service';

// import {} from '/'
const VERIFY_CODE_EXPIRE_TIME = 5 * 60 * 1000;
const RESEND_SMS_EXPIRED = 60 * 1000; // allow send sms after 1' => VERIFY_CODE_EXPIRE_TIME - RESEND_SMS_EXPIRED = (3-2)*60*1000

function randomText(num_of_symbol) {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  for (let i = 0; i < num_of_symbol; i++)
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  return text;
}

async function loginWithFacebook(req, res, next) {
  const userInfo = req.body;

  const validUser = await facebookTool.verifyFacebookToken(userInfo['fb_id'], userInfo['fb_token']);
  if (!validUser) {
    next(
      new BaseError({
        statusCode: 401,
        error: 'Unauthorization facebook user',
        errors: {}
      })
    );
    return;
  }

  try {
    Logger.info('Verify facebook user success');
    const facebookInfo = await facebookService.getUserInfo(userInfo.fb_id, userInfo.fb_token);
    if (!facebookInfo) {
      next(new BaseError({ statusCode: 400, error: 'Facebook info are incorrect' }));
      return;
    }
    userInfo.name = facebookInfo.name;
    userInfo.gender = facebookInfo.gender;
    userInfo.birthday = facebookInfo.birthday;
    userInfo.email = facebookInfo.email;
    let user = await userService.findOne({ email: userInfo.email });
    if (user) {
      //
      req.headers.user_id = user._id;

      user.access_token = authService.createJwtToken({
        id: user._id,
        name: user.name,
        avatar: user.avatar
      });
      new BaseResponse({ statusCode: 200, data: user }).return(res);
    } else {
      const { error, value } = userService.validate(userInfo);
      if (error) {
        next(
          new BaseError({
            statusCode: 400,
            error: 'Input params are missing',
            errors: error
          })
        );
        return;
      }
      let newUserPoint = await configService.get('new_user');
      let maxRef = await configService.findByKey('max_ref');
      userInfo.login_type = 'facebook';
      userInfo.last_active_time = new Date().getTime();
      userInfo.status = 'non-kyc';
      // userInfo.ref_code = Over.returnNextNumberOfBase36(maxRef.value);
      userInfo.point = newUserPoint;
      userInfo.avatar = `http://graph.facebook.com/${facebookInfo.id}/picture?type=large`;
      user = await userService.create(userInfo);

      // for auth owner
      req.headers.user_id = user._id;
      //update max ref
      // configService.update({ key: 'max_ref', value: userInfo.ref_code });

      Logger.info(user);
      const access_token = authService.createJwtToken({
        id: user._id,
        name: user.name,
        avatar: user.avatar
      });
      new BaseResponse({
        statusCode: 200,
        data: { ...user.toObject(), access_token }
      }).return(res);
    }
  } catch (err) {
    next(err);
  }
}

//admin

async function adminLogin(req, res, next) {
  let adminData = req.body;

  let { error, value } = adminService.validateLogin(adminData);

  if (error) {
    return next(Over.getJoiError(error));
  }
  try {
    let admin = await adminService.findOne({ user_name: req.body.user_name });
    //compare password after hash with db
    bcrypt.compare(req.body.password, admin.password, function (err, result) {
      //if success
      if (result) {
        //create token with key
        let access_token = authService.createJwtToken({
          id: admin._id,
          user_name: admin.user_name,
          role: 'adminT_T',
          status: admin.status
        });
        admin = _.pick(admin, [
          '_id',
          'name',
          'user_name',
          'email',
          'permission_group_id',
          'status',
          'access_token'
        ]);
        let success = new BaseResponse({
          statusCode: 200,
          data: { access_token: access_token, admin: admin }
        });
        return res.send(success);
      } else {
        let err = new BaseError({
          statusCode: 401,
          error: 'wrong email or password',
          errors: {}
        });
        return next(err);
      }
    });
  } catch (err) {
    Logger.error(err);
    return next(
      new BaseError({
        statusCode: 400,
        error: Errors.authorization,
        errors: {
          code: Errors['autho.notMatch'],
          message: 'wrong user or password'
        }
      })
    );
  }
}

async function adminResetPassword(req, res, next) {
  let { error, value } = adminService.validateResetPassword(req.body);

  if (error) return next(Over.getJoiError);
  else if (value.confirm_password === value.new_password) {
    try {
      let admin = await adminService.findOne({ email: value.email });
      if (admin && value.token === admin.token) {
        let result = await authService.comparePassword(value.new_password, admin.password);
        if (!result) {
          let newPassword = await authService.hashing(value.new_password);
          let adminReset = await adminService.findOneAndUpdate(
            { _id: admin._id },
            { password: newPassword }
          );
          adminReset = _.pick(adminReset, ['email', 'name', 'status', 'permission_code']);

          return res.send(new BaseResponse({ statusCode: 200, data: adminReset }));
        } else {
          return next(
            new BaseError({
              statusCode: 400,
              error: Errors.validate,
              errors: {
                new_password: Errors['password.used']
              }
            })
          );
        }
      } else {
        return next(
          new BaseError({
            statusCode: 400,
            error: admin ? Errors.authorization : Errors.server,
            errors: {
              token: admin ? Errors['autho.notMatch'] : '',
              email: admin ? '' : Errors['server.canNodFind'],
              message: admin ? 'token not match' : 'can not find admin with email'
            }
          })
        );
      }
    } catch (err) {
      return next(err);
    }
  } else {
    return next(
      new BaseError({
        statusCode: 400,
        error: Errors.authorization,
        errors: {
          confirm_password: Errors['autho.notMatch']
        }
      })
    );
  }
}

//user
async function userLogin(req, res, next) {
  try {
    let value = req.validate;
    const { password, phone } = value;
    // const userInput = value.user;
    // let emailRegex = /^[a-z][a-z0-9_\.]{4,32}@[a-z0-9]{2,}(\.[a-z0-9]{2,4}){1,2}$/;
    // let query = userInput.match(emailRegex) ? { email: userInput } : { phone: userInput };
    // let option = {select: '-token -login_type'};
    let user = await userService.findOne({ phone }, '+user_version');
    if (!user) {
      let error = new BaseError({ statusCode: 400, error: 'login fail' });
      return next(error);
    }
    let [comparing, userPermission] = await Promise.all([
      hashingCompare.compareHashCode(password, user.password),
      permissionGroupService.findOne(
        { user_id: user._id, status: 'active' },
        { path: 'store_id', select: 'name' }
      )
    ]);
    if (!comparing) {
      let error = new BaseError({
        statusCode: 400,
        error: 'login fail'
      }).addMeta({ message: Errors['autho.notMatch'] });
      return next(error);
    }

    const dataToCreateToken = {
      id: user._id,
      name: user.name,
      avatar: user.avatar
    };
    if (user.user_version) {
      dataToCreateToken.user_version = user.user_version;
    }

    let access_token = authService.createJwtToken(dataToCreateToken);
    user = user.toObject();
    if (userPermission) {
      if (userPermission.is_owner) {
        user.is_owner = true;
      } else {
        user.permission = userPermission.type;
        user.store = userPermission.store_id;
      }
      // userPermission.is_owner ? (user.is_owner = true) : (user.permission = userPermission.type);
    }
    user = _.omit(user, [
      'password',
      'token',
      'PIN',
      'login_type',
      'mail_verify',
      'device_token',
      'verify_code',
      'verify_expired',
      'verify_wrong_times'
    ]);

    let chatUser;
    try {
      if (!user.chat_username || !user.chat_password) {
        chatUser = await userService.createChatUser(user);
      }
    } catch (err) {}
    let success = new BaseResponse({
      statusCode: 200,
      data: { access_token, ...user, ...chatUser }
    });
    return success.return(res);
    // return res.send(success);
  } catch (err) {
    return next(err);
  }
}

async function userRegister(req, res, next) {
  try {
    let { token, ...userData } = req.validate;
    const { phone, ref_code } = userData;
    let userChecker = await userService.findOne({ phone });

    if (userChecker) {
      let error = new BaseError({
        statusCode: 400,
        error: 5000,
        errors: { phone: Errors['autho.existed'] }
      });
      return next(error);
    }

    const phoneRegister = await phoneRegisterService.findOne({ phone }, '+wrong_times');
    if (!phoneRegister) {
      return next(
        new BaseError({
          statusCode: 400,
          error: errorCode.client,
          errors: { phone: errorCode['client.global.notFound'] }
        }).addMeta({ message: 'wrong phone' })
      );
    }

    if (!phoneRegister.token) {
      return next(
        new BaseError({
          statusCode: 400,
          error: errorCode.client,
          errors: {
            token: errorCode['client.wrongInput']
          }
        }).addMeta({ message: 'wrong code' })
      );
    }

    if (phoneRegister.token !== token) {
      const wrong_times = phoneRegister.wrong_times || 0;
      let errors = {};
      let message = '';
      if (wrong_times + 1 >= 3) {
        // await phoneRegisterService.findOneAndUpdate({ phone }, { wrong_times: 0, token: '' });
        phoneRegister.wrong_times = 0;
        phoneRegister.token = '';
        errors = { token: errorCode['client.outOfLimit'] };
        message = 'wrong too many time';
      } else {
        // await phoneRegisterService.findOneAndUpdate({ phone }, { wrong_times: wrong_times + 1 });
        phoneRegister.wrong_times++;
        errors = { token: errorCode['client.wrongInput'] };
        message = 'wrong code';
      }
      await phoneRegister.save();
      return next(
        new BaseError({ statusCode: 400, error: errorCode.client, errors }).addMeta({ message })
      );
    }

    let newUserPoint = await configService.get('new_user');
    let refUser = null;
    if (ref_code) {
      refUser = await userService.findOne({ phone: ref_code });
      if (!refUser) {
        return next(
          new BaseError({
            statusCode: 400,
            error: errorCode.client,
            errors: { ref_code: errorCode['client.userNotFound'] }
          }).addMeta({ message: 'ref user is not found' })
        );
      }
    }

    // let code = random({ characters: '0123456789', length: 4 });
    // let expiredTime = new Date().getTime() + VERIFY_CODE_EXPIRE_TIME;
    userData = {
      ...userData,
      verify: true,
      // token: randomText(40),
      phone_verify: true,
      login_type: 'basic',
      status: 'non-kyc',
      point: newUserPoint
      // verify_code: code,
      // verify_expired: expiredTime,
    };
    if (refUser && refUser._id) {
      userData.ref_id = refUser._id;
    }

    console.log('REGISTER ');
    let user = await userService.create(userData);

    // const phoneVerify = phone.slice(1);
    // if (process.env.IS_SEND_SMS) {
    //   sendSMS({ phone: phoneVerify, code });
    // }
    user = _.pick(user, ['_id', 'name', 'email']);
    phoneRegisterService.deleteMany({ phone });

    return res.send(new BaseResponse({ statusCode: 200, data: user }));
  } catch (err) {
    return next(err);
  }
}

async function userResetPassword(req, res, next) {
  try {
    const { phone, token, password } = req.validate;
    const user = await userService.findOne({ phone }, '+wrong_verify_times');
    if (!user) {
      return next(
        new BaseError({
          statusCode: 400,
          error: errorCode.client,
          errors: { user: errorCode['client.userNotFound'] }
        }).addMeta({ message: 'wrong phone' })
      );
    }

    if (!user.token) {
      return next(
        new BaseError({
          statusCode: 400,
          error: errorCode.client,
          errors: { token: errorCode['client.wrongInput'] }
        }).addMeta({ message: 'wrong token' })
      );
    }

    if (user.token !== token) {
      const wrong_verify_time = user.wrong_verify_time || 0;
      let errors = {};
      let message = {};
      if (wrong_verify_time + 1 >= 3) {
        // await userService.findOneAndUpdate({ phone }, { wrong_verify_time: 0, token: '' });
        user.wrong_verify_times = 0;
        user.token = '';
        errors = { token: errorCode['client.outOfLimit'] };
        message = 'wrong too many time';
      } else {
        // await userService.findOneAndUpdate({ phone }, { wrong_verify_time: wrong_verify_time + 1 });
        user.wrong_verify_times++;
        errors = { token: errorCode['client.wrongInput'] };
        message = 'wrong token';
      }
      await user.save();
      return next(
        new BaseError({
          statusCode: 400,
          error: errorCode.client,
          errors
        }).addMeta({ message })
      );
    }
    user.password = password;
    user.token = '';
    const userUpdated = await user.save();
    return res.send(new BaseResponse({ statusCode: 200 }));
  } catch (err) {
    return next(err);
  }
}

async function getUserFirebase(req, res, next) {
  try {
    let { phone_number } = req.validate;
    let firebaseUser = await authService.getUserFirebase(phone_number);

    return res.send(new BaseResponse({ statusCode: 200, data: firebaseUser }));
  } catch (err) {
    return next(err);
  }
}

async function verifyUser(req, res, next) {
  try {
    let { phone_number, type, email, token } = req.validate;
    if (type === 'sms') {
      // console.l
      let user = await userService.findById(req.user.id);
      let firebaseUser = user ? await authService.getUserFirebase(user.phone) : null;
      if (firebaseUser) {
        userService.findOneAndUpdate({ phone: phone_number }, { verify: true, phone_verify: true });
        return res.send(new BaseResponse({ statusCode: 200, data: {} }));
      }
      return next(
        new BaseError({
          statusCode: 400,
          error: 4000,
          errors: { phone_number: Errors['any.notAvailable'] }
        }).addMeta({ message: 'phone number is not available on firebase' })
      );
    } else if (type === 'email') {
      let user = await userService.findOne({ email });
      if (user && user.token === token && !user.verify) {
        let userUpdate = await userService.findOneAndUpdate(
          { email },
          { verify: true, mail_verify: true }
        );
        //redirect .......
        userUpdate = _.pick(userUpdate, ['name', 'email', 'status', 'verify', 'gender']);

        let success = new BaseResponse({ statusCode: 200, data: userUpdate });
        return res.send(success);
      } else {
        let error = new BaseError({
          statusCode: 500,
          error: 5001,
          errors: {}
        }).addMeta({ message: 'wrong token or account had been verified' });
        return next(error);
      }
    }
    return next(
      new BaseError({
        statusCode: 400,
        error: 4000,
        errors: { type: Errors['any.notAvailable'] }
      })
    );
  } catch (err) {
    return next(err);
  }
}

async function verifyBySMS(req, res, next) {
  try {
    let { phone, code } = req.validate;

    let currentTime = new Date().getTime();
    let user = await userService.findOne({ phone, verify_code: code });
    if (user) {
      if (currentTime > user.verify_expired) {
        return next(
          new BaseError({
            statusCode: 400,
            error: Errors.client,
            errors: 'verify time was expired'
          })
        );
      }
      if (user.verify) {
        return next(
          new BaseError({
            statusCode: 400,
            error: Errors.client,
            errors: {
              user: Errors['client.userWasVerified']
            }
          }).addMeta({ message: 'user was verified' })
        );
      }
      await userService.findOneAndUpdate({ phone }, { verify: true, phone_verify: true });
      return res.send(new BaseResponse({ statusCode: 200 }));
    } else {
      return next(
        new BaseError({
          statusCode: 400,
          error: Errors.client,
          errors: {
            phone: Errors['client.userNotFound']
          }
        }).addMeta({ message: 'user not found' })
      );
    }
  } catch (err) {
    return next(err);
  }
}

async function resendSMS(req, res, next) {
  try {
    /**
     * @type {{phone: string, type: import('../user-sms/user-sms.service').SMSType}}
     */
    const { phone, type } = req.validate;
    const user = await userService.findOne({ phone });

    const code = random({ characters: '0123456789', length: 4 });
    const verifyExpired = new Date().getTime() + VERIFY_CODE_EXPIRE_TIME;
    const current = new Date().getTime();

    if (type === 'reset-password') {
      if (!user) {
        return next(
          new BaseError({
            statusCode: 400,
            error: errorCode.client,
            errors: { phone: errorCode['client.userNotFound'] }
          }).addMeta({ message: 'user not found' })
        );
      }

      const deltaExpired =
        current - new Date(user.verify_expired).getTime() + VERIFY_CODE_EXPIRE_TIME;
      if (deltaExpired <= RESEND_SMS_EXPIRED) {
        return next(
          new BaseError({
            statusCode: 400,
            error: Errors.client,
            errors: {
              user: Errors['client.timeNotExpired']
            }
          }).addMeta({ message: 'time to resend code is not expired' })
        );
      }

      const phoneVerify = phone.slice(1);
      await sendSMS({ phone: phoneVerify, code, type });

      await userService.findOneAndUpdate(
        { phone },
        { verify_code: code, verify_expired: verifyExpired }
      );
    } else if (type === 'register') {
      if (user) {
        return next(
          new BaseError({
            statusCode: 400,
            error: errorCode.client,
            errors: { phone: errorCode['client.existed'] }
          }).addMeta({ message: 'phone is existed' })
        );
      }
      const phoneRegister = await phoneRegisterService.findOne({ phone });
      if (phoneRegister) {
        const deltaExpired =
          current - new Date(phoneRegister.expired_time).getTime() + VERIFY_CODE_EXPIRE_TIME;
        if (deltaExpired <= RESEND_SMS_EXPIRED) {
          return next(
            new BaseError({
              statusCode: 400,
              error: errorCode.client,
              errors: { user: errorCode['client.timeNotExpired'] }
            }).addMeta({ message: 'time to resend code is not expired' })
          );
        }
      }
      const phoneVerify = phone.slice(1);
      await sendSMS({ phone: phoneVerify, code, type });

      await phoneRegisterService.findOneAndUpdate({
        query: { phone },
        update: { expired_time: current + VERIFY_CODE_EXPIRE_TIME, code },
        upsert: true
      });
    }

    return res.send(new BaseResponse({ statusCode: 200, data: { length: code.length } }));
  } catch (err) {
    return next(err);
  }
}

async function rawSendSMS(req, res, next) {
  try {
    /**
     * @type {{phone: string, type: import('../user-sms/user-sms.service').SMSType}}
     */
    const { phone, type } = req.validate;
    const user = await userService.findOne({ phone });

    const code = random({ characters: '0123456789', length: 4 });
    const verifyExpired = new Date().getTime() + VERIFY_CODE_EXPIRE_TIME;
    const current = new Date().getTime();

    if (type === 'reset-password') {
      if (!user) {
        return next(
          new BaseError({
            statusCode: 400,
            error: errorCode.client,
            errors: { phone: errorCode['client.userNotFound'] }
          }).addMeta({ message: 'user not found' })
        );
      }

      const deltaExpired =
        current - new Date(user.verify_expired).getTime() + VERIFY_CODE_EXPIRE_TIME;
      if (deltaExpired <= RESEND_SMS_EXPIRED) {
        return next(
          new BaseError({
            statusCode: 400,
            error: Errors.client,
            errors: {
              user: Errors['client.timeNotExpired']
            }
          }).addMeta({ message: 'time to resend code is not expired' })
        );
      }

      await userService.findOneAndUpdate(
        { phone },
        { verify_code: code, verify_expired: verifyExpired }
      );
    } else if (type === 'register') {
      if (user) {
        return next(
          new BaseError({
            statusCode: 400,
            error: errorCode.client,
            errors: { phone: errorCode['client.existed'] }
          }).addMeta({ message: 'phone is existed' })
        );
      }
      const phoneRegister = await phoneRegisterService.findOne({ phone });
      if (phoneRegister) {
        const deltaExpired =
          current - new Date(phoneRegister.expired_time).getTime() + VERIFY_CODE_EXPIRE_TIME;
        if (deltaExpired <= RESEND_SMS_EXPIRED) {
          return next(
            new BaseError({
              statusCode: 400,
              error: errorCode.client,
              errors: { user: errorCode['client.timeNotExpired'] }
            }).addMeta({ message: 'time to resend code is not expired' })
          );
        }
      }
      await phoneRegisterService.findOneAndUpdate({
        query: { phone },
        update: { expired_time: current + VERIFY_CODE_EXPIRE_TIME, code },
        upsert: true
      });
    }

    // const phoneVerify = phone.slice(1);
    // await sendSMS({ phone: phoneVerify, code, type });

    return res.send(new BaseResponse({ statusCode: 200, data: { length: code.length, code } }));
  } catch (err) {
    return next(err);
  }
}

async function verify(req, res, next) {
  try {
    /**
     * @type {{phone: string, code: string, type: import('../user-sms/user-sms.service').SMSType}}
     */
    const { phone, code, type } = req.validate;
    const token = randomText(30);
    if (type === 'reset-password') {
      const user = await userService.findOne({ phone }, '+wrong_verify_times');
      if (!user) {
        return next(
          new BaseError({
            statusCode: 400,
            error: errorCode.client,
            errors: { user: errorCode['client.userNotFound'] }
          }).addMeta({ message: 'wrong phone' })
        );
      }

      const currentTime = new Date().getTime();
      if (currentTime > new Date(user.verify_expired).getTime()) {
        return next(
          new BaseError({
            statusCode: 400,
            error: errorCode.client,
            errors: { code: errorCode['client.tokenTimeOut'] }
          }).addMeta({ message: 'verify time was expired' })
        );
      }

      if (!user.verify_code) {
        return next(
          new BaseError({
            statusCode: 400,
            error: errorCode.client,
            errors: { code: errorCode['client.wrongInput'] }
          }).addMeta({ message: 'wrong code' })
        );
      }

      if (user.verify_code !== code) {
        const wrong_verify_times = user.wrong_verify_times || 0;
        let errors = {};
        let message = {};
        if (wrong_verify_times + 1 >= 3) {
          // await userService.findOneAndUpdate({ phone }, { wrong_verify_time: 0, code: '' });
          user.wrong_verify_times = 0;
          user.code = '';
          errors = { code: errorCode['client.outOfLimit'] };
          message = 'wrong too many time';
        } else {
          // await userService.findOneAndUpdate(
          //   { phone },
          //   { wrong_verify_time: wrong_verify_time + 1 }
          // );
          user.wrong_verify_times++;
          errors = { code: errorCode['client.wrongInput'] };
          message = 'wrong code';
        }
        await user.save();
        return next(
          new BaseError({
            statusCode: 400,
            error: errorCode.client,
            errors
          }).addMeta({ message })
        );
      }

      // await userService.findOneAndUpdate({ phone }, { token, wrong_verify_time: 0, code: '' });
      user.token = token;
      user.wrong_verify_times = 0;
      user.code = '';
      await user.save();
    } else if (type === 'register') {
      const phoneRegister = await phoneRegisterService.findOne({ phone }, '+wrong_times');
      if (!phoneRegister) {
        return next(
          new BaseError({
            statusCode: 400,
            error: errorCode.client,
            errors: { user: errorCode['client.global.notFound'] }
          }).addMeta({ message: 'wrong phone or code' })
        );
      }

      const currentTime = new Date().getTime();
      if (currentTime > new Date(phoneRegister.expired_time).getTime()) {
        return next(
          new BaseError({
            statusCode: 400,
            error: errorCode.client,
            errors: { user: errorCode['client.tokenTimeOut'] }
          }).addMeta({ message: 'verify code was expired' })
        );
      }

      if (!phoneRegister.code) {
        return next(
          new BaseError({
            statusCode: 400,
            error: errorCode.client,
            errors: {
              code: errorCode['client.wrongInput']
            }
          }).addMeta({ message: 'wrong code' })
        );
      }

      if (phoneRegister.code !== code) {
        const wrong_times = phoneRegister.wrong_times || 0;
        let errors = {};
        let message = '';
        if (wrong_times + 1 >= 3) {
          // await phoneRegisterService.findOneAndUpdate({ phone }, { wrong_times: 0, code: '' });
          phoneRegister.wrong_times = 0;
          phoneRegister.code = '';
          await phoneRegister.save();
          errors = { code: errorCode['client.outOfLimit'] };
          message = 'wrong too many time';
        } else {
          phoneRegister.wrong_times++;
          const updated = await phoneRegister.save();
          // const updated = await phoneRegisterService.findOneAndUpdate(
          //   { phone },
          //   { $inc: { wrong_times: 1 } }
          // );
          errors = { code: errorCode['client.wrongInput'] };
          message = 'wrong code';
        }
        return next(
          new BaseError({ statusCode: 400, error: errorCode.client, errors }).addMeta({ message })
        );
      }

      // await phoneRegisterService.findOneAndUpdate(
      //   { phone, code },
      //   { token, wrong_times: 0, code: '' }
      // );
      phoneRegister.token = token;
      phoneRegister.wrong_times = 0;
      phoneRegister.code = '';
      await phoneRegister.save();
    }
    return res.send(new BaseResponse({ statusCode: 200, data: { token } }));
  } catch (err) {
    return next(err);
  }
}

export default {
  loginWithFacebook,
  adminLogin,
  userLogin,
  userRegister,
  userResetPassword,
  adminResetPassword,
  getUserFirebase,
  resendSMS,
  verify,
  rawSendSMS
};
