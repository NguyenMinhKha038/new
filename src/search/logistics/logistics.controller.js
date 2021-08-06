import { configService } from '../../commons/config';
import { userService } from '../../commons/user';
import { BaseError, BaseResponse, logger, transactionHelper } from '../../commons/utils';
import companyService from '../company/company.service';
import notificationService from '../notification/notification.service';
import orderHandler from '../order/order.handler';
import orderService from '../order/order.service';
import logisticsHandler from './logistics.handler';
import logisticsService from './logistics.service';
import baseLogistics from './provider/base-logistics';

export default {
  user: {
    async getAvailable(req, res, next) {
      try {
        const company_id = req.query;
        const logistics = await logisticsService.find({ company_id: company_id });
        return new BaseResponse({ statusCode: 200, data: logistics }).return(res);
      } catch (error) {
        next(error);
      }
    }
  },
  company: {
    async get(req, res, next) {
      try {
        const logistics = await logisticsService.find({ company_id: req.company._id });
        const providers = await configService.get('logistics_providers');
        providers.forEach((provider) => {
          const isExist = logistics.some((log) => log.provider === provider.provider);
          if (!isExist)
            logistics.push({
              company_id: req.company._id,
              provider: provider.provider,
              logo: provider.logo,
              status: 'disabled'
            });
        });
        return new BaseResponse({ statusCode: 200, data: logistics }).return(res);
      } catch (error) {
        next(error);
      }
    },
    async put(req, res, next) {
      try {
        const { provider, status, is_default } = req.body;
        if (is_default) {
          await logisticsService.updateOne(
            { company_id: req.company._id, is_default: true },
            { is_default: false }
          );
        }
        if (status === 'disabled') {
          await logisticsService.updateOne(
            { company_id: req.company._id, is_default: false },
            { is_default: true }
          );
        }
        const logistics = await logisticsService.updateOne(
          { company_id: req.company._id, provider },
          { is_default: status === 'disabled' ? false : is_default, status },
          { new: true, upsert: true, setDefaultsOnInsert: true }
        );
        logisticsService.findOne({ company_id: req.company._id, status: 'active' }).then((res) => {
          companyService.update(req.company._id, { online_sales: !!res });
        });
        return new BaseResponse({ statusCode: 200, data: logistics }).return(res);
      } catch (error) {
        next(error);
      }
    },
    async getAvailable(req, res, next) {
      try {
        const providers = await configService.get('logistics_providers');
        return new BaseResponse({ statusCode: 200, data: providers }).return(res);
      } catch (error) {
        next(error);
      }
    }
  },
  async ghnHook(req, res, next) {
    try {
      const data = req.body;
      logger.info('data %o', data);
      const order = await orderService.findOne({ code: data.ClientOrderCode });
      if (!order) {
        logger.error('order not found %o', data);
        throw new BaseError({ statusCode: 404, message: 'order not found' });
      }
      const statusDescription = baseLogistics.ghn.getStatus(data.Status);
      if (!statusDescription) return new BaseResponse({ statusCode: 200, data: {} }).return(res);
      // Fee transport
      if (data.Status === 'picked' || data.Type === 'update_fee') {
        await logisticsHandler.handleDelivery({
          order,
          fee: data.Fee.MainService
        });
      }
      // Fee return
      if (data.Type === 'update_fee' && data.Fee.Return) {
        await logisticsHandler.handleReturn({ order, fee: data.Fee.Return });
      }
      const user = await userService.findOne({ _id: order.user_id });
      order.logistics_progress.push({
        date: new Date(),
        status: data.Status,
        description: statusDescription
      });
      let notification = {};
      switch (data.Status) {
        case 'storing':
          if (order.status === 'delivering') break;
          order.status = 'delivering';
          Object.assign(notification, {
            message: `Đơn hàng ${order.code} của bạn đã đươc cửa hàng vận chuyển`,
            title: 'Đơn hàng đang vận chuyển',
            type: 'user_delivering_order'
          });
          break;
        case 'delivered':
          order.status = 'delivered';
          order.delivered_date = new Date();
          Object.assign(notification, {
            message: `Đơn hàng ${order.code} của bạn đã giao`,
            title: 'Đơn hàng đã giao',
            type: 'user_delivered_order'
          });
          break;
        case 'cancel':
          await transactionHelper.withSession(async (session) => {
            await orderHandler.handleCancel(
              { order, user, updates: { status: 'company_canceled' } },
              { session }
            );
          });
          // order.status = 'company_canceled';
          Object.assign(notification, {
            message: `Đơn hàng ${order.code} của bạn đã bị cửa hàng hủy`,
            title: 'Đơn hàng bị hủy',
            type: 'user_company_canceled_order'
          });
          break;
        case 'return':
          await transactionHelper.withSession(async (session) => {
            await orderHandler.handleCancel(
              { order, user, updates: { status: 'user_rejected' } },
              { session }
            );
          });
          // order.status = 'user_rejected';
          Object.assign(notification, {
            message: `Đơn hàng ${order.code} của bạn đã bị hủy do bạn không nhận hàng`,
            title: 'Đơn hàng bị hủy',
            type: 'user_rejected_order'
          });
          break;
        case 'lost':
        case 'damage':
          await transactionHelper.withSession(async (session) => {
            await orderHandler.handleCancel(
              { order, user, updates: { status: 'lost_damage' } },
              { session }
            );
          });
          Object.assign(notification, {
            message: `Đơn hàng ${order.code} của bạn đã bị hủy do bị ${
              data.Status === 'lost' ? 'thất lạc' : 'hư hỏng'
            } trong quá trình vận chuyển`,
            title: 'Đơn hàng bị hủy',
            type: 'user_lost_order'
          });
          break;
        case 'exception':
          order.status = 'exception';
          break;
        default:
          break;
      }
      // * send notification when pay order successfully
      if (notification.message)
        notificationService.createAndSend({
          user_id: order.user_id,
          ...notification,
          object_id: order._id,
          onModel: 's_order'
        });
      await order.save();
      return new BaseResponse({ statusCode: 200, data: {} }).return(res);
    } catch (error) {
      next(error);
    }
  }
};
