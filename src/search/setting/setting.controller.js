import { BaseError, BaseResponse, errorCode, withSafety } from '../../commons/utils';
import { CompanyActions } from '../company-activity/company-activity.config';
import companyActivityService from '../company-activity/company-activity.service';
import settingService from './setting.service';

export default {
  async get(req, res, next) {
    try {
      const { company_id } = req.query;
      const setting = await settingService.get(company_id);
      return new BaseResponse({ statusCode: 200, data: setting }).return(res);
    } catch (error) {
      next(error);
    }
  },
  company: {
    async get(req, res, next) {
      try {
        const { id } = req.company;
        const setting = await settingService.get(id);
        return new BaseResponse({ statusCode: 200, data: setting }).return(res);
      } catch (error) {
        next(error);
      }
    },
    async getByKey(req, res, next) {
      try {
        const { id } = req.company;
        const { key } = req.params;
        const setting = await settingService.getByKey(id, key);
        return new BaseResponse({ statusCode: 200, data: setting[key] }).return(res);
      } catch (error) {
        next(error);
      }
    },
    async post(req, res, next) {
      try {
        const newSetting = req.body;
        const setting = await settingService.get(req.company.id);
        Object.assign(setting, newSetting);
        if (setting.can_order_without_product && !setting.order_without_product_rate.length)
          throw new BaseError({
            statusCode: 400,
            error: errorCode.validate,
            errors: { order_without_product_rate: errorCode['array.length'] }
          });
        // check can order without product
        if (
          setting.can_order_without_product &&
          setting.order_without_product_rate[0] &&
          setting.order_without_product_rate[0].from !== 0
        ) {
          throw new BaseError({
            statusCode: 400,
            error: errorCode.validate,
            errors: { order_without_product_rate: errorCode['number.startAtZero'] }
          });
        }
        // check discount transport
        if (setting.discount_transport.length > 3)
          throw new BaseError({
            statusCode: 400,
            error: errorCode.client,
            errors: {
              discount_transport_length: errorCode['client.companyDiscountTransportNumber']
            }
          });
        setting.discount_transport = setting.discount_transport.sort(
          (a, b) => a.order_value - b.order_value
        );
        setting.discount_transport.forEach((item, index) => {
          if (
            index > 0 &&
            item.status === 'active' &&
            setting.discount_transport[index - 1].status === 'active' &&
            item.discount_rate <= setting.discount_transport[index - 1].discount_rate
          )
            throw new BaseError({
              statusCode: 400,
              error: errorCode.client,
              errors: { order_value: errorCode['client.companyDiscountTransportMin'] }
            });
        });
        await setting.save();
        withSafety(() => {
          companyActivityService.implicitCreate(CompanyActions.setting)(req, {
            object_id: setting._id
          });
        });
        return new BaseResponse({ statusCode: 200, data: setting }).return(res);
      } catch (error) {
        next(error);
      }
    },
    async addDiscountTransport(req, res, next) {
      try {
        const discount = req.body;
        if (!req.company.online_sales)
          throw new BaseError({
            statusCode: 400,
            error: errorCode.client,
            errors: { logistics: errorCode['client.logisticsIsUnavailable'] }
          });
        const setting = await settingService.get(req.company._id);
        if (setting.discount_transport.length >= 3)
          throw new BaseError({
            statusCode: 400,
            error: errorCode.client,
            errors: {
              discount_transport_length: errorCode['client.companyDiscountTransportNumber']
            }
          });
        setting.discount_transport.push(discount);
        setting.discount_transport = setting.discount_transport.sort(
          (a, b) => a.order_value - b.order_value
        );
        setting.discount_transport.forEach((item, index) => {
          if (
            index > 0 &&
            item.status === 'active' &&
            setting.discount_transport[index - 1].status === 'active' &&
            item.discount_rate <= setting.discount_transport[index - 1].discount_rate
          )
            throw new BaseError({
              statusCode: 400,
              error: errorCode.client,
              errors: { order_value: errorCode['client.companyDiscountTransportMin'] }
            });
        });
        await setting.save();
        withSafety(() => {
          companyActivityService.implicitCreate(CompanyActions.setting)(req, {
            object_id: setting._id
          });
        });
        return new BaseResponse({ statusCode: 200, data: setting.discount_transport }).return(res);
      } catch (error) {
        next(error);
      }
    },
    async updateDiscountTransport(req, res, next) {
      try {
        const discount = req.body;
        const setting = await settingService.get(req.company._id);
        let discount_transport = setting.discount_transport.id(discount._id);
        if (!discount_transport)
          throw new BaseError({
            statusCode: 400,
            error: errorCode.client,
            errors: { _id: errorCode['client.global.notFound'] }
          });
        Object.assign(discount_transport, discount);
        setting.discount_transport.forEach((item, index) => {
          if (
            index > 0 &&
            item.status === 'active' &&
            setting.discount_transport[index - 1].status === 'active' &&
            item.discount_rate <= setting.discount_transport[index - 1].discount_rate
          )
            throw new BaseError({
              statusCode: 400,
              error: errorCode.client,
              errors: { order_value: errorCode['client.companyDiscountTransportMin'] }
            });
        });
        await setting.save();
        withSafety(() => {
          companyActivityService.implicitCreate(CompanyActions.setting)(req, {
            object_id: setting._id
          });
        });
        return new BaseResponse({ statusCode: 200, data: setting.discount_transport }).return(res);
      } catch (error) {
        next(error);
      }
    },
    async removeDiscountTransport(req, res, next) {
      try {
        const discount = req.body;
        const setting = await settingService.get(req.company._id);
        const discountTransport = setting.discount_transport.id(discount._id);
        discountTransport && discountTransport.remove();
        await setting.save();
        withSafety(() => {
          companyActivityService.implicitCreate(CompanyActions.setting)(req, {
            object_id: setting._id
          });
        });
        return new BaseResponse({ statusCode: 200, data: setting.discount_transport }).return(res);
      } catch (error) {
        next(error);
      }
    }
  }
};
