import promotionService from './promotion.service';
import _ from 'lodash';
import { BaseResponse, BaseError, errorCode } from '../../commons/utils';
import adminActivityService from '../../commons/admin-activity/admin-activity.service';

async function find(req, res, next) {
  try {
    let value = req.validate;
    let {
      sort,
      date_status,
      limit,
      page,
      start_time,
      end_time,
      start_at,
      expire_at,
      reference,
      select,
      status,
      promotion_ids,
      ...query
    } = value;
    let skip = page ? limit * (page - 1) : 0;
    let currentDate = new Date();

    if (status) {
      let condition = {};
      if (status === 'handling' || status === 'disabled') {
        condition.status = status;
      }
      if (status === 'pending') {
        condition = {
          start_at: { $gt: currentDate },
          status: 'active'
        };
      }
      if (status === 'active') {
        condition = {
          start_at: { $lt: currentDate },
          expire_at: { $gt: currentDate },
          status: 'active'
        };
      }
      if (status === 'expired') {
        condition = {
          expire_at: { $lt: currentDate },
          status: 'active'
        };
      }
      query = {
        ...query,
        ...condition
      };
    }
    if (start_time && end_time) {
      query = {
        ...query,
        createdAt: {
          $gte: new Date(start_time),
          $lte: new Date(end_time)
        }
      };
    }
    if (start_at && expire_at) {
      start_at = new Date(start_at);
      expire_at = new Date(expire_at);
      const activeTimeCondition = {
        $or: [
          { start_at: { $lte: expire_at }, expire_at: { $gte: start_at } },
          { start_at: { $lte: start_at }, expire_at: { $gte: expire_at } }
        ]
      };
      query = {
        ...query,
        ...activeTimeCondition
      };
    }
    const options = {
      limit,
      skip,
      sort
    };
    if (reference) {
      const refTextList = reference.split(' ');
      const populate = [];
      refTextList.forEach((text) => {
        if (text === 'product') {
          populate.push({ path: 'products.product', select: 'name thumbnail price' });
          return;
        }
        if (text === 'product_ids') {
          populate.push({ path: text, select: 'name thumbnail price' });
          return;
        }
        populate.push({ path: text, select: 'name' });
      });
      options.populate = populate;
    }
    if (promotion_ids) {
      query._id = { $in: promotion_ids };
    }
    const promotionsList = await promotionService.rawFind(query, select, options);
    const total = await promotionService.count(query);
    let totalPage = limit ? Math.ceil(total / limit) : 1;
    return res.send(
      new BaseResponse({ statusCode: 200, data: promotionsList }).addMeta({
        totalPage,
        total
      })
    );
  } catch (err) {
    return next(err);
  }
}

async function findById(req, res, next) {
  try {
    let promotion = await promotionService.findById(
      req.validate.id,
      {},
      {
        populate: [{ path: 'company' }]
      }
    );
    return res.send(new BaseResponse({ statusCode: 200, data: promotion }));
  } catch (err) {
    return next(err);
  }
}

async function findOneAndDelete(req, res, next) {
  try {
    let result = await promotionService.findOneAndDelete({
      _id: req.validate.id
    });
    if (result) {
      // Create admin activity
      adminActivityService.create({
        admin_id: req.admin.id,
        on_model: 's_promotion',
        object_id: result._id,
        updated_fields: result,
        type: 'delete',
        snapshot: result,
        resource: req.originalUrl
      });

      return res.send(new BaseResponse({ statusCode: 200 }));
    } else
      return next(
        new BaseError({
          statusCode: 400,
          error: errorCode.client,
          errors: { id: errorCode['client.wrongInput'] }
        })
      );
  } catch (err) {
    return next(err);
  }
}

export default {
  find,
  findOneAndDelete,
  findById
};
