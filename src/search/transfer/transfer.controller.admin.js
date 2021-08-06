import { BaseError, errorCode, BaseResponse } from '../../commons/utils';
import transferService from './transfer.service';
import _, { indexOf } from 'lodash';
import { Mongoose } from 'mongoose';

async function find(req, res, next) {
  try {
    let { limit, page, sort, start_time, end_time, select, ...query } = req.validate;

    let skip = limit ? limit * (page - 1) : 0;
    if (start_time && end_time) {
      query = {
        ...query,
        createdAt: {
          $lte: end_time,
          $gte: start_time
        }
      };
    }
    // query.sender_id = req.user.id;
    const total = await transferService.count(query);
    let totalPage = limit ? Math.ceil(total / limit) : 1;
    let populate = [
      { path: 'sender_id', select: 'name phone' },
      { path: 'receiver_id', select: 'name phone' }
    ];
    const records = await transferService.find(query, select, { limit, skip, sort, populate });
    return res.send(
      new BaseResponse({ statusCode: 200, data: records }).addMeta({
        totalPage,
        total
      })
    );
  } catch (err) {
    return next(err);
  }
}

async function statistic(req, res, next) {
  try {
    const { start_time, end_time, limit, sender_id, receiver_id, ...queryParams } = req.validate;
    const query = {
      ...queryParams
    };
    if (start_time && end_time) {
      query.createdAt = {
        $lte: end_time,
        $gte: start_time
      };
    }
    if (sender_id) {
      query.sender_id = new Mongoose().Types.ObjectId(sender_id);
    }
    if (receiver_id) {
      query.receiver_id = new Mongoose().Types.ObjectId(receiver_id);
    }
    console.log('QUERY', query);
    const response = await transferService.statistics(query);
    return res.send(new BaseResponse({ statusCode: 200, data: response }));
  } catch (err) {
    return next(err);
  }
}

async function findById(req, res, next) {
  try {
    let { id } = req.validate;
    let record = await transferService.findById(id);
    return res.send(new BaseResponse({ statusCode: 200, data: record }));
  } catch (err) {
    return next(err);
  }
}

export default {
  find,
  findById,
  statistic
};
