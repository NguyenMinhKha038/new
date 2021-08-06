import { BaseResponse } from '../../commons/utils';
import userHistoryService from './user-history.service';
// import commentService from '../../video/comment/comment.service';

export default {
  admin: {
    async get(req, res, next) {
      try {
        let { limit, page, select, sort, start_time, end_time, ...query } = req.query;
        if (start_time && end_time) {
          start_time = start_time && new Date(start_time);
          end_time = end_time ? new Date(end_time) : new Date();
          query.createdAt = start_time && { $gt: start_time, $lt: end_time };
        }

        const populate = [
          { path: 'user_id', select: 'name' },
          { path: 'company_id', select: 'name' }
        ];
        if (query.type === 'transfer_sender' || query.type === 'transfer_receiver') {
          populate.push({
            path: 'transaction_id',
            populate: [
              { path: 'receiver_id', select: 'name avatar phone' },
              { path: 'sender_id', select: 'name avatar phone' }
            ]
          });
        } else {
          populate.push({ path: 'transaction_id' });
        }
        const [histories, count] = await Promise.all([
          userHistoryService.find({
            limit,
            page,
            select,
            sort,
            populate,
            ...query
          }),
          limit && userHistoryService.count(query)
        ]);
        const total_page = count ? Math.ceil(count / limit) : 1;
        return new BaseResponse({ statusCode: 200, data: histories })
          .addMeta({ total_page, total: count })
          .return(res);
      } catch (error) {
        next(error);
      }
    }
  },
  user: {
    async get(req, res, next) {
      try {
        const { limit, page, select, sort, start_time, end_time, ...query } = req.query;
        if (start_time || end_time) {
          query.createdAt = { $gt: start_time, $lt: end_time };
        }

        const populate = [
          {
            path: 'transaction_id',
            populate: [
              { path: 'receiver_id', select: 'name avatar phone' },
              { path: 'sender_id', select: 'name avatar phone' }
            ],
            select:
              '-sender_old_balance -sender_new_balance -receiver_new_balance -receiver_old_balance'
          }
        ];
        const [histories, count] = await Promise.all([
          userHistoryService.find({
            limit,
            page,
            select,
            sort,
            ...query,
            user_id: req.user.id,
            populate
          }),
          userHistoryService.count({ user_id: req.user.id, ...query })
        ]);
        const total_page = limit ? Math.ceil(count / limit) : 1;
        return new BaseResponse({ statusCode: 200, data: histories })
          .addMeta({ total_page, total: count })
          .return(res);
      } catch (error) {
        next(error);
      }
    }
  },
  company: {
    async get(req, res, next) {
      try {
        const { limit, page, select, sort, start_time, end_time, ...query } = req.query;
        const { id: company_id } = req.company_id;
        query.createdAt = { $gt: start_time, $lt: end_time };
        const [histories, count] = await Promise.all(
          [
            userHistoryService.find({
              limit,
              page,
              select,
              sort,
              ...query,
              company_id
            })
          ],
          limit && commentService.count({ company_id, ...query })
        );
        const total_page = limit && Math.ceil(count / limit);
        return new BaseResponse({ statusCode: 200, data: histories })
          .addMeta({ total_page, total: count })
          .return(res);
      } catch (error) {
        next(error);
      }
    }
  }
};
