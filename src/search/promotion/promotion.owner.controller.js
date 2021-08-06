import promotionService from './promotion.service';
import { BaseResponse, BaseError, errorCode, withSafety } from '../../commons/utils';
import _ from 'lodash';
import companyService from '../company/company.service';
import productService from '../product/product.service';
import companyActivityService from '../company-activity/company-activity.service';
import { CompanyActions } from '../company-activity/company-activity.config';
// import {} from 'mongoose'

function createCode() {
  let currentTime = new Date().getTime() % 1000000000;
  return currentTime.toString(36).toUpperCase();
}

async function create(req, res, next) {
  try {
    let code = createCode();
    let remain = req.validate.total;
    const company = req.company;
    if (company.status !== 'approved') {
      return next(
        new BaseError({
          statusCode: 400,
          error: errorCode.authorization,
          errors: { company: errorCode['client.company.notApproved'] }
        }).addMeta({ message: 'company is not approved' })
      );
    }
    req.validate.start_at = new Date(req.validate.start_at);
    req.validate.expire_at = new Date(req.validate.expire_at);
    let { product_scope, store_scope, product_ids, store_ids, expire_at, start_at } = req.validate;
    store_scope = 'all';

    let company_id = company._id;
    if (product_scope === 'all') {
      let allProducts = await productService.find({ company_id, limit: 0 });
      product_ids = [];
      allProducts.forEach((product, index) => {
        product_ids.push(product._id);
      });
    }
    const promotion = await promotionService.find({
      query: {
        company_id,
        product_ids: { $in: product_ids },
        $or: [
          {
            expire_at: { $gte: start_at },
            start_at: { $lte: start_at }
          },
          {
            start_at: { $lte: expire_at },
            expire_at: { $gte: expire_at }
          }
        ],
        status: 'active'
      }
    });

    if (promotion.length) {
      return next(
        new BaseError({
          statusCode: 400,
          error: errorCode.authorization,
          errors: {
            promotion: errorCode['autho.existed']
          }
        }).addMeta({
          message: 'promotion have existed in this period time',
          promotion
        })
      );
    }

    req.validate = {
      ...req.validate,
      product_ids
    };
    const { max_price, max_refund, max_discount } = await promotionService.getMaxRefund(
      product_ids,
      req.validate.refund,
      req.validate.value
    );
    let createdData = {
      ...req.validate,
      remain,
      code,
      // status: 'active',
      company_id,
      max_product_refund: max_refund,
      max_product_price: max_price,
      max_product_discount: max_discount
    };
    let newCreated = await promotionService.create(createdData);
    withSafety(() => {
      companyActivityService.implicitCreate(CompanyActions.createPromotion)(req, {
        object_id: newCreated._id
      });
    });
    return res.send(new BaseResponse({ statusCode: 201, data: newCreated }));
  } catch (err) {
    return next(err);
  }
}

async function find(req, res, next) {
  try {
    let {
      start_time,
      end_time,
      start_at,
      expire_at,
      limit,
      page,
      status_date,
      select,
      sort,
      status,
      reference,
      promotion_ids,
      ...query
    } = req.validate;
    let skip = page ? limit * (page - 1) : 0;
    let currentDate = new Date();
    if (start_time && end_time) {
      query = {
        ...query,
        createdAt: {
          $gte: new Date(start_time),
          $lte: new Date(end_time)
        }
      };
    }
    const company = req.company;
    query.company_id = company._id;

    if (status) {
      // let statusDate = status_date;
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
    const countingQuery = {
      ...query
    };
    let promotionIds = [];
    if (promotion_ids && promotion_ids instanceof Array) {
      if (promotion_ids.length > limit) {
        const startIndex = (page - 1) * limit;
        let endIndex = startIndex + limit;
        if (endIndex > promotion_ids.length) {
          endIndex = promotion_ids.length;
        }

        promotionIds = promotion_ids.slice(startIndex, endIndex);
        skip = 0;
      } else {
        promotionIds = promotion_ids;
      }

      query._id = { $in: promotionIds };
      countingQuery._id = { $in: promotion_ids };
    }
    const total = await promotionService.count(countingQuery);
    let totalPage = limit ? Math.ceil(total / limit) : 1;
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
        populate.push({ path: text, select: 'name' });
      });
      options.populate = populate;
    }

    // const query = query;
    const promotionsList = await promotionService.rawFind(query, select, options);
    if (promotionIds.length) {
      const responseList = [];
      promotionIds.forEach((id) => {
        const promotion = promotionsList.find((item) => item._id.toString() === id);
        if (promotion) {
          responseList.push(promotion);
        }
      });
      return new BaseResponse({ statusCode: 200, data: responseList })
        .addMeta({ totalPage, total })
        .return(res);
    }
    // promotion_ids[0]:
    return new BaseResponse({ statusCode: 200, data: promotionsList })
      .addMeta({
        totalPage,
        total
      })
      .return(res);
  } catch (err) {
    return next(err);
  }
}

