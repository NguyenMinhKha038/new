import _ from 'lodash';
import adminBankService from './admin-bank.service';
import { BaseResponse, mergeObject } from '../../commons/utils';
import adminActivityService from '../../commons/admin-activity/admin-activity.service';

async function find(req, res, next) {
  try {
    const { limit, page } = req.data;
    const skip = limit ? limit * (page - 1) : 0;
    const rawQuery = _.pick(req.data, [
      'bank_name',
      'bank_branch',
      'bank_owner_name',
      'bank_account'
    ]);
    const query = mergeObject({ status: { $ne: 'disabled' } }, rawQuery);
    const count = await adminBankService.count(query);
    const totalPage = Math.ceil(count / limit);
    const sort = {
      priority: -1,
      ...req.data.sort
    };
    const response = await adminBankService.find({ query, skip, sort, limit });
    return res.send(
      new BaseResponse({
        statusCode: 200,
        data: response
      }).addMeta({ totalPage, count, total: count })
    );
  } catch (err) {
    return next(err);
  }
}

async function findById(req, res, next) {
  try {
    const response = await adminBankService.findById(req.data.id);
    return res.send(
      new BaseResponse({
        statusCode: 200,
        data: response
      })
    );
  } catch (err) {
    return next(err);
  }
}

export default {
  find,
  findById
};
