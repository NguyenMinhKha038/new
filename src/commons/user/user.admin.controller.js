import UserService from './user.service';
import _ from 'lodash';
import { errorCode as Errors, BaseError, BaseResponse } from '../utils';
import notificationService from '../../search/notification/notification.service';
import adminActivityService from '../admin-activity/admin-activity.service';
import { omitSensitiveUserData } from './user.model';
import userService from './user.service';

async function getUsers(req, res, next) {
  try {
    let value = req.validate;

    let limit = value.limit ? value.limit : 0;
    let skip = limit > 0 ? limit * (value.page - 1) : 0;
    let start = value.start ? value.start : null;
    let end = start ? new Date(value.end.getTime() + 60 * 60 * 24 * 1000) : null;
    let sort = value.sort ? value.sort : null;

    value = _.omit(value, ['limit', 'page', 'start', 'end', 'sort']);
    const totalUsers = await UserService.count(value);
    let totalPages = limit > 0 ? Math.ceil(totalUsers / limit) : 1;

    if (start && end) {
      let createdAt = { $gt: start, $lt: end };
      value = { ...value, createdAt };
    }
    let sortQuery = sort ? sort : {};
    let options = '-password -token -PIN';
    let users = await UserService.findSome(value, options, limit, skip, sortQuery);

    return res.send(
      new BaseResponse({ statusCode: 200, data: users }).addMeta({
        totalPages,
        totalPage: totalPages,
        page: req.query.page,
        total: totalUsers
      })
    );
  } catch (err) {
    return next(err);
  }
}

async function rawGetUsers(req, res, next) {
  try {
    let {
      limit,
      page,
      start_time,
      end_time,
      sort,
      excepted_status,
      user_ids,
      ...query
    } = req.validate;
    limit = limit || 0;
    let skip = limit > 0 ? limit * (page - 1) : 0;
    if (start_time && end_time) {
      query = {
        ...query,
        createdAt: {
          $gte: start_time,
          $lte: end_time
        }
      };
    }
    if (excepted_status) {
      query = {
        ...query,
        status: { $ne: excepted_status }
      };
    }

    if (user_ids) {
      query._id = { $in: user_ids };
    }

    const totalUsers = await UserService.count(query);
    const totalPage = limit > 0 ? Math.ceil(totalUsers / limit) : 1;

    const users = await UserService.rawFind({
      query,
      select: '-password -PIN -token',
      skip,
      limit,
      sort,
      // options: { populate: { path: 'staff-info' } }
      populate: {
        path: 'staff_info',
        populate: [
          { path: 'company_id', select: 'name' },
          { path: 'store_id', select: 'name' }
        ]
      }
    });
    const response = users.map((user) => omitSensitiveUserData(user.toObject()));
    return res.send(
      new BaseResponse({ statusCode: 201, data: response }).addMeta({
        totalPage: totalPage,
        total: totalUsers
      })
    );
  } catch (err) {
    return next(err);
  }
}

async function getOneById(req, res, next) {
  try {
    console.log('QUERY', req.query);
    let user = await UserService.findById(req.query.id);
    // if (user) {
    //   user = user.removeSensitive();
    // }
    if (user) {
      user = _.omit(user, ['password', 'PIN', 'chat_user_password']);
    }
    return res.send(new BaseResponse({ statusCode: 200, data: user }));
  } catch (err) {
    return next(err);
  }
}

async function checkKYC(req, res, next) {
  try {
    let value = req.validate;
    let reject = 'reject';
    let approve = 'approve';
    for (let val in value) {
      // check if each vlue not equal reject or approve
      if (val == 'id') continue;
      if (value[val] != reject && value[val] != approve) {
        return next(
          new BaseError({
            statusCode: 400,
            error: Errors.validate,
            errors: {
              [val]: Errors['any.unknown'],
              message: value[val]
            }
          })
        );
      }
    }
    let user = await UserService.findById(value.id);
    let status = 'approve-kyc';
    if (
      value.selfy_status == 'reject' ||
      value.backside_passport_status == 'reject' ||
      value.front_passport_status == 'reject'
    ) {
      status = 'reject-kyc';
    }
    let dataUpdate = {
      status: status,
      selfy_image: {
        path: user.selfy_image.path,
        status: value.selfy_status
      },
      passport_image: [
        {
          name: 'front',
          path: user.passport_image[0].path,
          status: value.front_passport_status
        },
        {
          name: 'backside',
          path: user.passport_image[1].path,
          status: value.backside_passport_status
        }
      ]
    };
    const appCurrency = process.env.APP_CURRENCY;
    let title = 'KYC của bạn đã được chấp nhận';
    let message = `Hiện tại bạn có thể thực hiện việc rút, chuyển ${appCurrency} và một số tác vụ liên quan`;
    let type = 'user_kyc_success';
    if (status !== 'approve-kyc') {
      title = 'KYC của bạn không được chấp nhận';
      message = `Bạn cần phải cập nhập lại KYC để có thể thực hiện việc rút, chuyển ${appCurrency} và một số tác vụ liên quan`;
      type = 'user_kyc_error';
    }
    notificationService.createAndSend({
      user_id: user._id,
      type,
      title,
      message
    });
    let response = await UserService.findOneAndUpdate({ _id: value.id }, dataUpdate, {
      select: 'name phone avatar verify status'
    });

    // Create admin activity
    adminActivityService.create({
      admin_id: req.admin.id,
      object_id: response._id,
      updated_fields: dataUpdate,
      type: 'update',
      snapshot: response,
      resource: req.originalUrl
    });

    return res.send(new BaseResponse({ statusCode: 200, data: response }));
  } catch (err) {
    return next(err);
  }
}

