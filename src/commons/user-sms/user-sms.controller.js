import { BaseError, errorCode, BaseResponse } from '../utils';
import userSmsService from './user-sms.service';
import _ from 'lodash';

async function get(req, res, next) {
  try {
    const { limit, page, sort } = req.validate;
    let skip = limit ? limit * (page - 1) : 0;
    let query = _.omit(req.validate, ['limit', 'page', 'sort']);
    const total = await userSmsService.count(query);
    let totalPage = limit ? Math.ceil(total / limit) : 1;
    let response = await userSmsService.find({ query, skip, limit, sort });
    return res.send(
      new BaseResponse({ statusCode: 200, data: response }).addMeta({
        totalPage,
        total
      })
    );
  } catch (err) {
    return next(
      new BaseError({
        statusCode: 500,
        error: 'cannot get list user sms',
        errors: err
      })
    );
  }
}

async function getById(req, res, next) {
  try {
    const { id } = req.validate;
    let response = await userSmsService.findById(id);
    return res.send(new BaseResponse({ statusCode: 200, data: response }));
  } catch (err) {
    return next(
      new BaseError({
        statusCode: 500,
        error: 'cannot get list user sms',
        errors: err
      })
    );
  }
}

export default {
  get,
  getById
};
