import UserService from './user.service';
import _ from 'lodash';
// import followerService from '../../video/follower/follower.service';
import Base64Image from 'base64-img';
import { errorCode as Errors, BaseResponse, BaseError, logger, errorCode } from '../utils';
import Over from '../over_function';
import { service as configService } from '../config';
import { join } from 'path';
// import sendMail from '../utils/send-mail';
import hashingCompare from '../utils/hashing-compare';
import orderService from '../../search/order/order.service';
import companyService from '../../search/company/company.service';
import productService from '../../search/product/product.service';
import permissionGroupService from '../../search/permission-group/permission-group.service';
import mallStaffService from '../../search/sum-mall/staff/staff.service';
import userHistoryService from '../../search/user-history/user-history.service';
import userService from './user.service';
import { authService } from '../auth';
import warehouseService from '../../search/warehouse/warehouse.service';
import storeModel from '../../search/store/store.model';

async function getUserInfo(req, res, next) {
  try {
    let [user, companyPermission, mallPermission] = await Promise.all([
      UserService.findOne({ _id: req.user.id }),
      permissionGroupService.findOne({ user_id: req.user.id, status: 'active' }, [
        { path: 'store_id', select: 'name' },
        { path: 'warehouse_id', select: 'name' }
      ]),
      mallStaffService.findOne({ user_id: req.user.id, status: 'active' }, null, {
        populate: { path: 'mall_id', select: 'name' }
      })
    ]);
    user = user.toObject();
    if (companyPermission) {
      if (companyPermission.is_owner) {
        user.is_owner = true;
        const [warehouses, stores] = await Promise.all([
          warehouseService.find(
            { company_id: companyPermission.company_id, status: 'active' },
            'name'
          ),
          storeModel.find({ company_id: companyPermission.company_id, status: 'active' }, 'name')
        ]);
        user.stores = stores;
        user.warehouses = warehouses;
      } else {
        user.permission = companyPermission.type;
        user.store = companyPermission.store_id;
        user.warehouse = companyPermission.warehouse_id;
      }
      // userPermission.is_owner ? (user.is_owner = true) : (user.permission = userPermission.type);
    }
    if (mallPermission) {
      user.mall = mallPermission.mall_id;
      user.mall_permission = mallPermission.roles;
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

    if (!user.chat_username || !user.chat_password) {
      try {
        const chatUser = await UserService.createChatUser(user);
        if (chatUser) {
          user = { ...chatUser };
        }
      } catch (err) {
        logger.error('Create chat user error %o', err);
      }
    }

    return res.send(new BaseResponse({ statusCode: 200, data: user }));
  } catch (err) {
    return next(err);
  }
}

const getByPhone = async (req, res, next) => {
  try {
    const { phone } = req.params;
    const user = await UserService.findByPhone(phone, 'name phone avatar gender');
    return new BaseResponse({ statusCode: 200, data: user }).return(res);
  } catch (error) {
    next(error);
  }
};

async function updateUserInfo(req, res, next) {
  const { id } = req.user;
  try {
    let value = req.validate;
    const user = await UserService.findById(id);
    let { phone, email } = user;

    if (value.birthday) {
      if (!Over.isRightDate(value.birthday)) {
        return next(
          new BaseError({
            statusCode: 400,
            error: Errors.validate,
            errors: { birthday: Errors['any.invalid'] }
          })
        );
      }
      if (new Date(value.birthday).getTime() > new Date().getTime()) {
        return new BaseError({
          statusCode: 400,
          error: Errors.validate,
          errors: { birthday: Errors['any.invalid'] }
        }).return(res);
      }
    }

    if ((phone && value.phone) || (email && value.email)) {
      return next(
        new BaseError({
          statusCode: 400,
          error: Errors.action,
          errors: {}
        }).addMeta({ message: 'phone or email had available' })
      );
    }

    if (value.avatar) {
      let avatarString = value.avatar;
      let regexAvatar = /data:image\/(png|jpg|jpeg);base64,.*/;
      if (!regexAvatar.test(avatarString))
        return next(
          new BaseError({
            statusCode: 400,
            error: Errors.validate,
            errors: { avatar: Errors['any.invalid'] }
          })
        );
      let dir = join(__dirname, '../../../public/uploads');
      let name = `${new Date().getTime()}.${req.user.id}.avatar`;
      let path = Base64Image.imgSync(avatarString, dir, name);
      value.avatar = path.substring(path.indexOf('public/uploads'), path.length);
    }

    if (value.PIN) {
      let pin = await hashingCompare.hashing(value.PIN);
      value.PIN = pin;
    }

    let userUpdated = await UserService.findOneAndUpdate({ _id: id }, value, {
      select:
        '-password -PIN -token -chat_username -chat_password -device_token -verify_code -verify_expired -verify_wrong_times'
    });

    // if (value.email) {
    // sendMail.sendmail(value.email, process.env.GMAIL_SUBJECT_VERIFY, token);
    // }

    return res.send(new BaseResponse({ statusCode: 200, data: userUpdated }));
  } catch (err) {
    return next(err);
  }
}

async function updateUserKyc(req, res, next) {
  const { id } = req.user;
  try {
    let value = req.validate;
    if (!Over.isRightDate(value.birthday))
      return next(
        new BaseError({
          statusCode: 400,
          error: Errors.validate,
          errors: { birthday: Errors['any.invalid'] }
        })
      );

    let dir = join(__dirname, '../../../private/images');
    let selfyPath = Over.returnPathImageFromRequest(
      value.selfy_image,
      dir,
      `${new Date().getTime()}.${req.user.id}.selfy_image`
    );
    let frontPassportPath = Over.returnPathImageFromRequest(
      value.front_passport_image,
      dir,
      `${new Date().getTime()}.${req.user.id}.front_passport_image`
    );
    let backsidePassportPath = Over.returnPathImageFromRequest(
      value.backside_passport_image,
      dir,
      `${new Date().getTime()}.${req.user.id}.backside_passport_image`
    );

    if (!selfyPath || !frontPassportPath || !backsidePassportPath) {
      if (!selfyPath) {
        return next(
          new BaseError({
            statusCode: 400,
            error: Errors.client,
            errors: { selfy_image: Errors['client.wrongImage'] }
          })
        );
      } else {
        return next(
          new BaseError({
            statusCode: 400,
            error: Errors.client,
            errors: {
              front_passport_image: frontPassportPath ? Errors['client.wrongInput'] : '',
              backside_passport_image: frontPassportPath ? '' : Errors['client.wrongInput']
            }
          })
        );
      }
    }
    let { passport_provide_date, passport_provide_location } = value;
    let data = {
      name: req.body.name,
      birthday: req.body.birthday,
      passport_type: req.body.passport_type,
      address: req.body.address,
      passport_provide_date,
      passport_provide_location,
      status: 'pending-kyc',
      selfy_image: {
        path: selfyPath,
        status: 'pending'
      },
      passport_image: [
        {
          name: 'front',
          path: frontPassportPath,
          status: 'pending'
        },
        {
          name: 'backside',
          path: backsidePassportPath,
          status: 'pending'
        }
      ]
    };

    let responseUpdate = await UserService.findOneAndUpdate({ _id: id }, data, {
      select: { ...data }
    });
    // let responeUpdate = _.omit(await UserService.findById(req.user.id), ['password']);

    return res.send(new BaseResponse({ statusCode: 200, data: responseUpdate }));
  } catch (err) {
    return next(err);
  }
}

async function updateKYCRaw(req, res, next) {
  try {
    const { front_passport, backside_passport, selfy } = req.validate;
    let data = _.omit(req.validate, ['front_passport', 'backside_passport', 'selfy']);
    data = {
      ...data,
      status: 'pending-kyc',
      selfy_image: {
        path: selfy,
        status: 'pending'
      },
      passport_image: [
        {
          name: 'front',
          path: front_passport,
          status: 'pending'
        },
        {
          name: 'backside',
          path: backside_passport,
          status: 'pending'
        }
      ]
    };
    let response = await UserService.findOneAndUpdate({ _id: req.user.id }, data, {
      select:
        'name passport_image selfy_image status address passport_provide_location passport_provide_date passport_number birthday'
    });
    return res.send(
      new BaseResponse({
        statusCode: 201,
        data: response
      })
    );
  } catch (err) {
    return next(err);
  }
}

async function updateRefPoint(req, res, next) {
  try {
    let value = req.body;
    let users = await UserService.findSome({
      $or: [{ _id: req.user.id }, { ref_code: value.ref_code }]
    });

    let currentUser = Over.returnOneFromAll(users, req.user.id, '_id');
    let refUser = Over.returnOneFromAll(users, value.ref_code, 'ref_code');

    let currentTime = new Date().getTime();
    let createdTimeUSer = currentUser.createdAt.getTime();
    if (currentTime - createdTimeUSer <= 86400 * 1000) {
      if (!currentUser || (currentUser.ref_id && currentUser.ref_id != ''))
        return next(
          new BaseError({
            statusCode: 400,
            error: currentUser ? Errors.action : Errors.server,
            errors: {
              action: currentUser ? Errors['refCode.haveDone'] : '',
              currentUser: currentUser ? '' : Errors['server.canNodFind']
            }
          })
        );

      if (!refUser || refUser._id == req.user.id)
        return next(
          new BaseError({
            statusCode: 400,
            error: refUser ? Errors.client : Errors.server,
            errors: {
              ref_code: refUser
                ? Errors['client.refYourSelf']
                : 'can not find user with this ref_code',
              user: refUser ? '' : Errors['server.canNodFind'] + ''
            }
          })
        );

      let ref = await configService.get('ref'); //get value of config ref

      if (!ref)
        return next(
          new BaseError({
            statusCode: 400,
            error: Errors.server,
            errors: { ref: Errors['server.canNodFind'] }
          })
        );

      let ref_point = refUser.ref_point + ref;
      let point = refUser.point + ref;
      let ref_id = refUser._id; // action of current user

      await UserService.findOneAndUpdate({ _id: refUser._id }, { ref_point, point });
      await UserService.findOneAndUpdate({ _id: req.user.id }, { ref_id });

      let response = await UserService.findById(req.user.id, 'ref_point point');
      // response = _.omit(response, [
      //   'password',
      //   'PIN',
      //   'token',
      //   'chat_username',
      //   'chat_password',
      //   'verify_code',
      //   'verify_'
      // ]);
      return res.send(new BaseResponse({ statusCode: 200, data: { user: response } }));
    } else {
      return next(
        new BaseError({
          statusCode: 400,
          error: Errors.client,
          errors: { time: Errors['client.refOverTime'] }
        })
      );
    }
  } catch (err) {
    return next(err);
  }
}

async function getRefUserOfOne(req, res, next) {
  try {
    let { limit, page, sort, ...query } = req.validate;
    limit = limit || 0;
    const skip = limit ? limit * (page - 1) : 0;
    query = { ref_id: req.user.id, ...query };
    let refUsers = await UserService.findSome(query, {}, limit, skip);

    const totalUsers = await UserService.count(query);
    const totalPage = limit ? Math.ceil(totalUsers / limit) : 1;

    const orderUserQuery = [];
    if (refUsers.length > 0) {
      for (let i = 0; i < refUsers.length; i++) {
        refUsers[i] = _.pick(refUsers[i], ['_id', 'name', 'phone', 'createdAt']);
        orderUserQuery.push({ user_id: refUsers[i]._id });
      }
    }
    let orderActions = null;
    if (orderUserQuery.length) {
      const orderPipeline = [
        { $match: { $or: orderUserQuery } },
        { $group: { _id: '$user_id', total_orders: { $sum: 1 } } }
      ];
      orderActions = orderService.aggregate({ pipeline: orderPipeline });
    }
    const userHistoryPipeline = [
      { $match: { user_id: req.user._id, type: 'commission' } },
      { $group: { _id: '$refed_id', total_commission: { $sum: '$value' } } }
    ];

    const [orders, userHistory] = await Promise.all([
      // orderService.aggregate({ pipeline: orderPipeline }),
      orderActions,
      userHistoryService.aggregate(userHistoryPipeline)
    ]);
    const response = [];
    for (const user of refUsers) {
      const data = { ...user, total_orders: 0, total_commission: 0 };
      const order = orders.find((item) => item._id.toString() === user._id.toString());
      const history = userHistory.find((item) => item._id.toString() === user._id.toString());
      if (order) {
        data.total_orders = order.total_orders;
      }
      if (history) {
        data.total_commission = history.total_commission;
      }
      response.push(data);
    }
    return res.send(
      new BaseResponse({ statusCode: 200, data: response }).addMeta({
        totalPage,
        total: totalUsers
      })
    );
  } catch (err) {
    return next(err);
  }
}

async function checkStatusUserBySpecificFields(req, res, next) {
  try {
    let query = req.validate;
    let user = await UserService.findOne(query);
    if (user && user.status === 'approve-kyc' && user.verify) {
      return res.send(new BaseResponse({ statusCode: 200, data: true }));
    } else {
      return res.send(new BaseResponse({ statusCode: 200, data: false }));
    }
    // return res.send(new BaseResponse({statusCode: 200, data: user}));
  } catch (err) {
    return next(err);
  }
}

async function countStatisticExplore(req, res, next) {
  try {
    const user_id = req.user.id;
    let [
      orderCount,
      companyFollowingCount,
      productViewCount,
      productFavoriteCount
    ] = await Promise.all([
      orderService.count({ user_id }),
      companyService.countReaction({ user_id, follow: true }),
      productService.countReaction({ user_id, view: true }),
      productService.countReaction({ user_id, favorite: true })
    ]);
    return res.send(
      new BaseResponse({
        statusCode: 200,
        data: {
          orderCount,
          companyFollowingCount,
          productViewCount,
          productFavoriteCount
        }
      })
    );
  } catch (err) {
    return next(err);
  }
}

async function authPin(req, res, next) {
  try {
    const { PIN } = req.validate;
    let user = await UserService.findById(req.user.id);
    let pinComparing = await hashingCompare.compareHashCode(PIN, user.PIN);
    if (!pinComparing) {
      return next(
        new BaseError({
          statusCode: 400,
          error: Errors.authorization,
          errors: { PIN: Errors['client.wrongPIN'] }
        })
      );
    }
    return res.send(new BaseResponse({ statusCode: 200 }));
  } catch (err) {
    return next(err);
  }
}

async function updatePin(req, res, next) {
  try {
    const { new_code, old_code, password } = req.validate;
    let user = await UserService.findByIdRaw(req.user.id);
    if (user.PIN) {
      let checker = await hashingCompare.compareHashCode(old_code, user.PIN);
      if (!checker)
        return next(
          new BaseError({
            statusCode: 400,
            error: Errors.client,
            errors: {
              old_code: Errors['client.wrongPIN']
            }
          })
        );
    }
    if (password) {
      const passwordChecker = await hashingCompare.compareHashCode(password, user.password);
      if (!passwordChecker) {
        return next(
          new BaseError({
            statusCode: 400,
            error: errorCode.authorization,
            errors: { password: errorCode['autho.notMatch'] }
          }).addMeta({ message: 'wrong password' })
        );
      }
    }
    let pinHash = await hashingCompare.hashing(new_code);
    let newUser = await UserService.findOneAndUpdate(
      { _id: req.user.id },
      { PIN: pinHash, active_pin: true },
      { select: 'name active_pin' }
    );
    return res.send(new BaseResponse({ statusCode: 200, data: newUser }));
  } catch (err) {
    return next(err);
  }
}

async function getChatUser(req, res, next) {
  try {
    let user = await UserService.getChatUser({ _id: req.user.id });
    return res.send(new BaseResponse({ statusCode: 200, data: user }));
  } catch (err) {
    return next(err);
  }
}

async function changePass(req, res, next) {
  try {
    let { old_pass, new_pass } = req.validate;
    if (old_pass === new_pass) {
      return next(
        new BaseError({
          statusCode: 400,
          error: Errors.client,
          errors: { password: Errors['client.passwordDuplicate'] }
        }).addMeta({ message: 'new password is duplicate with old pass' })
      );
    }

    const user = await UserService.findByIdRaw(req.user.id, 'password avatar name +user_version');
    let comparing = await hashingCompare.compareHashCode(old_pass, user.password);
    if (!comparing) {
      return next(
        new BaseError({
          statusCode: 400,
          error: Errors.authorization,
          errors: { old_pass: Errors['autho.notMatch'] }
        }).addMeta({ message: 'wrong password' })
      );
    }
    let password = await hashingCompare.hashing(new_pass);

    await UserService.findOneAndUpdate(
      { _id: req.user.id },
      { password, $inc: { user_version: 1 } }
    );
    const { _id: id, name, avatar, user_version } = user;
    const dataToCreateToken = {
      id,
      name,
      avatar,
      user_version: user_version + 1
    };
    const new_access_token = authService.createJwtToken(dataToCreateToken);
    return res.send(new BaseResponse({ statusCode: 200, data: { new_access_token } }));
  } catch (err) {
    return next(err);
  }
}

async function resetPin(req, res, next) {
  try {
    const { password, new_code } = req.validate;
    const user = await userService.findByIdRaw(req.user._id);
    const checker = await hashingCompare.compareHashCode(password, user.password);
    if (!checker) {
      return next(
        new BaseError({
          statusCode: 400,
          error: Errors.authorization,
          errors: { password: Errors['autho.notMatch'] }
        }).addMeta({ message: 'wrong password' })
      );
    }
    const pin = await hashingCompare.hashing(new_code);
    user.PIN = pin;
    await user.save();
    return res.send(new BaseResponse({ statusCode: 200 }));
  } catch (error) {
    return next(error);
  }
}

export default {
  getByPhone,
  getUserInfo,
  getRefUserOfOne,
  updateUserInfo,
  updateUserKyc,
  updateRefPoint,
  countStatisticExplore: countStatisticExplore,
  checkStatusUserBySpecificFields,
  authPin,
  updatePin,
  getChatUser,
  updateKYCRaw,
  changePass,
  resetPin
};
