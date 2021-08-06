import globalPromotion from './global-promotion-code.service';
import { BaseResponse } from '../../../commons/utils';

export default {
  user: {
    async autoGet(req, res, next) {
      try {
        const { product_storing_id, global_promotion_code_id, apply_count } = req.body;
        const result = await globalPromotion.autoGet({
          product_storing_id,
          global_promotion_code_id,
          apply_count
        });
        return new BaseResponse({ statusCode: 200, data: result }).return(res);
      } catch (error) {
        return next(error);
      }
    }
  }
};
