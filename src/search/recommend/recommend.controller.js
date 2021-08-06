import { BaseError, BaseResponse, errorCode, logger } from '../../commons/utils';
import recommendService from './recommend.service';
import { DefaultLimit, MaxLimit } from './recommend.config';

export default {
  async getRecommendedProducts(req, res, next) {
    try {
      const { limit = DefaultLimit, sort, select, ...product } = req.query;
      const { id: product_id } = product;
      const user = req.user;
      // logger.info('query: %o', req.query);
      // Get recommended products by product if product_id exists otherwise, get by user behavior
      const getFn = product_id ? 'getRecommendedProductsByProduct' : 'getRecommendedProductsByUser';
      const obj = product_id ? product : user;
      const { error, data } = await recommendService[getFn](obj, {
        limit: Math.min(limit, MaxLimit),
        sort,
        select
      });
      if (error) {
        logger.error('getRecommendedProducts error: %o', error);
        throw new BaseError({
          statusCode: 400,
          error: errorCode.client,
          errors: { products: errorCode['any.notAvailable'] }
        });
      }

      logger.info('products: %o', data);
      const products = data || [];
      return new BaseResponse({ statusCode: 200, data: products }).return(res);
    } catch (err) {
      next(err);
    }
  }
};
