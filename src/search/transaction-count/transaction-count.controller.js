import transactionCountService from './transaction-count.service';
import { BaseResponse, getDate } from '../../commons/utils';

const userGet = async (req, res, next) => {
  try {
    const data = await transactionCountService.findOne({ user_id: req.user.id, date: getDate() });
    return res.send(new BaseResponse({ statusCode: 200, data }));
  } catch (error) {
    return next(error);
  }
};

const companyGet = async (req, res, next) => {
  try {
    const data = await transactionCountService.findOne({
      user_id: req.user.id,
      company_id: req.company._id,
      date: getDate()
    });
    return res.send(new BaseResponse({ statusCode: 200, data }));
  } catch (error) {
    return next(error);
  }
};

export default {
  userGet,
  companyGet
};
