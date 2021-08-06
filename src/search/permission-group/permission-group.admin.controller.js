import permissionGroupService from './permission-group.service';
import { BaseResponse, BaseError } from '../../commons/utils';
import _ from 'lodash';

async function find(req, res, next) {
  try {
    const { limit, page, sort, user_ids, ...query } = req.validate;
    // let limit = value.limit || 0;
    let skip = page ? (page - 1) * limit : 0;

    const populate = [
      { path: 'user_id', select: ['_id', 'name', 'email', 'avatar', 'phone'] },
      { path: 'company_id', select: ['_id', 'name', 'representer', 'user_id'] },
      {
        path: 'store_id',
        select: ['_id', 'name', 'location', 'company_id', 'address', 'user_id']
      }
    ];

    if (user_ids) {
      query.user_id = { $in: user_ids };
    }

    const listResponse = await permissionGroupService.find({
      query,
      limit,
      skip,
      sort,
      populate
    });
    const total = await permissionGroupService.count(query);
    const total_page = limit > 0 ? Math.ceil(total / limit) : 1;
    return res.send(
      new BaseResponse({ statusCode: 200, data: listResponse }).addMeta({
        total_page,
        total
      })
    );
  } catch (err) {
    return next(err);
  }
}

async function rawFind(req, res, next) {
  try {
    let value = req.validate;
    let { company_ids, user_ids, store_ids } = value;
    let limit = value.limit || 0;
    let skip = value.page ? (value.page - 1) * limit : 0;
    let sort = value.sort || {};
    value = _.omit(value, ['limit', 'page', 'sort', 'company_ids', 'user_ids', 'store_ids']);
    if (company_ids) value.company_id = company_ids;
    if (user_ids) value.user_id = user_ids;
    if (store_ids) value.store_id = store_ids;
    let populate = [
      { path: 'user_id', select: ['_id', 'name', 'email', 'avatar', 'phone'] },
      { path: 'company_id', select: ['_id', 'name', 'representer', 'user_id'] },
      {
        path: 'store_id',
        select: ['_id', 'name', 'location', 'company_id', 'address', 'user_id']
      }
    ];

    let listResponse = await permissionGroupService.find({
      query: value,
      limit,
      skip,
      sort,
      populate
    });
    const total = await permissionGroupService.count(value);
    let total_page = limit > 0 ? Math.ceil(total / limit) : 1;
    return res.send(
      new BaseResponse({ statusCode: 200, data: listResponse }).addMeta({
        total_page,
        totalPage: total_page
      })
    );
  } catch (err) {
    return next(err);
  }
}

async function findById(req, res, next) {
  try {
    let populate = [
      { path: 'user_id', select: ['_id', 'name', 'email', 'avatar'] },
      { path: 'company_id', select: ['_id', 'name', 'representer', 'user_id'] },
      {
        path: 'store_id',
        select: ['_id', 'name', 'location', 'company_id', 'address', 'user_id']
      }
    ];
    let response = await permissionGroupService.findById(req.validate.id, populate);
    return res.send(new BaseResponse({ statusCode: 200, data: response }));
  } catch (err) {
    return next(err);
  }
}

export default {
  find,
  findById,
  rawFind
  // findByUserId
};
