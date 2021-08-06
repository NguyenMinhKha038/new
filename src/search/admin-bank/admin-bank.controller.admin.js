import adminBankService from './admin-bank.service';
import { BaseResponse, mergeObject } from '../../commons/utils';
import _ from 'lodash';
import adminActivityService from '../../commons/admin-activity/admin-activity.service';

async function find(req, res, next) {
  try {
    const { limit, page, sort } = req.data;
    const skip = limit ? limit * (page - 1) : 0;
    const rawQuery = _.pick(req.data, [
      'bank_name',
      'bank_branch',
      'bank_owner_name',
      'bank_account'
    ]);
    const query = mergeObject({}, rawQuery);
    const count = await adminBankService.count(query);
    const totalPage = Math.ceil(count / limit);
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

async function create(req, res, next) {
  try {
    const data = req.data;
    data.status = 'active';
    const response = await adminBankService.create(data);

    // Create admin activities
    adminActivityService.create({
      admin_id: req.admin.id,
      on_model: 'admin_banks',
      object_id: response._id,
      updated_fields: response,
      type: 'insert',
      snapshot: response,
      resource: req.originalUrl
    });

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

async function update(req, res, next) {
  try {
    const response = await adminBankService.findOneAndUpdate(
      { _id: req.data._id },
      _.omit(req.data, ['_id'])
    );

    // Create admin activities
    adminActivityService.create({
      admin_id: req.admin.id,
      on_model: 'admin_banks',
      object_id: response._id,
      updated_fields: _.omit(req.data, ['_id']),
      type: 'update',
      snapshot: response,
      resource: req.originalUrl
    });

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

async function findAndDelete(req, res, next) {
  try {
    await adminBankService.findByOneAndDelete({ _id: req.data.id });
    return res.send(new BaseResponse({ statusCode: 200 }));
  } catch (err) {
    return next(err);
  }
}

export default {
  find,
  findById,
  create,
  update,
  findAndDelete
};
