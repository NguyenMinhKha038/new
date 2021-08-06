import Promise from 'bluebird';
import { configService } from '../../commons/config';
import { BaseError, BaseResponse, errorCode, mergeObject } from '../../commons/utils';
import { withSafety, withSession } from '../../commons/utils/transaction-helper';
import companyHistoryService from '../company-history/company-history.service';
import companyService from '../company/company.service';
import companyMoneyFlowService from '../money-flow/company-money-flow.service';
import revenueService from '../revenue/revenue.service';
import bannerService from './banner.service';
import adminActivityService from '../../commons/admin-activity/admin-activity.service';
import companyActivityService from '../company-activity/company-activity.service';
import { CompanyActions } from '../company-activity/company-activity.config';

export default {
  async get(req, res, next) {
    try {
      const banners = await bannerService.find({
        sort: 'position',
        status: 'approved',
        is_active_company: true,
        start_time: { $lte: new Date() },
        end_time: { $gte: new Date() }
      });
      return new BaseResponse({ statusCode: 200, data: banners }).return(res);
    } catch (error) {
      next(error);
    }
  },
  async getById(req, res, next) {
    try {
      const { id } = req.params;
      const banner = await bannerService.findActive(id);
      return new BaseResponse({ statusCode: 200, data: banner }).return(res);
    } catch (error) {
      next(error);
    }
  },
  company: {
    async get(req, res, next) {
      try {
        const { limit, page, select, sort, custom_status, active, ...query } = req.query;
        if (custom_status) {
          if (custom_status === 'upcoming') {
            query.start_time = { $gte: new Date() };
          }
          if (custom_status === 'running') {
            query.start_time = { $lte: new Date() };
            query.end_time = { $gte: new Date() };
          }
          if (custom_status === 'expired') {
            query.end_time = { $lte: new Date() };
          }
          if (['created', 'started', 'ended'].includes(custom_status)) {
            if (custom_status === 'created') {
              query.createdAt = { $gte: query.start_time, $lte: query.end_time };
              delete query.start_time;
              delete query.end_time;
            }
            if (custom_status === 'started') {
              query.start_time = { $gte: query.start_time, $lte: query.end_time };
              delete query.end_time;
            }
            if (custom_status === 'ended') {
              query.end_time = { $gte: query.start_time, $lte: query.end_time };
              delete query.start_time;
            }
          }
        }
        if (active) {
          Object.assign(query, {
            status: 'approved',
            is_active_company: true,
            start_time: { $lte: new Date() },
            end_time: { $gte: new Date() }
          });
        }
        const [banner, count, bannerConfig] = await Promise.all([
          bannerService.find({
            limit,
            page,
            select,
            sort,
            company_id: req.company.id,
            ...query
          }),
          limit && bannerService.count({ company_id: req.company.id, ...query }),
          configService.get('banner')
        ]);
        await Promise.map(banner, (b) => b.getFee(bannerConfig));
        const total_page = limit && Math.ceil(count / limit);
        return await new BaseResponse({ statusCode: 200, data: banner })
          .addMeta({ total_page, total: count })
          .return(res);
      } catch (error) {
        next(error);
      }
    },
    async getById(req, res, next) {
      try {
        const { id: company_id } = req.company;
        const { id } = req.params;
        const banner = await bannerService.findOne({ company_id, _id: id });
        if (banner) await banner.getFee();
        return new BaseResponse({ statusCode: 200, data: banner }).return(res);
      } catch (error) {
        next(error);
      }
    },
    async getSlot(req, res, next) {
      try {
        const { start_time, end_time, position } = req.query;
        const banners = await bannerService.find({
          status: 'approved',
          ...(position ? { position: position } : {}),
          $or: [
            {
              start_time: { $lte: start_time },
              end_time: { $lte: end_time, $gte: start_time }
            },
            {
              start_time: { $lte: start_time },
              end_time: { $gte: end_time }
            },
            {
              start_time: { $gte: start_time },
              end_time: { $lte: end_time }
            },
            {
              start_time: { $gte: start_time, $lte: end_time },
              end_time: { $gte: end_time }
            }
          ],
          select: 'image name start_time end_time position'
        });
        return new BaseResponse({ statusCode: 200, data: banners }).return(res);
      } catch (error) {
        next(error);
      }
    },
    async post(req, res, next) {
      try {
        const { id: company_id } = req.company;
        const newBanner = req.body;
        const bannerConfig = await configService.get('banner');
        const differentHours =
          (new Date(newBanner.end_time) - new Date(newBanner.start_time)) / 36e5;
        if (differentHours > bannerConfig.max_hours)
          throw new BaseError({
            statusCode: 400,
            error: errorCode.client,
            errors: { max_hours: errorCode['client.bannerTimeNotValid'] }
          });
        const pendingHours = (new Date(newBanner.start_time) - new Date()) / 36e5;
        if (pendingHours < bannerConfig.pending_hours)
          throw new BaseError({
            statusCode: 400,
            error: errorCode.client,
            errors: { pending_hours: errorCode['client.bannerTimeNotValid'] }
          });
        await bannerService.isExistBanner({
          end_time: newBanner.end_time,
          position: newBanner.position,
          start_time: newBanner.start_time
        });
        const banner = await bannerService.create({ company_id, ...newBanner });
        await banner.getFee();
        withSafety(() => {
          companyActivityService.implicitCreate(CompanyActions.createBanner)(req, {
            object_id: banner._id
          });
        });
        return new BaseResponse({ statusCode: 200, data: banner }).return(res);
      } catch (error) {
        next(error);
      }
    },
    async put(req, res, next) {
      try {
        const { id: company_id } = req.company;
        const { id } = req.params;
        const { start_time, end_time, position, status, image, name } = req.body;
        const banner = await bannerService.findOne({ _id: id, company_id });
        if (!banner)
          throw new BaseError({
            statusCode: 404,
            errors: {
              status: errorCode['client.bannerNotExist']
            }
          });
        if (status) {
          if (banner.is_paid && status === 'pending')
            throw new BaseError({
              statusCode: 400,
              errors: {
                status: errorCode['client.bannerCanNotChangeStatus']
              }
            });
          mergeObject(banner, { status });
        } else if (banner.status !== 'pending')
          throw new BaseError({
            statusCode: 400,
            errors: {
              status: errorCode['client.bannerHasBeenApproved']
            }
          });
        if (status !== 'disabled' && (start_time || end_time))
          await bannerService.isExistBanner({
            exclude_id: id,
            end_time: end_time,
            position: position,
            start_time: start_time
          });
        mergeObject(banner, { start_time, end_time, position, name, image });
        await banner.save();
        await banner.getFee();
        withSafety(() => {
          companyActivityService.implicitCreate(CompanyActions.updateBanner)(req, {
            object_id: banner._id
          });
        });
        return new BaseResponse({ statusCode: 200, data: banner }).return(res);
      } catch (error) {
        next(error);
      }
    },
    async upload(req, res, next) {
      try {
        const path = req.file && req.file.path;
        return new BaseResponse({ statusCode: 200, data: path }).return(res);
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
          company_id,
          status,
          active,
          custom_status,
          ...query
        } = req.query;
        if (custom_status) {
          if (custom_status === 'upcoming') {
            query.start_time = { $gte: new Date() };
          }
          if (custom_status === 'running') {
            query.start_time = { $lte: new Date() };
            query.end_time = { $gte: new Date() };
          }
          if (custom_status === 'expired') {
            query.end_time = { $lte: new Date() };
          }
          if (['created', 'started', 'ended'].includes(custom_status)) {
            if (custom_status === 'created') {
              query.createdAt = { $gte: query.start_time, $lte: query.end_time };
              delete query.start_time;
              delete query.end_time;
            }
            if (custom_status === 'started') {
              query.start_time = { $gte: query.start_time, $lte: query.end_time };
              delete query.end_time;
            }
            if (custom_status === 'ended') {
              query.end_time = { $gte: query.start_time, $lte: query.end_time };
              delete query.start_time;
            }
          }
        }
        if (active) {
          Object.assign(query, {
            status: 'approved',
            is_active_company: true,
            start_time: { $lte: new Date() },
            end_time: { $gte: new Date() }
          });
        }
        const [banners, count, bannerConfig] = await Promise.all([
          bannerService.find({
            limit,
            page,
            select,
            sort,
            company_id,
            status,
            active,
            populate: 'company',
            ...query
          }),
          limit && bannerService.count({ company_id, status, ...query }),
          configService.get('banner')
        ]);
        await Promise.map(banners, (b) => b.getFee(bannerConfig));
        const total_page = limit && Math.ceil(count / limit);
        return new BaseResponse({ statusCode: 200, data: banners })
          .addMeta({ total_page, total: count })
          .return(res);
      } catch (error) {
        next(error);
      }
    },
    async getById(req, res, next) {
      try {
        const { id } = req.params;
        const banner = await bannerService.findById(id, null, { populate: 'company' });
        if (banner) await banner.getFee();
        return new BaseResponse({ statusCode: 200, data: banner }).return(res);
      } catch (error) {
        next(error);
      }
    },
    async post(req, res, next) {
      try {
        const { id: admin_id } = req.admin;
        const newBanner = req.body;
        await bannerService.isExistBanner({
          end_time: newBanner.end_time,
          position: newBanner.position,
          start_time: newBanner.start_time
        });
        const banner = await bannerService.create({
          admin_id,
          ...newBanner,
          is_admin_posted: true
        });
        // Create admin activity
        adminActivityService.create({
          admin_id: req.admin.id,
          on_model: 's_banner',
          object_id: banner._id,
          updated_fields: banner,
          type: 'insert',
          snapshot: banner,
          resource: req.originalUrl
        });

        return new BaseResponse({ statusCode: 200, data: banner }).return(res);
      } catch (error) {
        next(error);
      }
    },
    async put(req, res, next) {
      try {
        const { id } = req.params;
        const { start_time, end_time, position, status, image, name } = req.body;
        const banner = await bannerService.findOne({ _id: id, is_admin_posted: true });
        if (!banner)
          throw new BaseError({
            statusCode: 404,
            errors: {
              status: errorCode['client.bannerNotExist']
            }
          });
        mergeObject(banner, { start_time, end_time, position, name, image, status });
        if (status === 'approved') {
          await bannerService.isExistBanner({
            end_time: end_time,
            position: position,
            start_time: start_time,
            exclude_id: id
          });
        }
        await banner.save();

        // Create admin activity
        adminActivityService.create({
          admin_id: req.admin.id,
          on_model: 's_banner',
          object_id: banner._id,
          updated_fields: req.body,
          type: 'update',
          snapshot: banner,
          resource: req.originalUrl
        });

        return new BaseResponse({ statusCode: 200, data: banner }).return(res);
      } catch (error) {
        next(error);
      }
    },
    async approve(req, res, next) {
      try {
        const { id } = req.params;
        const { status } = req.body;
        const baseData = { admin_id: req.admin.id, type: 'update', resource: req.originalUrl };
        const banner = await withSession(async (session) => {
          const banner = await bannerService.findOne({ _id: id, is_admin_posted: false }, null, {
            session
          });
          if (!banner)
            throw new BaseError({
              statusCode: 400,
              errors: { status: errorCode['client.bannerNotExist'] }
            });
          if (banner.status !== 'pending')
            throw new BaseError({
              statusCode: 403,
              errors: {
                status: errorCode['client.bannerHasBeenApproved']
              }
            });
          const company = await companyService.findActive({ _id: banner.company_id }, '+wallet', {
            session
          });
          if (company.wallet <= banner._total_fee)
            throw new BaseError({
              statusCode: 403,
              errors: {
                wallet: errorCode['client.MoneyNotEnough']
              }
            });
          if (status === 'approved') {
            const isValidTime = new Date() < new Date(banner.start_time);
            if (!isValidTime)
              throw new BaseError({
                statusCode: 403,
                error: errorCode.client,
                errors: { banner: errorCode['client.bannerTimeNotValid'] }
              });
            await bannerService.isExistBanner({
              start_time: banner.start_time,
              end_time: banner.end_time,
              position: banner.position,
              session
            });
            await banner.getFee();
            const updatedBannerFields = ['_fee', '_total_fee'];
            const _company = await companyService.updateWallet(
              { _id: banner.company_id },
              { wallet: -banner._total_fee }
            )(session);
            await companyHistoryService.create(
              {
                company_id: banner.company_id,
                type: companyHistoryService.type.pay_banner_fee,
                transaction_id: banner._id,
                new_balance: _company.wallet,
                value: banner._total_fee
              },
              { session }
            );
            banner.status = status;
            banner.is_paid = true;
            banner.total_fee = banner._total_fee;
            banner.fee = banner._fee;
            updatedBannerFields.push('status', 'is_paid', 'total_fee', 'fee');
            const [revenue, updatedBanner] = await Promise.all([
              revenueService.update(
                { company_id: banner.company_id },
                { total_banner_fee: banner.fee }
              ),
              banner.save()
            ]);

            companyMoneyFlowService.update(banner.company_id, {
              total_banner_fee: banner.fee,
              total_loss: banner.fee
            });
            // Create admin activities
            adminActivityService.createMulti([
              {
                ...baseData,
                on_model: 's_banner',
                object_id: banner._id,
                updated_fields: updatedBannerFields,
                snapshot: updatedBanner,
                is_parent: true
              },
              {
                ...baseData,
                on_model: 's_company',
                object_id: banner.company_id,
                updated_fields: ['wallet'],
                snapshot: _company
              },
              {
                ...baseData,
                on_model: 's_revenue',
                object_id: revenue._id,
                updated_fields: ['total_banner_fee'],
                snapshot: revenue
              }
            ]);
          }
          if (status === 'rejected') {
            banner.status = status;
            await banner.save();
            // Create admin activity
            adminActivityService.create({
              ...baseData,
              on_model: 's_banner',
              object_id: banner._id,
              updated_fields: req.body,
              snapshot: banner
            });
          }
          return banner;
        });

        return new BaseResponse({ statusCode: 200, data: banner }).return(res);
      } catch (error) {
        next(error);
      }
    }
  }
};
