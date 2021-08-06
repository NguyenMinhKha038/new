import mallModel from './mall.model';
import extendService from '../../../commons/utils/extend-service';
import { mergeObject, BaseError, errorCode } from '../../../commons/utils';
import { MallStatuses } from './mall.config';

export default {
  ...extendService(mallModel),
  async findEnsure({ select, options = {}, ...query }) {
    const mall = await mallModel.findOne(mergeObject({}, query), select, options);
    if (!mall) {
      throw new BaseError({
        statusCode: 400,
        error: errorCode.client,
        errors: {
          mall: errorCode['client.mallNotExists']
        }
      });
    }
    return mall;
  },
  async findOneActive(query, select, options) {
    return await mallModel.findOne(
      {
        ...query,
        status: MallStatuses.Active
      },
      select,
      options
    );
  }
};
