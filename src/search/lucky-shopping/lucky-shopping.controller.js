import { Promise } from 'bluebird';
import { userService } from '../../commons/user';
import { BaseError, BaseResponse, errorCode, getDate, mergeObject } from '../../commons/utils';
import orderService from '../order/order.service';
import productStoringService from '../product-storing/product-storing.service';
import productService from '../product/product.service';
import luckyShoppingService from './lucky-shopping.service';
import adminActivityService from '../../commons/admin-activity/admin-activity.service';

export default {
  async get(req, res, next) {
    try {
      const { date, limit, page, select, sort } = req.query;
      const query = mergeObject({}, { date: getDate(new Date(date)) });
      let [luckyShopping, count] = await Promise.all([
        luckyShoppingService.find({
          limit,
          page,
          select,
          sort,
          populate: [{ path: 'products.product' }, { path: 'products.user' }],
          ...query
        }),
        limit && companyHistoryService.count(query)
      ]);
      const total_page = limit && Math.ceil(count / limit);
      return new BaseResponse({ statusCode: 200, data: luckyShopping })
        .addMeta({ total_page, total: count })
        .return(res);
    } catch (error) {
      next(error);
    }
  },
  admin: {
    async put(req, res, next) {
      try {
        const { _id, product_id, number_prizes, order_ids } = req.body;
        let [luckyShopping, orders, product] = await Promise.all([
          luckyShoppingService.findActive({ _id }),
          order_ids && orderService.find({ _id: order_ids, is_lucky: true, populate: 'user' }),
          productStoringService.findActive({ product_id, is_lucky: true })
        ]);
        const winners = orders.map((order) => ({
          winner_id: order.user._id,
          winner_name: order.user.name,
          winner_phone_number: order.user.phone.replace('+84', 0),
          order_id: order._id
        }));
        if (winners.length > luckyShopping.number_prizes)
          throw new BaseError({
            statusCode: 403,
            error: errorCode.client,
            errors: {
              number_prizes: errorCode['client.luckyShoppingWinnerExceed']
            }
          });
        if (luckyShopping.is_handled)
          throw new BaseError({
            statusCode: 403,
            error: errorCode.client,
            errors: { lucky_shopping: errorCode['client.luckyShoppingIsHandled'] }
          });
        const isExist = luckyShopping.products.find(
          (product) => product.product_id.toString() === product_id
        );
        if (!isExist) {
          luckyShopping.products.push({
            product_id,
            winners,
            number_prizes,
            number_assignees: winners.length
          });
        } else {
          isExist.winners = winners;
          isExist.number_assignees = winners.length;
          number_prizes && (isExist.number_prizes = number_prizes);
        }
        await luckyShopping.save();

        // Create admin activity
        adminActivityService.create({
          admin_id: req.admin.id,
          on_model: 's_lucky_shopping',
          object_id: luckyShopping._id,
          updated_fields: ['products'],
          type: 'update',
          snapshot: luckyShopping,
          resource: req.originalUrl
        });

        return new BaseResponse({ statusCode: 200, data: luckyShopping }).return(res);
      } catch (error) {
        next(error);
      }
    },
    async setDate(req, res, next) {
      try {
        const { date, product_ids } = req.body;
        const sale_date = getDate(new Date(date));
        const products = await productService.find({ is_lucky: true, status: 'approved' });
        await Promise.map(products, async (product) => {
          const SaleDateIndex = product.sale_dates.findIndex(
            (date) => date.getTime() === sale_date.getTime()
          );
          if (product_ids.includes(product.id))
            SaleDateIndex < 0 && product.sale_dates.push(sale_date);
          else SaleDateIndex >= 0 && product.sale_dates.splice(SaleDateIndex, 1);
          if (product.is_on_sale)
            throw new BaseError({
              statusCode: 400,
              error: errorCode.client,
              errors: {
                sale_date: errorCode['client.cannotChangeProductOnSale']
              }
            });
          return product.save();
        });

        // Create admin activities
        const actData = products.map(product => ({
          admin_id: req.admin.id,
          on_model: 's_product',
          object_id: product._id,
          updated_fields: ['sale_dates'],
          type: 'update',
          snapshot: product,
          resource: req.originalUrl

        }));
        adminActivityService.createMulti(actData);

        return new BaseResponse({ statusCode: 200, data: products }).return(res);
      } catch (error) {
        next(error);
      }
    },
    async statisticsDate(req, res, next) {
      try {
        const { date } = req.query;
        const products = await productService.find({
          is_lucky: true,
          sale_dates: getDate(new Date(date))
        });
        const orders = await orderService.aggregate({
          pipeline: [
            {
              $match: { date: getDate(), is_lucky: true }
            },
            {
              $group: {
                _id: '$user_id',
                user_id: { $first: '$user_id' },
                total: { $sum: 1 }
              }
            },
            {
              $lookup: {
                from: 'users',
                localField: 'user_id',
                foreignField: '_id',
                as: 'user'
              }
            },
            { $unwind: '$user' },
            {
              $project: {
                user_id: 1,
                total: 1,
                'user.name': 1,
                'user.phone': true,
                'user.avatar': true,
                'user.wallet': true
              }
            }
          ]
        });
        return new BaseResponse({ statusCode: 200, data: orders })
          .addMeta({ products })
          .return(res);
      } catch (error) {
        next(error);
      }
    }
  }
};