async function updateStatusUser(req, res, next) {
  try {
    let value = req.validate;
    let user = await UserService.findOneAndUpdate(
      { _id: value.id },
      { status: value.status },
      { select: '-password -token -PIN' }
    );

    // Create admin activity
    adminActivityService.create({
      admin_id: req.admin.id,
      object_id: user._id,
      updated_fields: ['status'],
      type: 'update',
      snapshot: user,
      resource: req.originalUrl
    });

    return res.send(new BaseResponse({ statusCode: 200, data: user }));
  } catch (err) {
    return next(err);
  }
}

async function getUserByStatus(req, res, next) {
  if (!req.query.status)
    return next(
      new BaseError({
        statusCode: 400,
        error: Errors.validate,
        erros: { status: Errors['any.required'] }
      })
    );
  try {
    let limit = 0;
    let skip = 0;
    let totalPages = 0;
    if (req.query.limit) {
      limit = parseInt(req.query.limit);
      totalPages = Math.ceil((await UserService.count({ status: req.query.status })) / limit);
    }
    if (req.query.page) {
      skip = limit * (req.query.page - 1);
    }
    let users = await UserService.findSome(
      { status: req.query.status },
      { select: '-password -token -PIN' },
      limit,
      skip
    );

    if (!users)
      return next(
        new BaseError({
          statusCode: 500,
          error: 'can not find user with this status',
          errors: {}
        })
      );
    return res.send(
      new BaseResponse({ statusCode: 200, data: users }).addMeta({
        totalPages,
        totalPage: totalPages,
        page: req.query.page
      })
    );
  } catch (err) {
    return next(err);
  }
}

async function getRegisterBetweenPeriodTime(req, res, next) {
  try {
    let value = req.validate;
    let limit = 0;
    let skip = 0;
    let totalPages = 0;
    let start = value.start;
    let end = new Date(value.end.getTime() + 60 * 60 * 24 * 1000);
    if (req.query.limit) {
      limit = parseInt(req.query.limit);
      totalPages = Math.ceil(
        (await UserService.count({ createdAt: { $gt: start, $lt: end } })) / limit
      );
    }
    if (req.query.page) {
      skip = limit * (req.query.page - 1);
    }
    let resultUsers = await UserService.findBetweenPeriodTime(start, end, limit, skip);
    for (let i = 0; i < resultUsers.length; i++) {
      resultUsers[i] = _.omit(resultUsers[i], ['password', 'PIN', 'token']);
    }
    return res.send(
      new BaseResponse({ statusCode: 200, data: resultUsers }).addMeta({
        totalPages,
        page: req.query.page
      })
    );
  } catch (err) {
    return next(err);
  }
}

async function getRefBetweenPeriodTime(req, res, next) {
  try {
    let value = req.validate;
    let limit = 0;
    let skip = 0;
    let totalPages = 0;
    let start = value.start;
    let end = new Date(value.end.getTime() + 60 * 60 * 24 * 1000);
    if (req.query.limit) {
      limit = parseInt(req.query.limit);
      // totalPages = Math.ceil(await UserService.count({})/limit);
    }
    if (req.query.page) {
      skip = limit * (req.query.page - 1);
    }
    let idUsers = await UserService.aggregate([
      {
        $match: {
          createdAt: { $gt: start, $lt: end },
          ref_id: { $exists: true, $ne: '' }
        }
      },
      {
        $group: {
          _id: '$ref_id'
        }
      },
      { $skip: skip },
      { $limit: limit }
    ]);
    totalPages = await UserService.aggregate([
      {
        $match: {
          createdAt: { $gt: start, $lt: end },
          ref_id: { $exists: true, $ne: '' }
        }
      },
      {
        $group: {
          _id: '$ref_id'
        }
      }
    ]);
    totalPages = Math.ceil(totalPages.length / limit);
    let users = await UserService.findSome({ $or: idUsers });
    let results = [];
    let max = { value: 0, user: {} };
    for (let i = 0; i < users.length; i++) {
      results.push(_.omit(users[i], ['password', 'token', 'PIN']));
      if (max.value < users[i].ref_point) {
        max.value = users[i].ref_point;
        max.user = results[i];
      }
    }

    return res.send(
      new BaseResponse({ statusCode: 200, data: users }).addMeta({
        totalPages,
        page: req.query.page,
        max
      })
    );
  } catch (err) {
    return next(err);
  }
}

async function getUserByPhone(req, res, next) {
  try {
    const { phone } = req.validate;
    const user = await userService.findOne({ phone });

    const response = user ? omitSensitiveUserData(user.toObject()) : null;
    return new BaseResponse({ statusCode: 200, data: response }).return(res);
  } catch (error) {
    return next(error);
  }
}

export default {
  getUsers,
  getOneById,
  getUserByStatus,
  getRefBetweenPeriodTime,
  getRegisterBetweenPeriodTime,
  checkKYC,
  updateStatusUser,
  rawGetUsers,
  getUserByPhone
};