async function findStatistic(req, res, next) {
  try {
    let { limit, sort, page, status_date, product_id, store_id } = req.validate;
    let skip = page ? limit * (page - 1) : 0;
    let currentDate = new Date();
    let value = req.validate;
    let company = await companyService.findOne({ user_id: req.user.id });
    if (!company)
      return next(
        new BaseError({
          statusCode: 400,
          error: errorCode.authorization,
          errors: {}
        }).addMeta({
          code: errorCode['company.notAvailable'],
          message: 'company is not available'
        })
      );
    value.company_id = company._id;
    if (value.status_date) {
      let statusDate = value.status_date;
      let condition = {};
      if (statusDate === 'pending') {
        condition = {
          starts_at: { $gt: currentDate }
        };
      } else if (statusDate === 'running') {
        condition = {
          starts_at: { $lt: currentDate },
          expires_at: { $gt: currentDate }
        };
      } else if (statusDate === 'expired') {
        condition = {
          expires_at: { $lt: currentDate }
        };
      }
      value = {
        ...value,
        ...condition
      };
    }

    if (store_id) {
      value['statistic_detail_store.store_id'] = store_id;
    }
    if (product_id) {
      value['statistic_detail_product.product_id'] = product_id;
    }

    let populate = [
      { path: 'product_ids', match: { status: 'approved' } },
      { path: 'store_ids', select: 'name' },
      { path: 'statistic_detail_store.store_id' },
      { path: 'statistic_detail_product.product_id' },
      { path: 'statistic_detail_product.product_storing_id' }
    ];

    value = _.omit(value, ['status_date', 'limit', 'page', 'sort', 'store_id', 'product_id']);
    let totalPage = limit ? Math.ceil((await promotionService.count(value)) / limit) : 1;

    let promotionsList = await promotionService.find({
      query: value,
      limit,
      skip,
      sort,
      populate
    });

    promotionsList = promotionsList.map((item) => {
      if (store_id) {
        item.statistic_detail_store = item.statistic_detail_store.filter(
          (elem) => elem.store_id._id.toString() == store_id
        );
      }
      if (product_id) {
        item.statistic_detail_product = item.statistic_detail_product.filter(
          (elem) => elem.product_id._id.toString() == product_id
        );
      }
      return item;
    });

    return res.send(
      new BaseResponse({ statusCode: 200, data: promotionsList }).addMeta({
        totalPage
      })
    );
  } catch (err) {
    return next(err);
  }
}

async function findById(req, res, next) {
  try {
    const { id } = req.validate;
    let promotion = await promotionService.findOne({ _id: id, company_id: req.company._id });
    if (promotion) {
      promotion = promotion.toObject();
    }
    // const { status, start_at, expire_at } = promotion;
    // promotion.status = convertPromotionStatus(status, start_at, expire_at);
    return res.send(new BaseResponse({ statusCode: 200, data: promotion }));
  } catch (err) {
    return next(err);
  }
}

async function findOneAndUpdate(req, res, next) {
  try {
    let value = req.validate;
    await promotionService.findOneAndUpdate({ _id: value.id }, _.omit(value, ['id']));
    let newUpdated = await promotionService.findById(value.id);
    promotionService.updateMaxRefund({ company_id: newUpdated.company_id });
    return res.send(new BaseResponse({ statusCode: 200, data: newUpdated }));
  } catch (err) {
    return next(err);
  }
}

async function updateStatus(req, res, next) {
  try {
    const { promotion_id } = req.validate;
    const company = req.company;
    const response = await promotionService.findOneAndUpdate(
      { company_id: company._id, _id: promotion_id },
      { status: 'disabled' }
    );
    promotionService.updateMaxRefund({ company_id: company._id });
    if (!response) {
      return next(
        new BaseError({
          statusCode: 200,
          error: errorCode.client,
          errors: { promotion_id: errorCode['client.global.notFound'] }
        }).addMeta({ message: 'promotion was not found' })
      );
    }
    withSafety(() => {
      companyActivityService.implicitCreate(CompanyActions.updatePromotion)(req, {
        object_id: promotion_id
      });
    });
    return res.send(new BaseResponse({ statusCode: 200, data: response }));
  } catch (err) {
    return next(err);
  }
}

async function findOneAndDelete(req, res, next) {
  try {
    await promotionService.findOneAndDelete({ _id: req.validate.id });
    promotionService.updateMaxRefund({ company_id: newUpdated.company_id });
    return res.send(new BaseResponse({ statusCode: 200 }));
  } catch (err) {
    return next(err);
  }
}

export default {
  create,
  find,
  findById,
  findOneAndDelete,
  findOneAndUpdate,
  updateStatus,
  findStatistic
};
// async function
