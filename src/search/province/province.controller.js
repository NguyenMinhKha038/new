import provinceService from './province.service';
import { BaseResponse, mergeObject } from '../../commons/utils';

const provinceController = {
  async get(req, res, next) {
    try {
      const { type, parent_code } = req.query;
      const query = mergeObject({ type }, +type !== 1 && { parent_code });
      const data = await provinceService.find(query);
      return new BaseResponse({ statusCode: 200, data }).return(res);
    } catch (error) {
      next(error);
    }
  }
};

export default provinceController;
