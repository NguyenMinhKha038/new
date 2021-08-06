import commentModel from './comment.model';
import { userService } from '../../commons/user';
import { Types } from 'mongoose';
import {
  BaseError,
  errorCode,
  mergeObject,
  findAdvanced,
  varAggregation,
  logger
} from '../../commons/utils';
import productService from '../product/product.service';

export default {
  async find({ limit, page, select, sort, populate, ...query }) {
    try {
      query = mergeObject({}, query);
      const comments = await findAdvanced(commentModel, {
        query,
        limit,
        select,
        page,
        sort,
        populate
      });
      return comments;
    } catch (error) {
      throw error;
    }
  },
  async findById(id, populate = '') {
    try {
      const comment = await commentModel.findById(id).populate(populate);
      if (!comment)
        throw new BaseError({
          statusCode: 400,
          error: errorCode.client,
          errors: { comment_id: errorCode['client.commentNotExist'] }
        });
      return comment;
    } catch (error) {
      throw error;
    }
  },
  async findActive(_id, populate) {
    const comment = await commentModel.findOne(
      {
        _id,
        status: { $nin: ['rejected', 'deleted'] }
      },
      null,
      { populate }
    );
    if (!comment)
      throw new BaseError({
        statusCode: 400,
        error: errorCode.client,
        errors: { comment_id: errorCode['client.commentNotExist'] }
      });
    return comment;
  },
  async findPersonal({ limit, page, select, sort, user_id }) {
    const data = await commentModel.aggregate([
      {
        $match: {
          user_id: Types.ObjectId(user_id),
          status: { $nin: ['rejected', 'deleted'] }
        }
      },
      {
        $lookup: {
          from: 's_products',
          localField: 'product_id',
          foreignField: '_id',
          as: 'product'
        }
      },
      { $unwind: '$product' },
      { $match: { 'product.status': 'approved' } },
      ...varAggregation({
        select: '-product.views -product.likes -product.dislikes -product.shares',
        limit,
        page,
        sort
      })
    ]);
    return data;
  },
  async findByParentCommentId({ comment_id, limit, page, select, sort, status }) {
    try {
      const query = { parent_comment_id: comment_id, status };
      const replies = await findAdvanced(commentModel, {
        query,
        limit,
        page,
        select,
        sort
      });
      return replies;
    } catch (error) {
      throw error;
    }
  },
  async findOne(query) {
    return await commentModel.findOne(query);
  },
  async findOneAndUpdate(query, data) {
    return await commentModel.findOneAndUpdate(query, data, { new: true });
  },
  async updateMany(query, data) {
    return await commentModel.updateMany(query, data, { new: true });
  },
  async findByUserId({ user_id, limit, page, select, status, sort }) {
    try {
      const query = mergeObject({ user_id }, { status });
      const [isValidUser, comments] = await Promise.all([
        userService.findActive(user_id),
        commentModel.aggregate([
          { $unwind: '$replies' },
          { $replaceRoot: { newRoot: '$replies' } },
          { $match: query },
          ...varAggregation({ select, limit, page, sort })
        ])
      ]);
      if (!comments)
        throw new BaseError({
          statusCode: 400,
          error: errorCode.client,
          errors: { comment_id: errorCode['client.commentNotExist'] }
        });
      return comments;
    } catch (error) {
      throw error;
    }
  },
  async findByProductId({ product_id, limit, page, select, status, type, sort, populate }) {
    try {
      const [isValidProductId, comments] = await Promise.all([
        productService.findById(product_id),
        this.find({
          product_id,
          limit,
          page,
          select,
          status,
          sort,
          type,
          populate
        })
      ]);
      if (!comments)
        throw new BaseError({
          statusCode: 400,
          error: errorCode.client,
          errors: { comment_id: errorCode['client.commentNotExist'] }
        });
      return comments;
    } catch (error) {
      throw error;
    }
  },
  async create(doc) {
    try {
      const newComment = await new commentModel(doc).save();
      return newComment;
    } catch (error) {
      throw error;
    }
  },
  async changeReplyCount(comment_id, change) {
    const comment = await this.findById(comment_id);
    comment.replies_count += change;
    await comment.save();
  },
  async remove(id) {
    try {
      const comment = await this.findById(id);
      if (comment.type === 'reply') return comment.remove();
      commentModel
        .find({ parent_comment_id: id })
        .then((replies) => replies.map((reply) => reply.remove()));
      comment.remove();
    } catch (error) {
      logger(error);
    }
  },
  async delete(id, user_id) {
    const comment = await this.findOne({
      _id: id,
      user_id,
      status: { $nin: ['deleted', 'rejected'] }
    });
    if (!comment) {
      throw new BaseError({
        statusCode: 401,
        error: errorCode.authorization,
        errors: {
          permission: errorCode['permission.notAllow']
        }
      });
    }

    if (comment.type === 'comment') {
      const updated = await this.updateMany(
        {
          parent_comment_id: id,
          status: { $nin: ['deleted', 'rejected'] }
        },
        { status: 'deleted' }
      );

      // comment.replies_count -= updated.nModified;
    } else {
      this.findOneAndUpdate(
        {
          _id: comment.parent_comment_id,
          status: { $nin: ['deleted', 'rejected'] }
        },
        { $inc: { replies_count: -1 } }
      );
    }
    comment.status = 'deleted';
    const deletedComment = comment.save();

    return deletedComment;
  },

  async count(query) {
    try {
      return await commentModel.countDocuments(query);
    } catch (err) {
      throw err;
    }
  }
};
