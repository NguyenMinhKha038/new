import { BaseResponse } from '../../commons/utils';
import productStoringService from './product-storing.service';

export default {
  async get(req, res, next) {
    try {
      const { sort, page, select, limit, ...query } = req.query;
      let [productStorings, count] = await Promise.all([
        productStoringService.find({
          limit,
          page,
          select,
          sort,
          query: {
            ...query
          },
          populate: { path: 'product', select: 'name thumbnail' }
        }),
        limit &&
          productStoringService.count({
            ...query
          })
      ]);
      const total_page = limit && Math.ceil(count / limit);
      // productStorings = productStorings.filter(
      //   (productStoring) => !productStoring.is_limited_stock || productStoring.stock > 0
      // );
      return res.send(
        new BaseResponse({ statusCode: 200, data: productStorings }).addMeta({
          total_page,
          total: count
        })
      );
    } catch (error) {
      next(error);
    }
  }
};
