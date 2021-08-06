import Promise from 'bluebird';
import randomString from 'crypto-random-string';
import {
  BaseError,
  errorCode,
  findAdvanced,
  logger,
  mergeObject,
  splitString,
  transactionHelper
} from '../../commons/utils';
import chat from '../../commons/utils/chat';
import bannerService from '../banner/banner.service';
import categoryService from '../category/category.service';
import companyHistoryService from '../company-history/company-history.service';
import companyMoneyFlowService from '../money-flow/company-money-flow.service';
import orderService from '../order/order.service';
import permissionGroupService from '../permission-group/permission-group.service';
import productStoringService from '../product-storing/product-storing.service';
import productService from '../product/product.service';
import revenueService from '../revenue/revenue.service';
import statisticService from '../statistic/statistic.service';
import storeService from '../store/store.service';
import companyLimitService from './company-limit.service';
import companyReactionModel from './company-reaction.model';
import companyModel from './company.model';
import { randomInt } from '../../commons/utils/utils';
import promotionService from '../promotion/promotion.service';
import configService from '../../commons/config/config.service';
import behaviorService from '../behavior/behavior.service';
import { Types as BehaviorTypes } from '../behavior/behavior.config';
import extendService from '../../commons/utils/extend-service';
const ReactionTypes = BehaviorTypes.Reaction;

