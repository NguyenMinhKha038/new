import { userService } from '../../commons/user';
import commentService from './comment.service';
import { BaseResponse, errorCode, BaseError, mergeObject, logger } from '../../commons/utils';
import productService from '../product/product.service';
import companyService from '../company/company.service';
import behaviorService from '../behavior/behavior.service';
import permissionGroupService from '../permission-group/permission-group.service';
import adminActivityService from '../../commons/admin-activity/admin-activity.service';
import { Types as BehaviorTypes } from '../behavior/behavior.config';
const ReactionTypes = BehaviorTypes.Reaction;

export default {
  user: {
    async getPersonal(req, res, next) {
      try {
        const { limit, page, select, sort } = req.query;
        const [comment, count] = await Promise.all([
          commentService.findPersonal({
            user_id: req.user.id,
            limit,
            page,
            select,
            sort
          }),
          limit && commentService.count({ user_id: req.user.id })
        ]);
        const total_page = limit && Math.ceil(count / limit);
        return new BaseResponse({ statusCode: 200, data: comment })
          .addMeta({ total_page, total: count })
          .return(res);
      } catch (error) {
        next(error);
      }
    },
    async postComment(req, res, next) {
      try {
        const { id: user_id, name: user_name, avatar: user_avatar } = req.user;
        const { content, images, product_id, company_id } = req.body;
        const [product, userPermission, productReaction, isCommented] = await Promise.all([
          productService.findActive({ _id: product_id }),
          permissionGroupService.findOneActive({ user_id, company_id }),
          productService.findOneReaction({ user_id, product_id }),
          commentService.findOne({ user_id, company_id, product_id, type: 'comment' })
        ]);
        logger.info('postComment: %o', { userPermission, isCommented });
        // Check commenter_type
        const commenter_type =
          userPermission && (userPermission.is_owner || userPermission.type.includes('typist'))
            ? 'company'
            : 'user';

        // Check if product is of company
        if (product.company_id.toString() !== company_id)
          throw new BaseError({
            statusCode: 400,
            error: errorCode.client,
            errors: { company_id: errorCode['client.commentCompanyNotMatch'] }
          });
        // Check if user bought product (if commenter_type is not company)
        if (!productReaction.can_comment && commenter_type === 'user')
          throw new BaseError({
            statusCode: 403,
            error: errorCode.client,
            errors: { can_comment: errorCode['client.mustBuyProductFirst'] }
          });
        // Check if user commented
        if (commenter_type === 'user' && isCommented) {
          throw new BaseError({
            statusCode: 400,
            error: errorCode.client,
            errors: { can_comment: errorCode['client.commentExceedLimit'] }
          });
        }

        // Create new comment
        const newComment = await commentService.create({
          content,
          images,
          user_id,
          user_name,
          product_id,
          company_id,
          user_avatar,
          type: 'comment',
          commenter_type
        });

        //* handle count
        productService.changeCount(product_id, { comments_count: 1 });
        companyService.changeCount(company_id, { comments_count: 1 });

        // Create user behavior --
        behaviorService.createReactionBehavior({
          user_id,
          type: ReactionTypes.Comment,
          reaction_id: newComment._id,
          on_model: newComment.constructor.modelName,
          company_id,
          product_id
        });
        // --

        return new BaseResponse({ statusCode: 201, data: newComment }).return(res);
      } catch (error) {
        next(error);
      }
    },
    async postReply(req, res, next) {
      try {
        const { id: user_id, name: user_name, avatar: user_avatar } = req.user;
        const { content, product_id, comment_id, company_id } = req.body;
        const [product, userPermission, comment] = await Promise.all([
          productService.findActive({ _id: product_id }),
          permissionGroupService.findOneActive({ user_id, company_id }),
          commentService.findActive(comment_id)
        ]);

        // logger.info('postComent: %o', { userPermission });
        // Check commenter_type
        const commenter_type =
          userPermission && (userPermission.is_owner || userPermission.type.includes('typist'))
            ? 'company'
            : 'user';

        // Check if product_id to reply matchs with product_id in comment
        if (product._id.toString() !== comment.product_id.toString())
          throw new BaseError({
            statusCode: 400,
            error: errorCode.client,
            errors: {
              comment_id: errorCode['client.commentAndProductNotMatch']
            }
          });
        // Check if product is not of company
        if (product.company_id.toString() !== company_id)
          throw new BaseError({
            statusCode: 400,
            error: errorCode.client,
            errors: { company_id: errorCode['client.commentCompanyNotMatch'] }
          });

        // Check if user reply on another comment
        if (commenter_type === 'user' && comment.user_id.toString() !== user_id) {
          throw new BaseError({
            statusCode: 401,
            error: errorCode.client,
            errors: { can_comment: errorCode['permission.notAllow'] }
          });
        }

        // Create new reply
        const newComment = await commentService.create({
          content,
          user_id,
          user_name,
          product_id,
          company_id,
          user_avatar,
          type: 'reply',
          parent_comment_id: comment_id,
          commenter_type
        });

        //* handle count
        commentService.changeReplyCount(comment_id, 1);
        productService.changeCount(product_id, { comments_count: 1 });
        companyService.changeCount(company_id, { comments_count: 1 });

        // Create user behavior --
        behaviorService.createReactionBehavior({
          user_id,
          type: ReactionTypes.Comment,
          reaction_id: newComment._id,
          on_model: newComment.constructor.modelName,
          company_id,
          product_id
        });
        // --

        return new BaseResponse({ statusCode: 201, data: newComment }).return(res);
      } catch (error) {
        next(error);
      }
    },
    async put(req, res, next) {
      try {
        const user_id = req.user.id;
        const { content, id } = req.body;

        const comment = await commentService.findOneAndUpdate(
          {
            _id: id,
            user_id,
            status: { $nin: ['deleted', 'rejected'] }
          },
          {
            content
          }
        );
        if (!comment) {
          throw new BaseError({
            statusCode: 401,
            error: errorCode.authorization,
            errors: {
              permission: errorCode['permission.notAllow']
            }
          });
        }

        return new BaseResponse({ statusCode: 200, data: comment }).return(res);
      } catch (error) {
        next(error);
      }
    },
    async delete(req, res, next) {
      try {
        const { id } = req.params;
        const user_id = req.user.id;
        const comment = await commentService.delete(id, user_id);

        //* handle count
        if (comment.type === 'comment') {
          productService.changeCount(comment.product_id, {
            comments_count: -(comment.replies_count + 1)
          });
          companyService.changeCount(comment.company_id, {
            comments_count: -(comment.replies_count + 1)
          });
        } else {
          productService.changeCount(comment.product_id, {
            comments_count: -1
          });
          companyService.changeCount(comment.company_id, {
            comments_count: -1
          });
        }

        return new BaseResponse({ statusCode: 200, data: {} }).return(res);
      } catch (error) {
        next(error);
      }
    }
  },
  company: {
    async get(req, res, next) {
      try {
        const { limit, page, select, sort } = req.query;

        const [comments, count] = await Promise.all([
          commentService.find({
            company_id: req.company.id,
            limit,
            page,
            select,
            sort
          }),
          limit && commentService.count({ user_id: req.user.id })
        ]);
        const total_page = limit && Math.ceil(count / limit);
        return new BaseResponse({ statusCode: 200, data: comments })
          .addMeta({ total_page })
          .return(res);
      } catch (err) {
        next(err);
      }
    }
  },
  common: {
    async getReply(req, res, next) {
      try {
        const { comment_id } = req.params;
        const { limit, page, select, sort } = req.query;
        const status = { $nin: ['rejected', 'deleted'] };
        const [replies, count] = await Promise.all([
          commentService.findByParentCommentId({
            comment_id,
            status,
            limit,
            page,
            select,
            sort
          }),
          limit &&
            commentService.count({
              parent_comment_id: comment_id,
              status
            })
        ]);
        const total_page = limit && Math.ceil(count / limit);

        return new BaseResponse({ statusCode: 200, data: replies })
          .addMeta({ total_page, total: count })
          .return(res);
      } catch (error) {
        next(error);
      }
    },
    async getByProductId(req, res, next) {
      try {
        const { product_id } = req.params;
        const { limit, page, select, sort, show_reply } = req.query;
        const status = { $nin: ['rejected', 'deleted'] };
        const populate = show_reply
          ? {
              path: 'replies',
              match: { status }
            }
          : '';
        const [comments, count] = await Promise.all([
          commentService.findByProductId({
            product_id,
            limit,
            page,
            select,
            status,
            sort,
            type: 'comment',
            populate
          }),
          limit &&
            commentService.count({
              product_id,
              status,
              type: 'comment'
            })
        ]);
        const total_page = limit && Math.ceil(count / limit);
        return new BaseResponse({ statusCode: 200, data: comments })
          .addMeta({ total_page, total: count })
          .return(res);
      } catch (error) {
        next(error);
      }
    },
    async getById(req, res, next) {
      try {
        const { comment_id } = req.params;
        const { show_reply } = req.query;
        const status = { $nin: ['rejected', 'deleted'] };
        const populate = show_reply
          ? {
              path: 'replies',
              match: { status }
            }
          : '';
        const comment = await commentService.findActive(comment_id, populate);
        return new BaseResponse({ statusCode: 200, data: comment }).return(res);
      } catch (error) {
        next(error);
      }
    }
  },
  admin: {
    async get(req, res, next) {
      try {
        const {
          product_id,
          company_id,
          user_id,
          limit,
          page,
          select,
          status,
          sort,
          parent_comment_id,
          type
        } = req.query;
        const [products, count] = await Promise.all([
          commentService.find({
            product_id,
            company_id,
            user_id,
            limit,
            page,
            select,
            status,
            sort,
            parent_comment_id,
            type
          }),
          commentService.count({
            product_id,
            company_id,
            user_id,
            status,
            parent_comment_id,
            type
          })
        ]);
        const total_page = limit && Math.ceil(count / limit);
        return new BaseResponse({ statusCode: 200, data: products })
          .addMeta({ total_page, total: count })
          .return(res);
      } catch (error) {
        next(error);
      }
    },
    async approve(req, res, next) {
      try {
        const { status, content, id } = req.body;
        const comment = await commentService.findById(id, 'parent_comment_id');
        if (comment.status === 'deleted') {
          throw new BaseError({
            statusCode: 404,
            error: errorCode.client,
            errors: { comment: errorCode['client.commentIsDeleted'] }
          });
        }
        if (comment.type === 'comment') {
          status === 'rejected' &&
            comment.status !== 'rejected' &&
            (productService.changeCount(comment.product_id, {
              comments_count: -(comment.replies_count + 1)
            }),
            companyService.changeCount(comment.company_id, {
              comments_count: -(comment.replies_count + 1)
            }));
          status === 'approved' &&
            comment.status === 'rejected' &&
            (productService.changeCount(comment.product_id, {
              comments_count: comment.replies_count + 1
            }),
            companyService.changeCount(comment.company_id, {
              comments_count: comment.replies_count + 1
            }));
        } else {
          const isParentDisabled = comment.parent_comment_id.status === 'rejected';
          status === 'rejected' &&
            comment.status !== 'rejected' &&
            commentService.changeReplyCount(comment.parent_comment_id._id, -1) &&
            !isParentDisabled &&
            (productService.changeCount(comment.product_id, {
              comments_count: -1
            }),
            companyService.changeCount(comment.company_id, {
              comments_count: -1
            }));
          status === 'approved' &&
            comment.status === 'rejected' &&
            commentService.changeReplyCount(comment.parent_comment_id._id, 1) &&
            !isParentDisabled &&
            (productService.changeCount(comment.product_id, {
              comments_count: 1
            }),
            companyService.changeCount(comment.company_id, {
              comments_count: 1
            }));
        }
        mergeObject(comment, { status, content });
        await comment.save();

        // Create admin activity
        adminActivityService.create({
          admin_id: req.admin.id,
          on_model: 's_comment',
          object_id: comment._id,
          updated_fields: ['status', 'content'],
          type: 'update',
          snapshot: comment,
          resource: req.originalUrl
        });

        return new BaseResponse({ statusCode: 200, data: comment }).return(res);
      } catch (error) {
        next(error);
      }
    }
  }
};
