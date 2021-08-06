import { pick } from 'lodash';
import { BaseError, BaseResponse, errorCode } from '../../commons/utils';
import { getDateRangeQuery, toObjectId } from '../../commons/utils/utils';
import { TrackingPlaces } from './product-stock-tracking.config';
import productStockTrackingService from './product-stock-tracking.service';

export default {
  company: {
    async getStockCheckingForOneProduct(req, res, next) {
      try {
        const modelDict = {
          store: 'product_storing',
          warehouse: 'warehouse_storing',
          mall: 'mall_storing'
        };
        let {
          company: { id: company_id, is_owner, ...company },
          query: {
            limit,
            page,
            created_from,
            created_to,
            date_order,
            warehouse_id,
            store_id,
            ...query
          }
        } = req;
        Object.assign(
          query,
          getDateRangeQuery('createdAt', { fromDate: created_from, toDate: created_to })
        );
        query.company_id = company_id;
        const trackingPlace = query.tracking_place;
        if (!is_owner) {
          query[`${trackingPlace}_id`] = company[`${trackingPlace}_id`];
        } else {
          query[`${trackingPlace}_id`] = req.query[`${trackingPlace}_id`];
        }
        if (!query[`${trackingPlace}_id`]) {
          throw new BaseError({
            statusCode: 400,
            error: errorCode.client,
            errors: { [`${trackingPlace}_id`]: errorCode['any.required'] }
          });
        }

        // To ObjectId (if any) for aggregation
        query = toObjectId(query);
        const onModel = modelDict[trackingPlace];
        const [stockChecking, total] = await Promise.all([
          productStockTrackingService
            .aggregate()
            .match(query)
            .sort({ createdAt: date_order === 'increasing' ? 1 : -1 })
            .group({
              _id: `$tracking_date`,
              first_record: { $first: '$$ROOT' },
              last_record: { $last: '$$ROOT' },
              records: { $push: '$$ROOT' }
            })
            .lookup({
              from: `s_${onModel}s`,
              localField: `first_record.${onModel}_id`,
              foreignField: '_id',
              as: `${onModel}`
            })
            .lookup({
              from: `s_products`,
              localField: `first_record.product_id`,
              foreignField: '_id',
              as: 'product'
            })
            .addFields({
              date: '$_id',
              product: { $arrayElemAt: ['$product', 0] },
              [`${onModel}`]: { $arrayElemAt: [`$${onModel}`, 0] },
              import_records: {
                $filter: {
                  input: '$records',
                  as: 'record',
                  cond: {
                    $and: [
                      { $in: ['$$record.type', ['import', 'local_import', 'edit']] },
                      {
                        $gte: [
                          {
                            $subtract: ['$$record.batch_stock', '$$record.prev.batch_stock']
                          },
                          0
                        ]
                      }
                    ]
                  }
                }
              },
              export_records: {
                $filter: {
                  input: '$records',
                  as: 'record',
                  cond: {
                    $and: [
                      { $in: ['$$record.type', ['export', 'local_export', 'edit']] },
                      {
                        $gte: [
                          {
                            $subtract: ['$$record.prev.batch_stock', '$$record.batch_stock']
                          },
                          0
                        ]
                      }
                    ]
                  }
                }
              }
            })
            .sort({ 'last_record.createdAt': date_order === 'increasing' ? 1 : -1 })
            .project({
              date: 1,
              product: 1,
              [`${onModel}`]: 1,
              start_term_stock: `$${
                date_order === 'increasing' ? 'first' : 'last'
              }_record.prev.batch_stock`,
              end_term_stock: `$${
                date_order === 'increasing' ? 'last' : 'first'
              }_record.batch_stock`,
              total_import: {
                $subtract: [
                  { $sum: '$import_records.batch_stock' },
                  { $sum: '$import_records.prev.batch_stock' }
                ]
              },
              total_export: {
                $subtract: [
                  { $sum: '$export_records.prev.batch_stock' },
                  { $sum: '$export_records.batch_stock' }
                ]
              }
            })
            .skip((page - 1) * limit)
            .limit(limit),
          productStockTrackingService
            .find(query)
            .distinct('tracking_date')
            .then((re) => (re || []).length)
        ]);
        const total_page = Math.ceil(total / limit);

        // Remove unnecessary fields
        if (stockChecking.length) {
          stockChecking.forEach((item) => {
            item.product = pick(item.product, [
              '_id',
              'id',
              'name',
              'price',
              'images',
              'thumbnail',
              'SKU',
              'unit'
            ]);
            item[onModel] = pick(item[onModel], [
              '_id',
              'id',
              'stock',
              'on_sales_stock',
              'batch_stock',
              'price',
              'SKU',
              'unit'
            ]);
          });
        }

        return new BaseResponse({ statusCode: 200, data: stockChecking })
          .addMeta({ total, total_page })
          .return(res);
      } catch (err) {
        return next(err);
      }
    },
    async getStockChecking(req, res, next) {
      try {
        const modelDict = {
          store: 'product_storing',
          warehouse: 'warehouse_storing',
          mall: 'mall_storing'
        };
        let {
          company: { id: company_id, is_owner, ...company },
          query: {
            newest_first,
            limit,
            page,
            created_from,
            created_to,
            warehouse_id,
            store_id,
            ...query
          }
        } = req;
        Object.assign(
          query,
          getDateRangeQuery('createdAt', { fromDate: created_from, toDate: created_to })
        );
        query.company_id = company_id;
        const trackingPlace = query.tracking_place;
        if (!is_owner) {
          query[`${trackingPlace}_id`] = company[`${trackingPlace}_id`];
        } else if (store_id || warehouse_id) {
          query[`${trackingPlace}_id`] = req.query[`${trackingPlace}_id`];
        }
        // if (!query[`${trackingPlace}_id`]) {
        //   throw new BaseError({
        //     statusCode: 400,
        //     error: errorCode.client,
        //     errors: { [`${trackingPlace}_id`]: errorCode['any.required'] }
        //   });
        // }

        // To ObjectId (if any) for aggregation
        query = toObjectId(query);
        const onModel = modelDict[trackingPlace];
        const [stockChecking, total] = await Promise.all([
          productStockTrackingService
            .aggregate()
            .match(query)
            .sort({ createdAt: 1 })
            .group({
              _id: `$${onModel}_id`,
              first_record: { $first: '$$ROOT' },
              last_record: { $last: '$$ROOT' },
              records: { $push: '$$ROOT' }
            })
            .lookup({
              from: `s_${onModel}s`,
              localField: '_id',
              foreignField: '_id',
              as: `${onModel}`
            })
            .lookup({
              from: `s_${trackingPlace}s`,
              localField: `${onModel}.${trackingPlace}_id`,
              foreignField: '_id',
              as: `${trackingPlace}`
            })
            .lookup({
              from: `s_products`,
              localField: `first_record.product_id`,
              foreignField: '_id',
              as: 'product'
            })
            .addFields({
              product: { $arrayElemAt: ['$product', 0] },
              [`${onModel}`]: { $arrayElemAt: [`$${onModel}`, 0] },
              import_records: {
                $filter: {
                  input: '$records',
                  as: 'record',
                  cond: {
                    $and: [
                      { $in: ['$$record.type', ['import', 'local_export', 'edit']] },
                      {
                        $gte: [
                          {
                            $subtract: ['$$record.batch_stock', '$$record.prev.batch_stock']
                          },
                          0
                        ]
                      }
                    ]
                  }
                }
              },
              export_records: {
                $filter: {
                  input: '$records',
                  as: 'record',
                  cond: {
                    $and: [
                      { $in: ['$$record.type', ['export', 'local_export', 'edit']] },
                      {
                        $gte: [
                          {
                            $subtract: ['$$record.prev.batch_stock', '$$record.batch_stock']
                          },
                          0
                        ]
                      }
                    ]
                  }
                }
              }
            })
            .sort({ 'last_record.createdAt': newest_first ? -1 : 1 })
            .project({
              product: 1,
              [`${onModel}`]: 1,
              [`${trackingPlace}`]: { $arrayElemAt: [`$${trackingPlace}`, 0] },
              start_term_stock: '$first_record.prev.batch_stock',
              end_term_stock: '$last_record.batch_stock',
              total_import: {
                $subtract: [
                  { $sum: '$import_records.batch_stock' },
                  { $sum: '$import_records.prev.batch_stock' }
                ]
              },
              total_export: {
                $subtract: [
                  { $sum: '$export_records.prev.batch_stock' },
                  { $sum: '$export_records.batch_stock' }
                ]
              }
            })
            // .sort({ 'product.createdAt': newest_first ? -1 : 1 })
            .skip((page - 1) * limit)
            .limit(limit),
          productStockTrackingService
            .find(query)
            .distinct(`${onModel}_id`)
            .then((re) => (re || []).length)
        ]);
        const total_page = Math.ceil(total / limit);

        // Remove unnecessary fields
        if (stockChecking.length) {
          stockChecking.forEach((item) => {
            item.product = pick(item.product, [
              '_id',
              'id',
              'name',
              'price',
              'images',
              'thumbnail',
              'SKU',
              'unit',
              'createdAt',
              'updatedAt'
            ]);
            item[onModel] = pick(item[onModel], [
              '_id',
              'id',
              'stock',
              'on_sales_stock',
              'batch_stock',
              'price',
              'SKU',
              'unit',
              'store_id',
              'warehouse_id'
            ]);
            item[trackingPlace] = pick(item[trackingPlace], ['_id', 'id', 'name']);
          });
        }

        return new BaseResponse({ statusCode: 200, data: stockChecking })
          .addMeta({ total, total_page })
          .return(res);
      } catch (err) {
        return next(err);
      }
    },
    async getOnSalesChecking(req, res, next) {
      try {
        const modelDict = {
          store: 'product_storing',
          warehouse: 'warehouse_storing',
          mall: 'mall_storing'
        };
        let {
          company: { id: company_id, is_owner, ...company },
          query: {
            newest_first,
            limit,
            page,
            created_from,
            created_to,
            warehouse_id,
            store_id,
            ...query
          }
        } = req;
        Object.assign(
          query,
          getDateRangeQuery('createdAt', { fromDate: created_from, toDate: created_to })
        );
        query.company_id = company_id;
        const trackingPlace = query.tracking_place;

        if (!is_owner) {
          query[`${trackingPlace}_id`] = company[`${trackingPlace}_id`];
        } else if (store_id) {
          query[`${trackingPlace}_id`] = req.query[`${trackingPlace}_id`];
        }

        // To ObjectId (if any) for aggregation
        query = toObjectId(query);
        const onModel = modelDict[trackingPlace];
        const [stockChecking, total] = await Promise.all([
          productStockTrackingService
            .aggregate()
            .match(query)
            .sort({ createdAt: 1 })
            .group({
              _id: `$${onModel}_id`,
              first_record: { $first: '$$ROOT' },
              last_record: { $last: '$$ROOT' },
              records: { $push: '$$ROOT' }
            })
            .lookup({
              from: `s_${onModel}s`,
              localField: '_id',
              foreignField: '_id',
              as: `${onModel}`
            })
            .lookup({
              from: `s_${trackingPlace}s`,
              localField: `${onModel}.${trackingPlace}_id`,
              foreignField: '_id',
              as: `${trackingPlace}`
            })
            .lookup({
              from: `s_products`,
              localField: `first_record.product_id`,
              foreignField: '_id',
              as: 'product'
            })
            .addFields({
              product: { $arrayElemAt: ['$product', 0] },
              [`${onModel}`]: { $arrayElemAt: [`$${onModel}`, 0] },
              import_records: {
                $filter: {
                  input: '$records',
                  as: 'record',
                  cond: {
                    $and: [
                      { $in: ['$$record.type', ['import', 'local_export', 'edit']] },
                      {
                        $gte: [
                          {
                            $subtract: ['$$record.on_sales_stock', '$$record.prev.on_sales_stock']
                          },
                          0
                        ]
                      }
                    ]
                  }
                }
              },
              export_records: {
                $filter: {
                  input: '$records',
                  as: 'record',
                  cond: {
                    $and: [
                      { $in: ['$$record.type', ['export', 'local_import', 'edit', 'sell']] },
                      {
                        $gte: [
                          {
                            $subtract: ['$$record.prev.on_sales_stock', '$$record.on_sales_stock']
                          },
                          0
                        ]
                      }
                    ]
                  }
                }
              }
            })
            .sort({ 'last_record.createdAt': newest_first ? -1 : 1 })
            .project({
              product: 1,
              [`${onModel}`]: 1,
              [`${trackingPlace}`]: { $arrayElemAt: [`$${trackingPlace}`, 0] },
              start_term_stock: '$first_record.prev.on_sales_stock',
              end_term_stock: '$last_record.on_sales_stock',
              total_import: {
                $subtract: [
                  { $sum: '$import_records.on_sales_stock' },
                  { $sum: '$import_records.prev.on_sales_stock' }
                ]
              },
              total_export: {
                $subtract: [
                  { $sum: '$export_records.prev.on_sales_stock' },
                  { $sum: '$export_records.on_sales_stock' }
                ]
              }
            })
            .sort({ 'product.createdAt': newest_first ? -1 : 1 })
            .skip((page - 1) * limit)
            .limit(limit),
          productStockTrackingService
            .find(query)
            .distinct(`${onModel}_id`)
            .then((re) => (re || []).length)
        ]);
        const total_page = Math.ceil(total / limit);

        // Remove unnecessary fields
        if (stockChecking.length) {
          stockChecking.forEach((item) => {
            item.product = pick(item.product, [
              '_id',
              'id',
              'name',
              'price',
              'images',
              'thumbnail',
              'SKU',
              'unit',
              'createdAt',
              'updatedAt'
            ]);
            item[onModel] = pick(item[onModel], [
              '_id',
              'id',
              'stock',
              'on_sales_stock',
              'batch_stock',
              'price',
              'SKU',
              'unit',
              'store_id',
              'warehouse_id'
            ]);
            item[trackingPlace] = pick(item[trackingPlace], ['_id', 'id', 'name']);
          });
        }

        return new BaseResponse({ statusCode: 200, data: stockChecking })
          .addMeta({ total, total_page })
          .return(res);
      } catch (err) {
        return next(err);
      }
    },
    async getOnSalesCheckingForOneProduct(req, res, next) {
      try {
        const modelDict = {
          store: 'product_storing',
          mall: 'mall_storing'
        };
        let {
          company: { id: company_id, is_owner, ...company },
          query: {
            limit,
            page,
            created_from,
            created_to,
            date_order,
            warehouse_id,
            store_id,
            ...query
          }
        } = req;
        Object.assign(
          query,
          getDateRangeQuery('createdAt', { fromDate: created_from, toDate: created_to })
        );
        query.company_id = company_id;
        const trackingPlace = query.tracking_place;
        if (!is_owner) {
          query[`${trackingPlace}_id`] = company[`${trackingPlace}_id`];
        } else {
          query[`${trackingPlace}_id`] = req.query[`${trackingPlace}_id`];
        }
        if (!query[`${trackingPlace}_id`]) {
          throw new BaseError({
            statusCode: 400,
            error: errorCode.client,
            errors: { [`${trackingPlace}_id`]: errorCode['any.required'] }
          });
        }

        // To ObjectId (if any) for aggregation
        query = toObjectId(query);
        const onModel = modelDict[trackingPlace];
        const [stockChecking, total] = await Promise.all([
          productStockTrackingService
            .aggregate()
            .match(query)
            .sort({ createdAt: date_order === 'increasing' ? 1 : -1 })
            .group({
              _id: `$tracking_date`,
              first_record: { $first: '$$ROOT' },
              last_record: { $last: '$$ROOT' },
              records: { $push: '$$ROOT' }
            })
            .lookup({
              from: `s_${onModel}s`,
              localField: `first_record.${onModel}_id`,
              foreignField: '_id',
              as: `${onModel}`
            })
            .lookup({
              from: `s_products`,
              localField: `first_record.product_id`,
              foreignField: '_id',
              as: 'product'
            })
            .addFields({
              date: '$_id',
              product: { $arrayElemAt: ['$product', 0] },
              [`${onModel}`]: { $arrayElemAt: [`$${onModel}`, 0] },
              import_records: {
                $filter: {
                  input: '$records',
                  as: 'record',
                  cond: {
                    $and: [
                      { $in: ['$$record.type', ['import', 'local_export', 'edit']] },
                      {
                        $gte: [
                          {
                            $subtract: ['$$record.on_sales_stock', '$$record.prev.on_sales_stock']
                          },
                          0
                        ]
                      }
                    ]
                  }
                }
              },
              export_records: {
                $filter: {
                  input: '$records',
                  as: 'record',
                  cond: {
                    $and: [
                      { $in: ['$$record.type', ['export', 'local_import', 'edit', 'sell']] },
                      {
                        $gte: [
                          {
                            $subtract: ['$$record.prev.on_sales_stock', '$$record.on_sales_stock']
                          },
                          0
                        ]
                      }
                    ]
                  }
                }
              }
            })
            .sort({ 'last_record.createdAt': date_order === 'increasing' ? 1 : -1 })
            .project({
              date: 1,
              product: 1,
              [`${onModel}`]: 1,
              start_term_stock: `$${
                date_order === 'increasing' ? 'first' : 'last'
              }_record.prev.on_sales_stock`,
              end_term_stock: `$${
                date_order === 'increasing' ? 'last' : 'first'
              }_record.on_sales_stock`,
              total_import: {
                $subtract: [
                  { $sum: '$import_records.on_sales_stock' },
                  { $sum: '$import_records.prev.on_sales_stock' }
                ]
              },
              total_export: {
                $subtract: [
                  { $sum: '$export_records.prev.on_sales_stock' },
                  { $sum: '$export_records.on_sales_stock' }
                ]
              }
            })
            .skip((page - 1) * limit)
            .limit(limit),
          productStockTrackingService
            .find(query)
            .distinct('tracking_date')
            .then((re) => (re || []).length)
        ]);
        const total_page = Math.ceil(total / limit);

        // Remove unnecessary fields
        if (stockChecking.length) {
          stockChecking.forEach((item) => {
            item.product = pick(item.product, [
              '_id',
              'id',
              'name',
              'price',
              'images',
              'thumbnail',
              'SKU',
              'unit'
            ]);
            item[onModel] = pick(item[onModel], [
              '_id',
              'id',
              'stock',
              'on_sales_stock',
              'batch_stock',
              'price',
              'SKU',
              'unit'
            ]);
          });
        }

        return new BaseResponse({ statusCode: 200, data: stockChecking })
          .addMeta({ total, total_page })
          .return(res);
      } catch (err) {
        return next(err);
      }
    }
  }
};
