import _ from 'lodash';
import paymentService from './payment.service';
import { BaseResponse } from '../../commons/utils';

async function find(req, res, next) {
  try {
    let { limit, page, sort } = req.validate;
    let skip = limit ? limit * (page - 1) : 0;

    let query = _.omit(req.validate, ['limit', 'page', 'sort']);
    let totalPage = limit ? Math.ceil((await paymentService.count(query)) / limit) : 1;
    let populate = { path: 'user_id', select: 'name' };
    let records = await paymentService.find({
      query,
      limit,
      skip,
      sort,
      populate
    });

    return res.send(
      new BaseResponse({ statusCode: 200, data: records }).addMeta({
        totalPage
      })
    );
  } catch (err) {
    return next(err);
  }
}

async function findById(req, res, next) {
  try {
    let record = await paymentService.findById(req.validate.id);
    return res.send(new BaseResponse({ statusCode: 200, data: record }));
  } catch (err) {
    return next(err);
  }
}

export default {
  find,
  findById
};
