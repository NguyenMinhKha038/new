import service from './permission.service';
import { BaseResponse, BaseError } from '../../commons/utils';
import _ from 'lodash';

async function findPermissions(req, res, next) {
  try {
    let value = req.validate;
    let limit = value.limit ? parseInt(value.limit, 10) : 0;
    let totalPage = limit == 0 ? 1 : Math.ceil((await service.count({})) / limit);
    let skip = value.page ? limit * (value.page - 1) : 0;
    value = _.omit(value, ['limit', 'page']);
    let permissionsList = await service.find(value, limit, skip, {
      createdAt: -1
    });
    return res.send(
      new BaseResponse({ statusCode: 200, data: permissionsList }).addMeta({
        totalPage,
        page: req.body.page
      })
    );
  } catch (err) {
    return next(err);
  }
}

export default {
  findPermissions
};
