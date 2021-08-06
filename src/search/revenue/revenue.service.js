import revenueModel from './revenue.model';
import { findAdvanced, getDate, mergeObject } from '../../commons/utils';
import statisticService from '../statistic/statistic.service';
import categoryRevenueModel from './category-revenue.model';
import orderModel from '../order/order.model';
import { Statuses as OrderStatuses } from '../order/v2/order.config';
import { toObjectId } from '../../commons/utils/utils';

export default {
  async find(conditions = { limit: '', page: '', select: '', sort: '', ...query }) {
    const revenues = await findAdvanced(revenueModel, conditions);
    return revenues;
  },
  async getTotalByDate({ start_time, end_time, company_id }) {
    [start_time, end_time] = [
      getDate(start_time),
      getDate(new Date(end_time.setDate(end_time.getDate() + 1)))
    ];
    const revenues = await revenueModel.aggregate([
      {
        $match: {
          company_id: company_id,
          date: { $gte: start_time, $lte: end_time }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$total' },
          total_pay: { $sum: '$total_pay' },
          total_buyer: { $sum: '$total_buyer' },
          total_discount: { $sum: '$total_discount' },
          total_refund: { $sum: '$total_refund' },
          total_deposit: { $sum: '$total_deposit' },
          total_withdraw: { $sum: '$total_withdraw' },
          total_withdrawal_fee: { $sum: '$total_withdrawal_fee' },
          total_banner_fee: { $sum: '$total_banner_fee' },
          total_service_fee: { $sum: '$total_service_fee' }
        }
      }
    ]);
    return { ...revenues[0], start_time, end_time };
  },
  async statisticByDate({ start_time, end_time, company_id }) {
    [start_time, end_time] = [
      getDate(start_time),
      getDate(new Date(end_time.setDate(end_time.getDate() + 1)))
    ];
    // let dateRange = getDate(start_time, end_time.setDate(end_time.getDate() - 1));
    let revenues = await revenueModel.aggregate([
      {
        $match: {
          company_id: company_id,
          date: { $gte: start_time, $lte: end_time }
        }
      },
      {
        $group: {
          _id: '$date',
          date: { $first: '$date' },
          total: { $sum: '$total' },
          total_pay: { $sum: '$total_pay' },
          total_buyer: { $sum: '$total_buyer' },
          total_discount: { $sum: '$total_discount' },
          total_refund: { $sum: '$total_refund' },
          total_deposit: { $sum: '$total_deposit' },
          total_service_fee: { $sum: '$total_service_fee' },
          total_transport_fee: { $sum: '$total_transport_fee' }
        }
      },
      {
        $sort: {
          date: -1
        }
      }
    ]);
    return revenues;
  },
  async statisticByStore({ start_time, end_time, company_id }) {
    const revenues = await revenueModel.aggregate([
      {
        $match: {
          company_id: company_id,
          store_id: { $exists: true },
          date: { $gte: start_time, $lte: end_time }
        }
      },

      {
        $group: {
          _id: '$store_id',
          company_id: { $first: '$company_id' },
          store_id: { $first: '$store_id' },
          total: { $sum: '$total' },
          total_buyer: { $sum: '$total_buyer' },
          total_discount: { $sum: '$total_discount' },
          total_refund: { $sum: '$total_refund' },
          total_deposit: { $sum: '$total_deposit' },
          total_service_fee: { $sum: '$total_service_fee' },
          total_pay: { $sum: '$total_pay' }
        }
      }
    ]);
    return revenues;
  },
  async statisticByStoreDates({ start_time, end_time, store_id }) {
    [start_time, end_time] = [
      getDate(start_time),
      getDate(new Date(end_time.setDate(end_time.getDate() + 1)))
    ];
    let revenues = await revenueModel.aggregate([
      {
        $match: {
          store_id: store_id.toObjectId(),
          date: { $gte: start_time, $lte: end_time }
        }
      },
      {
        $group: {
          _id: '$date',
          date: { $first: '$date' },
          store_id: { $first: '$store_id' },
          total: { $sum: '$total' },
          total_pay: { $sum: '$total_pay' },
          total_buyer: { $sum: '$total_buyer' },
          total_discount: { $sum: '$total_discount' },
          total_refund: { $sum: '$total_refund' },
          total_deposit: { $sum: '$total_deposit' },
          total_service_fee: { $sum: '$total_service_fee' },
          total_transport_fee: { $sum: '$total_transport_fee' }
        }
      },
      {
        $sort: {
          date: -1
        }
      }
    ]);
    return revenues;
  },

  async statisticCompanyDates({
    start_time,
    end_time,
    company_id,
    category_id,
    type_category_id,
    group_by
  }) {
    [start_time, end_time] = [
      getDate(start_time),
      getDate(new Date(end_time.setDate(end_time.getDate() + 1)))
    ];
    const queryId = { company_id, category_id, type_category_id };
    let matchQuery = {};
    for (let key in queryId) {
      if (queryId[key]) matchQuery[key] = queryId[key].toObjectId();
    }

    const group = {
      _id: group_by ? `$${group_by}_id` : '$date',
      // _id: '$date',
      date: { $first: '$date' },
      // date: '$date',
      // company_id: { $first: '$company_id' },
      // category_id: { $first: '$category_id' },
      // type_category_id: { $first: '$type_category_id' },
      total: { $sum: '$total' },
      total_pay: { $sum: '$total_pay' },
      total_buyer: { $sum: '$total_buyer' },
      total_discount: { $sum: '$total_discount' },
      total_refund: { $sum: '$total_refund' },
      total_deposit: { $sum: '$total_deposit' },
      total_service_fee: { $sum: '$total_service_fee' },
      total_transport_fee: { $sum: '$total_transport_fee' }
    };
    // if (!group_by) {
    //   group.date = { $first: '$date' };
    // }

    if (group_by === 'company') {
      group.company_id = { $first: '$company_id' };
      if (company_id) {
        group._id = '$date';
      }
    }
    if (group_by === 'category') {
      group.category_id = { $first: '$category_id' };
      if (category_id) {
        group._id = '$date';
      }
    }
    if (group_by === 'type_category') {
      group.type_category_id = { $first: '$type_category_id' };
      if (type_category_id) {
        group._id = '$date';
      }
    }

    let revenuePipeline = [
      {
        $match: {
          ...matchQuery,
          date: { $gte: start_time, $lte: end_time }
        }
      },
      {
        $group: group
      },
      {
        $sort: {
          date: -1
        }
      }
    ];

    const groupByLookup = {
      company: {
        from: 's_companies',
        localField: 'company_id',
        foreignField: '_id',
        as: 'companies'
        // select: 'name'
      },
      category: {
        from: 's_category',
        localField: 'category_id',
        foreignField: '_id',
        as: 'categories'
      },
      type_category: {
        from: 's_category',
        localField: 'type_category_id',
        foreignField: '_id',
        as: 'categories'
      }
    };

    const lookup = {
      $lookup: groupByLookup[group_by]
    };

    const pipeline = group_by
      ? [
          ...revenuePipeline,
          lookup,
          {
            $project: {
              'companies.name': 1,
              'companies._id': 1,
              'categories.name': 1,
              'categories._id': 1,
              _id: 1,
              date: 1,
              total: 1,
              total_pay: 1,
              total_buyer: 1,
              total_discount: 1,
              total_refund: 1,
              total_deposit: 1,
              total_service_fee: 1
            }
          }
        ]
      : [...revenuePipeline];
    let revenue = await revenueModel.aggregate(pipeline);
    return revenue;
  },

  async findById(_id) {
    return await revenueModel.findById(_id);
  },
  async update(
    query = {
      company_id: '',
      store_id: ''
    },
    update = {
      total: 0,
      total_pay: 0,
      total_refund: 0,
      total_buyer: 0,
      total_discount: 0,
      total_deposit: 0,
      total_banner_fee: 0,
      total_service_fee: 0,
      total_withdraw: 0,
      total_withdrawal_fee: 0,
      total_transport_fee: 0
    }
  ) {
    statisticService.update({
      total_revenue: update.total,
      total_discount: update.total_discount,
      total_deposit_company: update.total_deposit,
      total_pay: update.total_pay,
      total_banner_fee: update.total_banner_fee,
      total_service_fee: update.total_service_fee,
      total_withdrawal_company: update.total_withdraw,
      total_withdrawal_fee: update.total_withdrawal_fee,
      total_transport_fee: update.total_transport_fee
    });
    return await revenueModel.findOneAndUpdate(
      { ...query, date: getDate() },
      { $inc: mergeObject({}, update) },
      { runValidators: true, new: true, upsert: true }
    );
  },
  async updateByCategory(
    query = {
      company_id: '',
      type_category_id: '',
      company_category_id: '',
      sub_category_id: ''
    },
    update = {
      total: 0,
      total_pay: 0
    }
  ) {
    return await categoryRevenueModel.findOneAndUpdate(
      { ...mergeObject(query), date: getDate() },
      { $inc: mergeObject({}, update) },
      { runValidators: true, new: true, upsert: true }
    );
  },
  async aggregate(query) {
    return await revenueModel.aggregate(query).sort('_id');
  },
  async menuRevenueByStoreDates({ start_time, end_time, store_id, date_order }) {
    [start_time, end_time] = [
      getDate(start_time),
      getDate(new Date(end_time.setDate(end_time.getDate() + 1)))
    ];
    let query = {
      date: { $gte: start_time, $lte: end_time },
      store_id,
      is_created_from_menu: true,
      status: OrderStatuses.Completed
    };
    query = toObjectId(query);
    const revenues = await orderModel
      .aggregate()
      .match(query)
      .group({
        _id: `$date`,
        totalOrders: { $sum: 1 },
        totalRefund: { $sum: '$total_refund' },
        totalRevenue: { $sum: '$total' }
      })
      .sort({ _id: date_order === 'increasing' ? 1 : -1 });

    return revenues;
  },
  async menuRevenueByStoreDate({ date, store_id, sort }) {
    let query = {
      date: {
        $gte: getDate(date),
        $lte: getDate(new Date(date.setDate(date.getDate() + 1)))
      },
      store_id,
      is_created_from_menu: true,
      status: OrderStatuses.Completed
    };
    query = toObjectId(query);

    const revenues = await orderModel
      .aggregate()
      .match(query)
      .unwind('$products')
      .group({
        _id: '$products.id',
        totalOrders: { $sum: 1 },
        products: { $push: '$products' }
      })
      .lookup({
        from: `s_products`,
        localField: `_id`,
        foreignField: '_id',
        as: 'product'
      })
      .project({
        'product.name': 1,
        'product.thumbnail': 1,
        'product.price': 1,
        'product.status': 1,
        'product.description': 1,
        totalOrders: 1,
        totalRevenue: { $sum: '$products.total' },
        totalRefund: { $sum: '$products.total_refund' },
        totalSold: { $sum: '$products.quantity' }
      })
      .sort(sort || '-totalRevenue');

    return revenues;
  }
};
