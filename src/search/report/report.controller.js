import _ from 'lodash';
import moment from 'moment';
import adminActivityService from '../../commons/admin-activity/admin-activity.service';
import { BaseError, BaseResponse, errorCode, mergeObject } from '../../commons/utils';
import notificationService from '../notification/notification.service';
import reportConfig from './report.config';
import reportService from './report.service';

const reportController = {
  user: {
    async get(req, res, next) {
      try {
        const { id: user_id } = req.user;
        const {
          limit,
          select,
          page,
          sort,
          created_from,
          created_to,
          statuses,
          ...query
        } = req.query;
        if (created_from) {
          query.createdAt = {};
          created_from && (query.createdAt['$gte'] = new Date(created_from));
          created_to && (query.createdAt['$lte'] = new Date(created_to));
        }
        const status = statuses
          ? {
              $in: statuses.split(',').map((stt) => stt.trim())
            }
          : {
              $nin: ['hidden']
            };
        query.status = status;
        query.user_id = user_id;

        const [_reports, count] = await Promise.all([
          reportService.find({
            limit,
            select,
            sort,
            page,
            query
          }),
          limit && reportService.count(query)
        ]);

        const total_page = limit && Math.ceil(count / limit);
        const reports = _reports.map((report) => _.omit(report._doc, ['admin_id']));
        return new BaseResponse({ statusCode: 200, data: reports })
          .addMeta({ total_page, total: count })
          .return(res);
      } catch (error) {
        next(error);
      }
    },
    async post(req, res, next) {
      try {
        const reportData = req.body;
        const { id: user_id } = req.user;

        // Check if user exceed max report times per day
        const startOfDay = moment().startOf('day').toDate();
        const endOfDay = moment().endOf('day').toDate();
        const reportedNum = await reportService.count({
          user_id,
          createdAt: { $gte: startOfDay, $lte: endOfDay }
        });
        if (reportedNum >= reportConfig.maxReportTimesPerDay) {
          return next(
            new BaseError({
              statusCode: 400,
              error: errorCode.client,
              errors: { report: errorCode['client.exceedMaxReportTimesPerDay'] }
            }).addMeta({ message: `user reported ${reportedNum} times today` })
          );
        }

        const newReport = { ...reportData, user_id };
        const report = await reportService.create(newReport);
        return new BaseResponse({ statusCode: 201, data: report }).return(res);
      } catch (error) {
        next(error);
      }
    },
    async getById(req, res, next) {
      try {
        const { id } = req.params;
        const { id: user_id } = req.user;
        const _report = await reportService.findOne({
          _id: id,
          user_id,
          status: { $nin: ['hidden'] }
        });

        const report = _.omit(_report._doc, ['admin_id']);
        return new BaseResponse({ statusCode: 200, data: report }).return(res);
      } catch (error) {
        next(error);
      }
    },
    // Not use
    async update(req, res, next) {
      try {
        const { id } = req.params;
        const { id: user_id } = req.user;
        const update = req.body;
        const report = await reportService.update(
          {
            _id: id,
            user_id,
            status: { $nin: ['hidden', 'handled'] }
          },
          update
        );

        if (!report) {
          return next(
            new BaseError({
              statusCode: 400,
              error: errorCode.client,
              errors: { report: errorCode['client.global.notFound'] }
            }).addMeta({ message: 'report not found or in status [hidden, handled]' })
          );
        }

        return new BaseResponse({ statusCode: 200, data: report }).return(res);
      } catch (error) {
        next(error);
      }
    },
    // Not use
    async delete(req, res, next) {
      try {
        const { id } = req.params;
        const { id: user_id } = req.user;
        const report = await reportService.update(
          {
            _id: id,
            user_id,
            status: 'pending'
          },
          {
            status: 'hidden'
          }
        );

        if (!report) {
          return next(
            new BaseError({
              statusCode: 400,
              error: errorCode.client,
              errors: { report: errorCode['client.global.notFound'] }
            }).addMeta({ message: 'report not found or in status [hidden, handled]' })
          );
        }

        return new BaseResponse({ statusCode: 200, data: report }).return(res);
      } catch (error) {
        next(error);
      }
    }
  },
  admin: {
    async get(req, res, next) {
      try {
        let { limit, select, page, sort, created_from, created_to, statuses, ...query } = req.query;
        if (created_from) {
          query.createdAt = {};
          created_from && (query.createdAt['$gte'] = new Date(created_from));
          created_to && (query.createdAt['$lte'] = new Date(created_to));
        }
        const status = statuses && {
          $in: statuses.split(',').map((stt) => stt.trim())
        };
        query.status = status;
        query = mergeObject({}, query);
        const [reports, count] = await Promise.all([
          reportService.find({
            limit,
            select,
            sort,
            page,
            populate: [
              { path: 'user', select: 'name phone status level' },
              { path: 'admin', select: 'name email status' }
            ],
            query
          }),
          limit && reportService.count(query)
        ]);
        console.log(`===> ~ file: report.controller.js ~ line 190 ~ get ~ count`, count);
        const total_page = limit && Math.ceil(count / limit);
        return new BaseResponse({ statusCode: 200, data: reports })
          .addMeta({ total_page, total: count })
          .return(res);
      } catch (error) {
        next(error);
      }
    },
    async getById(req, res, next) {
      try {
        const { id } = req.params;
        const report = await reportService.findOne({ _id: id });
        return new BaseResponse({ statusCode: 200, data: report }).return(res);
      } catch (error) {
        next(error);
      }
    },
    async confirm(req, res, next) {
      try {
        const { id: admin_id } = req.admin;
        const { report_id, response } = req.body;

        // Update & check if report not exist
        const report = await reportService.update(
          {
            _id: report_id,
            status: 'pending'
          },
          {
            admin_id,
            status: 'handling',
            ...(response ? { response } : {})
          }
        );
        if (!report) {
          return next(
            new BaseError({
              statusCode: 400,
              error: errorCode.client,
              errors: { report: errorCode['client.global.notFound'] }
            }).addMeta({ message: 'report not found or handling by another' })
          );
        }

        // Send confirm notification to user
        notificationService.createAndSend({
          user_id: report.user_id,
          type: 'report_confirmation',
          title: reportConfig.confirmReportContents[report.language].title,
          message: report.response || reportConfig.confirmReportContents[report.language].message,
          object_id: report._id,
          onModel: 's_report'
        });
        // Create admin activities
        adminActivityService.create({
          admin_id: req.admin.id,
          on_model: 's_report',
          object_id: report._id,
          updated_fields: ['status', 'response'],
          type: 'update',
          snapshot: report,
          resource: req.originalUrl
        });

        return new BaseResponse({ statusCode: 200, data: report }).return(res);
      } catch (err) {
        next(err);
      }
    },
    async update(req, res, next) {
      try {
        const { id: admin_id } = req.admin;
        const { id } = req.params;
        const { response, status, hidden_reason } = req.body;

        const report = await reportService.update(
          {
            _id: id,
            admin_id,
            status: 'handling'
          },
          {
            ...(status ? { status } : {}),
            ...(response ? { response } : {}),
            ...(status === 'hidden' && hidden_reason ? { hidden_reason } : {})
          }
        );
        if (!report) {
          return next(
            new BaseError({
              statusCode: 401,
              error: errorCode.client,
              errors: { permission: errorCode['permission.notAllow'] }
            }).addMeta({ message: 'report not found or admin unauthorized' })
          );
        }
        // Create admin activities
        adminActivityService.create({
          admin_id: req.admin.id,
          on_model: 's_report',
          object_id: report._id,
          updated_fields: report,
          type: 'update',
          snapshot: report,
          resource: req.originalUrl
        });

        return new BaseResponse({ statusCode: 200, data: report }).return(res);
      } catch (error) {
        next(error);
      }
    }
  }
};

export default reportController;