export default {
  ...extendService(companyModel),
  async find({ limit, page, select, sort, populate = '', ...query }) {
    const companies = await findAdvanced(companyModel, {
      limit,
      page,
      select,
      sort,
      populate,
      query: mergeObject({}, query)
    });
    return companies;
  },
  async findById(id, select) {
    const company = await companyModel.findById(id, select);
    return company;
  },
  async findByUserId(user_id, select) {
    return await companyModel.findOne({ user_id }, select);
  },
  async findReaction({ limit, page, select, sort, query, populate }) {
    return findAdvanced(companyReactionModel, {
      query,
      limit,
      page,
      select,
      sort,
      populate
    });
  },
  async findOneReaction(query, update = {}, select, upsert = true) {
    return companyReactionModel.findOneAndUpdate(query, update, {
      upsert,
      setDefaultsOnInsert: true,
      new: true,
      select
    });
  },
  async findReactionByIp(product_id, ip) {
    return companyReactionModel.findOne({ product_id, ip, view: true }, null, {
      sort: '-last_view'
    });
  },
  async isExistCompany(user_id, select) {
    const [company, permissionGroup] = await Promise.all([
      companyModel.findOne({ user_id }, select),
      permissionGroupService.findOne({
        user_id,
        status: 'active'
      })
    ]);
    if (company || permissionGroup)
      throw new BaseError({
        statusCode: 400,
        error: errorCode.client,
        errors: { company: errorCode['client.companyLimitExceeded'] }
      });
  },
  async findOne(query, select, options = {}) {
    return await companyModel.findOne(query, select, options);
  },
  async findOneActive(query, select, options = {}) {
    return await companyModel.findOne({ ...query, status: 'approved' }, select, options);
  },
  async findActive(id, select, options = {}) {
    const company = await companyModel.findOne({ _id: id, status: 'approved' }, select, options);
    if (!company)
      throw new BaseError({
        statusCode: 400,
        error: errorCode.client,
        errors: { company_id: errorCode['client.companyNotExist'] }
      });
    return company;
  },
  async isOwner(company_id, user_id) {
    const company = await this.findById(company_id);
    if (company.user_id.toString() !== user_id)
      throw new BaseError({
        statusCode: 401,
        error: errorCode.authorization,
        errors: { permisson: errorCode['permission.notAllow'] }
      });
  },
  async create(doc) {
    typeof doc.images === 'string' && (doc.images = splitString(doc.images));
    const company = await companyModel.create(doc);
    this.createChatUser(company)
      .then(() => {
        logger.info('Create chat user for company successfully');
      })
      .catch((err) => {
        // logger.error('Create chat user for company error %o', err);
      });
    return company;
  },
  async update(id, doc, populate = '') {
    typeof doc.images === 'string' && (doc.images = splitString(doc.images));
    const company = await companyModel.findById(id).populate(populate);
    if (!company)
      throw new BaseError({
        statusCode: 400,
        error: errorCode.client,
        errors: { company_id: errorCode['client.companyNotExist'] }
      });
    Object.assign(company, doc);
    const needIndex = company.isModified('status');
    const needIndexElastic = company.isModified('max_refund') || company.isModified('max_discount');
    await company.save();
    //* index
    if (needIndex) {
      await Promise.all([
        storeService.updateMany(
          { company_id: company._id },
          { is_active_company: company.status === 'approved' }
        ),
        productStoringService.updateMany(
          { company_id: company._id },
          { is_active_company: company.status === 'approved' }
        ),
        productService.updateMany(
          { company_id: company._id },
          { is_active_company: company.status === 'approved' }
        ),
        bannerService.updateMany(
          {
            company_id: company._id,
            status: 'approved',
            start_time: { $lte: new Date() },
            end_time: { $gte: new Date() }
          },
          { is_active_company: company.status === 'approved' }
        )
      ]);
    }
    if (needIndex || needIndexElastic) {
      storeService.indexElasticSearch({ company_id: id });
      productStoringService.indexElasticSearch({ company_id: id });
    }
    return company;
  },
  count(query) {
    return companyModel.countDocuments(mergeObject({}, query));
  },
  countReaction(query) {
    const total = companyReactionModel.countDocuments(mergeObject({}, query));
    return total;
  },
  changeCount(company_id, change, options = {}) {
    try {
      console.log('change');
      options.select = Object.keys(change).toString().replace(',', ' ');
      return companyModel
        .findByIdAndUpdate(
          company_id,
          { $inc: change },
          { new: true, setDefaultsOnInsert: true, ...options }
        )
        .exec();
    } catch (error) {
      logger.error(error);
    }
  },
  async getMaxPromotionValue(company_id) {
    logger.info('get Max Company By Promotion Changes');
    const productStorings = await productStoringService.find({
      company_id,
      active: true,
      is_active_product: true
    });
    let maxDiscount = 0;
    let maxRefund = 0;
    let maxDiscountModel;
    let maxRefundModel;
    productStorings.map((productStoring) => {
      productStoring.model_list.map((model) => {
        if (model.refund > maxRefund) {
          maxRefund = model.refund;
          maxRefundModel = model;
        }
        if (model.discount > maxDiscount) {
          maxDiscount = model.discount;
          maxDiscountModel = model;
        }
      });
    });
    const max_refund = maxRefundModel ? maxRefundModel.refund : 0;
    const max_discount = maxDiscountModel ? maxDiscountModel.discount : 0;

    return { max_refund, max_discount };
  },
  async updateActiveProduct(company_id) {
    const count = await productService.count({
      company_id,
      status: 'approved'
    });
    await companyModel.findByIdAndUpdate(company_id, { active_product: count }, { new: true });
  },
  async transact(...actions) {
    const session = await companyModel.startSession();
    await session.startTransaction();
    let transactions;
    try {
      transactions = await Promise.map(actions, (action) => action && action(session));
    } catch (error) {
      await session.abortTransaction();
      await session.endSession();
      throw error;
    }
    await session.commitTransaction();
    await session.endSession();
    this.checkUpdateLimit(...transactions);
    return transactions;
  },
  updateWallet: (
    query,
    { wallet, refund_fund, total_withdraw, maxNegativeWallet = 0 } = {}
  ) => async (session) => {
    console.log('maxNegativeWallet', maxNegativeWallet);
    const company = await companyModel
      .findOneAndUpdate(
        query,
        {
          $inc: mergeObject(
            {},
            {
              wallet: wallet && Math.round(wallet),
              refund_fund: refund_fund && Math.round(refund_fund),
              total_withdraw: total_withdraw && Math.round(total_withdraw)
            }
          )
        },
        {
          new: true,
          select:
            '+wallet +refund_fund category_id type_category_id max_refund balance_limit user_id status'
        }
      )
      .session(session);
    if (!company)
      throw new BaseError({
        statusCode: 400,
        errors: {
          company: errorCode['client.companyNotExist']
        }
      });
    if (wallet && company.wallet < maxNegativeWallet) {
      throw new BaseError({
        statusCode: 403,
        error: errorCode.client,
        errors: {
          'wallet.total': errorCode['client.MoneyNotEnough']
        }
      }).addMeta({ company_id: company._id });
    }
    logger.info('company', company);
    // if (company.status === 'suspend' || company.wallet <= company.max_refund * 5)
    // companyLimitService.update(company._id);
    // if (company.status === 'suspend' || company.wallet < company.balance_limit / 2)
    //   companyLimitService.update(company._id);
    return company;
  },
  async viewsUp({ company, ip, user }) {
    const { type_category_id, category_id } = company;

    try {
      const { id: user_id, name: user_name } = user || {};
      ip = '1.2.3.5';
      if (!ip) return;
      const [companyReaction, companyReactionIp] = await Promise.all([
        this.findOneReaction(
          mergeObject(
            { company_id: company._id },
            { user_id },
            !user && { ip, user_id: { $exists: false } }
          ),
          {
            user_name
          }
        ),
        this.findReactionByIp(company._id, ip)
      ]);
      if (user) {
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
          company = this.changeCount(company._id, { views_count: 1 });
          statisticService.update({ total_view: 1 });
        }

        // Create user behavior --
        behaviorService.createReactionBehavior({
          user_id,
          type: ReactionTypes.View_Company,
          reaction_id: companyReaction._id,
          company_id: company._id,
          on_model: 's_company_reaction'
        });
        // --
      } else {
        if (!companyReactionIp) {
          companyReaction.ip = ip;
          companyReaction.view = true;
          companyReaction.views_count++;
          companyReaction.last_view = new Date();
          company = this.changeCount(company._id, { views_count: 1 });
          statisticService.update({ total_view: 1 });
        } else {
          if (new Date() - companyReactionIp.last_view > 1000 * 60 * 60 * 24) {
            companyReaction.ip = ip;
            companyReaction.views_count++;
            companyReaction.view = true;
            company = this.changeCount(company._id, { views_count: 1 });
            companyReaction.last_view = new Date();
            statisticService.update({ total_view: 1 });
          }
        }
      }
      await companyReaction.save();
      return await company;
    } catch (error) {
      logger.error(error);
    }
  },
  async deductFee({ company_id, category_id, total, order_id }) {
    let [companyLimit, companyCategory, company] = await Promise.all([
      configService.get('company_limit'),
      categoryService.findOne({ _id: category_id }),
      this.findOne({ _id: company_id })
    ]);

    const balanceLimit = companyLimit.find((v) => v.level === company.level);
    const maxNegativeWallet = balanceLimit ? balanceLimit.negative_balance : 0;
    if (!companyCategory) {
      logger.error('category_type not found');
      throw new BaseError({
        statusCode: 500,
        errors: {
          type_company: errorCode['server.typeCompanyNotFound']
        }
      });
    }
    const fee = Math.round(total * (companyCategory.fee_rate || 0.03));
    await transactionHelper.withSession(async (session) => {
      [company] = await transactionHelper.mapTransaction(
        this.updateWallet(
          { _id: company_id },
          { wallet: -fee, maxNegativeWallet: -maxNegativeWallet }
        )
      )(session);
      //* company history
      await companyHistoryService.create(
        {
          company_id: company_id,
          type: companyHistoryService.type.pay_service_fee,
          transaction_id: order_id,
          new_balance: company.wallet,
          value: -fee
        },
        { session }
      );
      await companyMoneyFlowService.update(
        company_id,
        {
          total_service_fee: fee,
          total_loss: fee
        },
        { session }
      );
    });
    orderService.update({ _id: order_id }, { total_service_fee: fee });
    revenueService.update({ company_id: company_id }, { total_service_fee: fee });
    this.checkUpdateLimit(company);
  },

  async getChatUser(userId) {
    let company = await permissionGroupService.findOne({ user_id: userId }, { path: 'company_id' });
    company = company.toObject().company_id;
    if (!company) {
      throw new BaseError({
        statusCode: 400,
        error: 'Company not found'
      });
    }
    if (company.chat_username && company.chat_password) {
      return {
        chat_username: company.chat_username,
        chat_password: company.chat_password
      };
    } else {
      return this.createChatUser(company);
    }
  },
  async checkUpdateLimit(...companies) {
    return Promise.map(companies, (company) => {
      logger.info(`check limit %s %o`, company);
      if (company && company.is_company) {
        if (company.status === 'suspend' || company.wallet <= company.max_refund * 6)
          return companyLimitService.update(company._id);
      }
    });
  },
  async createChatUser(company) {
    const username = process.env.NODE_ENV !== 'production' ? 'dev-' + company._id : company._id;
    if (!company.chat_username || !company.chat_password) {
      const loginSuccess = await chat.loginToChatServer();
      if (!loginSuccess) {
        throw new BaseError({
          statusCode: 500
        });
      }

      const password = randomString({ length: 16 });
      try {
        await chat.deleteChatUser(username);
      } catch (err) {}
      const created = await chat.createChatUser(
        company.name,
        username + '@fake.com',
        username,
        password
      );
      if (created) {
        await companyModel.updateOne(
          { _id: company._id },
          { chat_username: username, chat_password: password }
        );
        return {
          chat_username: username,
          chat_password: password
        };
      } else {
        throw new BaseError({
          statusCode: 500
        });
      }
    }

    return {
      chat_username: company.chat_username,
      chat_password: company.chat_password
    };
  }
};
