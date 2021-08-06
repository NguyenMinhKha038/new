import Promise from 'bluebird';
import { userService } from '../../commons/user';
import {
  BaseError,
  BaseResponse,
  errorCode,
  getDate,
  mergeObject,
  logger,
  withSafety
} from '../../commons/utils';
import hashingCompare from '../../commons/utils/hashing-compare';
import bannerService from '../banner/banner.service';
import categoryService from '../category/category.service';
import notificationService from '../notification/notification.service';
import permissionGroupService from '../permission-group/permission-group.service';
import promotionCodeService from '../promotion-code/promotion-code.service';
import promotionService from '../promotion/promotion.service';
import revenueService from '../revenue/revenue.service';
import statisticService from '../statistic/statistic.service';
import companyService from './company.service';
import companyLimitService from './company-limit.service';
import adminActivityService from '../../commons/admin-activity/admin-activity.service';
import behaviorService from '../behavior/behavior.service';
import { Types as BehaviorTypes } from '../behavior/behavior.config';
import companyActivityService from '../company-activity/company-activity.service';
import { CompanyActions } from '../company-activity/company-activity.config';
const ReactionTypes = BehaviorTypes.Reaction;

// getDate

export default {
  async get(req, res, next) {
    try {
      const { limit, page, select, sort, ...query } = req.query;
      const [company, count] = await Promise.all([
        companyService.find({
          limit,
          page,
          select,
          sort,
          ...query,
          status: 'approved'
        }),
        limit && companyService.count({ ...query, status: 'approved' })
      ]);
      const total_page = limit && Math.ceil(count / limit);
      return new BaseResponse({ statusCode: 200, data: company })
        .addMeta({ total_page, total: count })
        .return(res);
    } catch (error) {
      next(error);
    }
  },
  async getById(req, res, next) {
    try {
      const { id } = req.params;
      const company = await companyService.findActive(id, null, {
        populate: [
          ...(req.user
            ? [
                {
                  path: 'reaction',
                  match: { user_id: req.user.id },
                  select:
                    'can_rate rate follow like share shares_count view views_count rate_value rate_message'
                }
              ]
            : [])
        ]
      });
      companyService.viewsUp({
        company,
        ip: req.headers['x-forwarded-for'],
        user: req.user
      });
      return new BaseResponse({ statusCode: 200, data: company }).return(res);
    } catch (error) {
      next(error);
    }
  },
  async getRate(req, res, next) {
    try {
      const { limit, page, select, sort, id } = req.query;
      const rates = await companyService.findReaction({
        query: { company_id: id, rate: true },
        limit,
        page,
        select: 'user_id user_name rate rate_value rate_message',
        sort,
        populate: 'company_id'
      });
      return new BaseResponse({ statusCode: 200, data: rates }).return(res);
    } catch (e) {
      next(e);
    }
  },
  company: {
    async getFollow(req, res, next) {
      try {
        const { limit, page, select, sort } = req.query;
        const { id: company_id } = req.company;
        const [follows, count] = await Promise.all([
          companyService.findReaction({
            query: { follow: true, company_id },
            limit,
            page,
            select: 'user_id user_name follow',
            sort
          }),
          limit && companyService.countReaction({ company_id, follow: true })
        ]);
        const total_page = limit && Math.ceil(count / limit);
        return new BaseResponse({ statusCode: 200, data: follows })
          .addMeta({ total_page, total: count })
          .return(res);
      } catch (e) {
        next(e);
      }
    },
    async getStastic(req, res, next) {
      try {
        const { id } = req.company;
        let { start_time, end_time } = req.query;

        start_time = start_time ? new Date(req.query.start_time) : getDate();
        end_time = req.query.end_time ? new Date(req.query.end_time) : new Date();

        let promotionPipeline = [
          {
            $match: {
              start_at: { $gte: start_time, $lte: end_time },
              company_id: id
            }
          },
          {
            $group: {
              _id: 'company_id',
              count: { $sum: 1 },
              totalPayment: { $sum: '$total_payment' }
            }
          }
        ];

        let bannerPipeline = [
          {
            $match: {
              start_time: { $gte: start_time, $lte: end_time },
              company_id: id
            }
          },
          {
            $group: {
              _id: 'company_id',
              count: { $sum: 1 },
              totalFee: { $sum: '$total_fee' }
            }
          }
        ];

        let revenuePipeline = [
          {
            $match: {
              date: { $gte: start_time, $lte: end_time },
              company_id: id
            }
          },
          {
            $group: {
              _id: 'company_id',
              total_refund: { $sum: '$total_refund' },
              total_discount: { $sum: '$total_discount' },
              total_buyer: { $sum: '$total_buyer' },
              total_banner_fee: { $sum: '$total_banner_fee' },
              total: { $sum: '$total' },
              total_pay: { $sum: '$total_pay' },
              total_service_fee: { $sum: '$total_service_fee' },
              total_deposit: { $sum: '$total_deposit' }
            }
          }
        ];

        // const promotionAgg = await promotionService.aggregate(promotionPipeline);

        const [promotion, totalPromotionCode, banner, revenue] = await Promise.all([
          promotionService.aggregate(promotionPipeline),
          promotionCodeService.count({
            company_id: id,
            createdAt: { $gte: start_time, $lte: end_time }
          }),
          bannerService.aggregate(bannerPipeline),
          revenueService.aggregate(revenuePipeline)
        ]);

        return res.send(
          new BaseResponse({
            statusCode: 200,
            data: { promotion, totalPromotionCode, banner, revenue }
          })
        );
      } catch (err) {
        return next(err);
      }
    },
    async deposit(req, res, next) {
      try {
        const { amount } = req.body;
        const { id: company_id } = req.company_id;
        const { id: user_id, wallet } = req.user_id;
        if (wallet.total <= amount)
          return new BaseError({
            statusCode: 400,
            error: errorCode.client,
            errors: {
              money: errorCode['client.MoneyNotEnough']
            }
          });
        companyService.transact(
          companyService.updateWallet({ _id: company_id }, { wallet: amount }),
          userService.updateWallet(userService, {
            'wallet.total': -amount
          })
        );
      } catch (error) {
        next(error);
      }
    },
    async put(req, res, next) {
      try {
        const updateCompany = req.body;
        const { id, status } = req.company;
        const [isExistCompany] = await Promise.all([
          (updateCompany.name || updateCompany.tax_code) &&
            companyService.findOne({
              $or: [{ name: updateCompany.name }, { tax_code: updateCompany.tax_code }],
              status: 'approved',
              _id: { $ne: id }
            })
        ]);
        if (isExistCompany) {
          throw new BaseError({
            statusCode: 400,
            error: errorCode.client,
            errors: { company: errorCode['client.companyIsExist'] }
          });
        }
        if (status === 'rejected' && updateCompany.status && updateCompany.status !== 'rejected') {
          throw new BaseError({
            statusCode: 401,
            error: errorCode.authorization,
            errors: { rejected: errorCode['autho.notMatch'] }
          });
        }
        const company = await companyService.update(id, updateCompany);
        withSafety(() => {
          companyActivityService.implicitCreate(CompanyActions.updateCompanyInfo)(req, {
            object_id: id
          });
        });
        return new BaseResponse({ statusCode: 200, data: company }).return(res);
      } catch (error) {
        next(error);
      }
    },
    async upload(req, res, next) {
      try {
        const images = req.files && req.files.map((file) => file.path);
        return new BaseResponse({ statusCode: 200, data: images }).return(res);
      } catch (error) {
        next(error);
      }
    },
    async updatePin(req, res, next) {
      try {
        let { new_code, old_code, password } = req.body;

        let [company, user] = await Promise.all([
          companyService.findByUserId(req.user.id, '+pin'),
          userService.findById(req.user.id)
        ]);

        if (!company) {
          return next(
            new BaseError({
              statusCode: 400,
              error: errorCode.client,
              errors: { company: errorCode['client.companyNotExist'] }
            }).addMeta({ message: 'company is not existed' })
          );
        }
        if (!user) {
          return next(
            new BaseError({
              statusCode: 400,
              error: errorCode.client,
              errors: { user: errorCode['client.userNotFound'] }
            }).addMeta({ message: 'user is not exitsed' })
          );
        }

        const passChecker = await hashingCompare.compareHashCode(password, user.password);
        if (!passChecker) {
          return next(
            new BaseError({
              statusCode: 400,
              error: errorCode.authorization,
              errors: { password: errorCode['autho.notMatch'] }
            }).addMeta({ message: 'wrong password' })
          );
        }
        if (company.pin) {
          const companyPinChecker = await hashingCompare.compareHashCode(old_code, company.pin);
          if (!companyPinChecker) {
            return next(
              new BaseError({
                statusCode: 400,
                error: errorCode.authorization,
                errors: { old_code: errorCode['company.wrongpin'] }
              }).addMeta({ message: 'wrong pin' })
            );
          }
        }

        if ((company.pin || company.active_pin) && new_code === old_code) {
          return next(
            new BaseError({
              statusCode: 400,
              error: errorCode.client,
              errors: { new_code: errorCode['client.PinDuplicate'] }
            }).addMeta({ message: 'new code is duplicate with old code' })
          );
        } else {
          let pin = await hashingCompare.hashing(new_code);
          company.pin = pin;
          company.active_pin = true;
          await company.save();
          withSafety(() => {
            companyActivityService.implicitCreate(CompanyActions.updatePin)(
              req,
              { object_id: company._id },
              { isExcludeData: true }
            );
          });
          return res.send(
            new BaseResponse({
              statusCode: 200,
              data: { _id: company._id, active_pin: company.active_pin }
            })
          );
        }
      } catch (err) {
        return next(err);
      }
    },
    async authPin(req, res, next) {
      const { pin } = req.body;
      const company = await companyService.findByUserId(req.user.id, '+pin');
      if (!company) {
        return next(
          new BaseError({
            statusCode: 400,
            error: errorCode.client,
            errors: { user: errorCode['client.companyNotExist'] }
          }).addMeta({ message: 'company is not existed' })
        );
      }
      const checker = await hashingCompare.compareHashCode(pin, company.pin);
      if (!checker) {
        return next(
          new BaseError({
            statusCode: 400,
            error: errorCode.client,
            errors: { pin: errorCode['client.wrongPIN'] }
          }).addMeta({ message: 'wrong pin' })
        );
      }
      return res.send(new BaseResponse({ statusCode: 200 }));
    },
    async resetPin(req, res, next) {
      const { password, new_code } = req.body;
      const user = await userService.findByIdRaw(req.user._id);
      const checker = await hashingCompare.compareHashCode(password, user.password);
      if (!checker) {
        return next(
          new BaseError({
            statusCode: 400,
            error: errorCode.authorization,
            errors: { password: errorCode['autho.notMatch'] }
          }).addMeta({ message: 'wrong password' })
        );
      }
      const pin = await hashingCompare.hashing(new_code);
      await companyService.update(req.company._id, { pin });
      withSafety(() => {
        companyActivityService.implicitCreate(CompanyActions.resetPin)(
          req,
          { object_id: req.company._id },
          { isExcludeData: true }
        );
      });
      return res.send(new BaseResponse({ statusCode: 200 }));
    }
  },
  user: {
    async startChatWithCompany(req, res, next) {
      const { id } = req.body;
      try {
        const company = await companyService.findById(id);
        if (!company) {
          return new BaseError({ statusCode: 400 }).return(res);
        }

        if (company.chat_username && company.chat_password) {
          return new BaseResponse({ statusCode: 200 }).return(res);
        }
        await companyService.createChatUser(company);
        return new BaseResponse({ statusCode: 200 }).return(res);
      } catch (err) {
        next(err);
      }
    },
    async get(req, res, next) {
      try {
        const { id: user_id } = req.user;
        const permissionGroup = await permissionGroupService.findOne({ user_id, status: 'active' });
        // const total_promotion_code = await promotionCodeService.count({ company_id });
        console.log('permissionGroup', permissionGroup);
        const company =
          permissionGroup &&
          (await companyService.findOne(
            { _id: permissionGroup.company_id },
            '+refund_fund +wallet +total_refund +total_discount +total_pay +total_product +total_order +total_staff +total_revenue'
          ));
        let chatUser;
        if (company && (!company.chat_username || !company.chat_password)) {
          try {
            chatUser = await companyService.createChatUser(company);
          } catch (error) {
            logger.error(error);
          }
        }
        return new BaseResponse({
          statusCode: 200,
          data: company ? { ...company.toObject(), ...chatUser } : null
        }).return(res);
      } catch (error) {
        next(error);
      }
    },
    async post(req, res, next) {
      try {
        const newCompany = req.body;
        const { id: user_id, is_lucky } = req.user;
        // * handle luckyshopping
        const [user, isValid, category, isExistCompany] = await Promise.all([
          userService.findOne({ _id: user_id, verify: true }),
          companyService.isExistCompany(user_id),
          categoryService.findActive(newCompany.category_id, 2),
          companyService.findOne({
            $or: [{ name: newCompany.name }, { tax_code: newCompany.tax_code }],
            status: 'approved'
          })
        ]);
        if (isExistCompany) {
          throw new BaseError({
            statusCode: 400,
            error: errorCode.client,
            errors: { company: errorCode['client.companyIsExist'] }
          });
        }
        if (!user)
          throw new BaseError({
            statusCode: 403,
            error: errorCode.client,
            errors: { user: errorCode['client.userNotActive'] }
          });
        const company = await companyService.create({
          ...newCompany,
          user_id,
          type_category_id: category.parent_id,
          // * Is Lucky
          ...(is_lucky ? { is_lucky, status: 'approved', online_sales: true } : {})
        });
        const staff = await permissionGroupService.findOne({ user_id: company.user_id });
        if (staff) {
          staff.type = undefined;
          staff.store_id = undefined;
          staff.is_owner = true;
          staff.company_id = company._id;
          staff.status = 'active';
          await staff.save();
        } else {
          await permissionGroupService.create({
            user_id: company.user_id,
            company_id: company._id,
            is_owner: true
          });
        }

        return new BaseResponse({ statusCode: 200, data: company }).return(res);
      } catch (error) {
        next(error);
      }
    },
    async follow(req, res, next) {
      try {
        const { id: user_id, name: user_name } = req.user;
        const { id: company_id, state } = req.body;
        let company = await companyService.findActive(
          company_id,
          'follows_count type_category_id category_id'
        );
        const { category_id, type_category_id } = company;
        const companyReaction = await companyService.findOneReaction(
          { user_id, company_id },
          { user_name }
        );
        const isExistFollow = companyReaction.follow;
        if (state === 'follow') {
          !isExistFollow &&
            (company = companyService.changeCount(company_id, {
              follows_count: 1
            }));
          companyReaction.follow = true;
        } else {
          isExistFollow &&
            (company = companyService.changeCount(company_id, {
              follows_count: -1
            }));
          companyReaction.follow = false;
        }
        companyReaction.save();

        // Create user behavior --
        behaviorService.createReactionBehavior({
          user_id,
          type: state === 'follow' ? ReactionTypes.Follow_Company : ReactionTypes.Unfollow_Company,
          company_id,
          reaction_id: companyReaction._id,
          on_model: 's_company_reaction'
        });
        // --

        return new BaseResponse({
          statusCode: 200,
          data: await company
        }).return(res);
      } catch (error) {
        next(error);
      }
    },
    async getFollow(req, res, next) {
      try {
        const { id: user_id } = req.user;
        const { limit, page, select, sort } = req.query;
        const follows = await companyService.findReaction({
          query: { user_id, follow: true },
          limit,
          page,
          select: 'user_id user_name company_id follow',
          sort,
          populate: 'company_id'
        });
        return new BaseResponse({ statusCode: 200, data: follows }).return(res);
      } catch (e) {
        next(e);
      }
    },
    async getView(req, res, next) {
      try {
        const { id: user_id } = req.user;
        const { limit, page, select, sort } = req.query;
        const [views, count] = await Promise.all([
          companyService.findReaction({
            query: { user_id, view: true },
            limit,
            page,
            select: 'user_id user_name company_id view',
            sort,
            populate: 'company_id'
          }),
          limit && companyService.countReaction({ user_id, view: true })
        ]);
        const total_page = limit && Math.ceil(count / limit);
        return new BaseResponse({ statusCode: 200, data: views })
          .addMeta({ total_page, total: count })
          .return(res);
      } catch (e) {
        next(e);
      }
    },
    async getRate(req, res, next) {
      try {
        const { id: user_id } = req.user;
        const { limit, page, select, sort } = req.query;
        const [rates, count] = await Promise.all([
          companyService.findReaction({
            query: { user_id, rate: true },
            limit,
            page,
            select: 'user_id user_name company_id rate rate_value rate_message',
            sort,
            populate: 'company_id'
          }),
          limit && companyService.countReaction({ user_id, rate: true })
        ]);
        const total_page = limit && Math.ceil(count / limit);
        return new BaseResponse({ statusCode: 200, data: rates })
          .addMeta({ total_page, total: count })
          .return(res);
      } catch (e) {
        next(e);
      }
    },
    async like(req, res, next) {
      try {
        const { id: user_id, name: user_name } = req.user;
        const { id: company_id, state } = req.body;
        let company = await companyService.findActive(
          company_id,
          'likes likes_count type_category_id category_id'
        );
        const { type_category_id, category_id } = company;
        const companyReaction = await companyService.findOneReaction(
          { user_id, company_id },
          { user_name }
        );
        const isExistLike = companyReaction.like;
        if (state === 'like' && !isExistLike) {
          company = companyService.changeCount(company_id, { likes_count: 1 });
          companyReaction.like = true;
          statisticService.update({ total_like: 1 });
        } else if (state === 'unlike' && isExistLike) {
          company = companyService.changeCount(company_id, { likes_count: -1 });
          companyReaction.like = false;
          statisticService.update({ total_like: -1 });
        }
        companyReaction.save();

        // Create user behavior --
        behaviorService.createReactionBehavior({
          user_id,
          type: state === 'like' ? ReactionTypes.Like_Company : ReactionTypes.Unlike_Company,
          company_id,
          reaction_id: companyReaction._id,
          on_model: 's_company_reaction'
        });
        // --

        return new BaseResponse({
          statusCode: 200,
          data: await company
        }).return(res);
      } catch (error) {
        next(error);
      }
    },
    async viewsUp(req, res, next) {
      try {
        const { id: company_id } = req.body;
        const { id: user_id, name: user_name } = req.user || {};
        const ip = req.headers['x-forwarded-for'];
        if (!ip) return new BaseResponse({ statusCode: 200, data: {} }).return(res);
        let company = await companyService.findActive(
          company_id,
          'user_id categories views_count type_category_id category_id'
        );
        const { category_id, type_category_id } = company;
        const [companyReaction, companyReactionIp] = await Promise.all([
          companyService.findOneReaction(
            mergeObject(
              { company_id },
              { user_id },
              !req.user && { ip, user_id: { $exists: false } }
            ),
            { user_name }
          ),
          companyService.findReactionByIp(company_id, ip)
        ]);
        if (req.user) {
          if (
            (companyReaction.view === false && !companyReactionIp) ||
            (companyReactionIp &&
              new Date() - companyReactionIp.last_view > 1000 * 60 * 60 * 24 &&
              new Date() - companyReaction.last_view > 1000 * 60 * 60 * 24)
          ) {
            companyReaction.view = true;
            companyReaction.views_count++;
            companyReaction.ip = ip;
            companyReaction.last_view = new Date();
            company = companyService.changeCount(company_id, {
              views_count: 1
            });
            statisticService.update({ total_view: 1 });
          }

          // Create user behavior --
          behaviorService.createReactionBehavior({
            user_id,
            type: ReactionTypes.View_Company,
            company_id,
            reaction_id: companyReaction._id,
            on_model: 's_company_reaction'
          });
          // --
        } else {
          if (!companyReactionIp) {
            companyReaction.ip = ip;
            companyReaction.view = true;
            companyReaction.views_count++;
            companyReaction.last_view = new Date();
            company = companyService.changeCount(company_id, {
              views_count: 1
            });
            statisticService.update({ total_view: 1 });
          } else {
            if (new Date() - companyReactionIp.last_view > 1000 * 60 * 60 * 24) {
              companyReaction.ip = ip;
              companyReaction.views_count++;
              companyReaction.view = true;
              company = companyService.changeCount(company_id, {
                views_count: 1
              });
              companyReaction.last_view = new Date();
              statisticService.update({ total_view: 1 });
            }
          }
        }
        await companyReaction.save();
        return new BaseResponse({
          statusCode: 200,
          data: await company
        }).return(res);
      } catch (error) {
        next(error);
      }
    },
    async share(req, res, next) {
      try {
        const { id: company_id } = req.body;
        const { id: user_id, name: user_name } = req.user;
        let company = await companyService.findActive(
          company_id,
          'shares_count type_category_id category_id'
        );
        const { category_id, type_category_id } = company;
        const companyReaction = await companyService.findOneReaction(
          { company_id, user_id },
          { user_name }
        );
        if (!companyReaction.share) {
          company = companyService.changeCount(company_id, { shares_count: 1 });
        }
        companyReaction.share = true;
        companyReaction.shares_count++;
        await companyReaction.save();
        statisticService.update({ total_share: 1 });

        // Create user behavior --
        behaviorService.createReactionBehavior({
          user_id,
          type: ReactionTypes.Share_Company,
          company_id,
          reaction_id: companyReaction._id,
          on_model: 's_company_reaction'
        });
        // --

        return new BaseResponse({
          statusCode: 200,
          data: await company
        }).return(res);
      } catch (error) {
        next(error);
      }
    },
    async rate(req, res, next) {
      try {
        const { id: user_id, name: user_name } = req.user;
        const { id: company_id, rate, state, message } = req.body;
        const rateable = await companyService.countReaction({
          user_id,
          company_id,
          can_rate: true
        });
        if (!rateable) throw new BaseError({ statusCode: 400, error: 'can not rate!!' });
        let company = await companyService.findActive(
          company_id,
          'rates_count total_rate type_category_id category_id'
        );
        const { category_id, type_category_id } = company;
        const companyReaction = await companyService.findOneReaction({
          user_id,
          company_id
        });
        const isExistRate = companyReaction.rate;
        if (state === 'rate') {
          statisticService.update({ total_rate: 1 });
          if (!isExistRate) {
            company = companyService.changeCount(company_id, {
              total_rate: +rate,
              rates_count: 1
            });
            company.total_rate += +rate;
            company.rates_count++;
            companyReaction.rate = true;
            companyReaction.rate_value = rate;
            companyReaction.rate_message = message;
          } else {
            company = companyService.changeCount(company_id, {
              total_rate: +rate - companyReaction.rate_value,
              rates_count: 0
            });
            companyReaction.rate = true;
            companyReaction.rate_value = rate;
            companyReaction.rate_message = message;
          }
        } else {
          if (isExistRate) {
            company = companyService.changeCount(company_id, {
              total_rate: -companyReaction.rate_value,
              rates_count: -1
            });
            companyReaction.rate = false;
            companyReaction.rate_value = null;
            companyReaction.rate_message = null;
          }
        }
        companyReaction.save();

        // Create user behavior --
        behaviorService.createReactionBehavior({
          user_id,
          type: state === 'rate' ? ReactionTypes.Rate_Company : ReactionTypes.Unrate_Company,
          company_id,
          reaction_id: companyReaction._id,
          on_model: 's_company_reaction'
        });
        // --

        return new BaseResponse({
          statusCode: 200,
          data: await company
        }).return(res);
      } catch (error) {
        next(error);
      }
    },
    async getChatUser(req, res, next) {
      try {
        const { id: user_id, name: user_name } = req.user;
        const user = await companyService.getChatUser(user_id);
        return new BaseResponse({ statusCode: 200, data: user }).return(res);
      } catch (error) {
        next(error);
      }
    }
  },
  admin: {
    async get(req, res, next) {
      try {
        const {
          limit,
          page,
          select,
          sort,
          start_time,
          end_time,
          company_ids,
          ...query
        } = req.query;
        if (start_time || end_time)
          query.createdAt = mergeObject(
            {},
            start_time && { $gte: new Date(start_time) },
            end_time && { $lte: new Date(end_time) }
          );
        const populate = [
          { path: 'category_id', select: 'name' },
          { path: 'type_category_id', select: 'name' },
          { path: 'user_id', select: 'name' }
        ];

        if (company_ids) {
          query._id = { $in: company_ids };
        }
        const [company, count] = await Promise.all([
          companyService.find({
            limit,
            page,
            select,
            sort,
            ...query,
            populate
          }),
          limit && companyService.count(query)
        ]);
        const total_page = limit && Math.ceil(count / limit);
        return new BaseResponse({ statusCode: 200, data: company })
          .addMeta({ total_page, total: count })
          .return(res);
      } catch (error) {
        next(error);
      }
    },
    async getById(req, res, next) {
      try {
        const { id } = req.params;
        const company = await companyService.findById(id, '+wallet');
        if (!company)
          throw new BaseError({
            statusCode: 400,
            error: errorCode.client,
            errors: { company_id: errorCode['client.companyNotExist'] }
          });
        return new BaseResponse({ statusCode: 200, data: company }).return(res);
      } catch (error) {
        next(error);
      }
    },
    async updateLimit(req, res, next) {
      try {
        const { id } = req.params;
        let company = await companyService.findOne({ _id: id });
        if (!company)
          throw new BaseError({
            statusCode: 400,
            error: { company_id: errorCode['client.companyNotExist'] }
          });
        await companyLimitService.update(id);
        company = await companyService.findOne({ _id: id });
        return new BaseResponse({ statusCode: 200, data: company }).return(res);
      } catch (error) {
        next(error);
      }
    },
    async approve(req, res, next) {
      try {
        let { id, status, note } = req.body;
        status === 'approved' && (note = '');
        const company = await companyService.update(id, { status, admin_note: note });
        status === 'approved' &&
          notificationService.createAndSend({
            company_id: company.id,
            type: 'company_approved',
            message: 'Doanh nghiệp của bạn đã được duyệt. Bạn có thể đăng sản phẩm ngay bây giờ!',
            title: 'Doanh nghiệp đã được duyệt',
            user_id: company.user_id
          });
        status === 'rejected' &&
          notificationService.createAndSend({
            company_id: company.id,
            type: 'company_rejected',
            title: 'Doanh nghiệp của bạn đã bị từ chối',
            message: 'Doanh nghiệp của bạn đã bị từ chối, Vui lòng liên hệ để biết thêm chi tiết',
            user_id: company.user_id
          });

        // Create admin activity
        adminActivityService.create({
          admin_id: req.admin.id,
          on_model: 's_company',
          object_id: company._id,
          updated_fields: ['status', 'admin_note'],
          type: 'update',
          snapshot: company,
          resource: req.originalUrl
        });

        return new BaseResponse({ statusCode: 200, data: company }).return(res);
      } catch (error) {
        next(error);
      }
    }
  }
};
