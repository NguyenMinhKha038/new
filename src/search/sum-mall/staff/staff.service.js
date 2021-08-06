import mallStaffModel from './staff.model';
import extendService from '../../../commons/utils/extend-service';
import { mergeObject, BaseError, errorCode } from '../../../commons/utils';
import { MallStaffStatuses } from './staff.config';

export default {
  ...extendService(mallStaffModel),
  async findEnsure({ select, options = {}, ...query }) {
    const result = await mallStaffModel.findOne(mergeObject({}, query), select, options);
    if (!result) {
      throw new BaseError({
        statusCode: 400,
        error: errorCode.client,
        errors: {
          staff: errorCode['client.staffNotExists']
        }
      });
    }
    return result;
  },
  findOneActive(query, select, options = {}) {
    return mallStaffModel.findOne({ ...query, status: MallStaffStatuses.Active }, select, options);
  }
};
