import followingService from './following.service';
import { BaseResponse } from '../../commons/utils';
import behaviorService from '../behavior/behavior.service';
import { Types as BehaviorTypes } from '../behavior/behavior.config';
import companyService from '../company/company.service';

export default {
  async get(req, res, next) {
    try {
      const { limit, page, select, sort } = req.query;
      const [followings, count] = await Promise.all([
        followingService.find({
          limit,
          page,
          select,
          sort,
          user_id: req.user.id
        }),
        limit && followingService.count({ user_id: req.user.id })
      ]);
      const total_page = limit && Math.ceil(count / limit);
      return new BaseResponse({ statusCode: 200, data: followings })
        .addMeta({ total_page, total: count })
        .return(res);
    } catch (error) {
      next(error);
    }
  },
  async post(req, res, next) {
    try {
      const { company_id } = req.body;
      const { value: newFollowing, lastErrorObject } = await followingService.update(
        req.user.id,
        company_id
      );
      //* behavior
      behaviorService.createReactionBehavior({
        user_id: req.user.id,
        company_id,
        type: BehaviorTypes.Reaction.Follow_Company,
        on_model: 's_following',
        reaction_id: newFollowing._id
      });
      //* change count
      if (!lastErrorObject.updatedExisting)
        companyService.changeCount(company_id, { follows_count: 1 });

      return new BaseResponse({ statusCode: 200, data: newFollowing }).return(res);
    } catch (error) {
      next(error);
    }
  },
  async delete(req, res, next) {
    try {
      const { company_id } = req.query;
      const newFollowing = await followingService.delete(req.user.id, company_id);

      //* change count
      companyService.changeCount(company_id, { follows_count: -1 });
      return new BaseResponse({ statusCode: 200, data: newFollowing }).return(res);
    } catch (error) {
      next(error);
    }
  }
};
