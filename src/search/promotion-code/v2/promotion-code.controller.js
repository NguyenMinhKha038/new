const { promotionCodeServiceV2 } = require('./promotion-code.service');
const { BaseResponse } = require('../../../commons/utils');

const autoGet = async (req, res, next) => {
  try {
    const response = await promotionCodeServiceV2.autoGetV2({
      company_id: req.company._id,
      ...req.validate
    });
    return res.send(new BaseResponse({ statusCode: 200, data: response }));
  } catch (err) {
    return next(err);
  }
};
export const promotionCodeControllerV2 = { autoGet };
