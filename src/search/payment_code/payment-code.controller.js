import paymentCodeService from './payment-code.service';
import { BaseResponse } from '../../commons/utils';

export default {
  user: {
    async post(req, res, next) {
      try {
        const { id: user_id } = req.user;
        const code = await paymentCodeService.create(user_id);
        return new BaseResponse({ statusCode: 200, data: code }).return(res);
      } catch (error) {
        next(error);
      }
    }
  }
};
