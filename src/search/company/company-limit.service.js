import configService from '../../commons/config/config.service';
import { logger, BaseError, errorCode } from '../../commons/utils';
import notificationService from '../notification/notification.service';
import productStoringService from '../product-storing/product-storing.service';
import productService from '../product/product.service';
import storeService from '../store/store.service';
import companyService from './company.service';
// import { Promise } from 'bluebird';

export default {
  //* update company on changing;
  async update(company_id) {
    logger.info('updateCompanyLimit');
    const company = await companyService.findOne({ _id: company_id }, '+wallet');
    if (!company)
      throw new BaseError({
        statusCode: 400,
        error: errorCode.client,
        errors: { company_id: errorCode['client.companyNotExist'] }
      });
    if (company.is_lucky) return logger.info('lucky shopping company');
    await productStoringService.updateByPromotion(company_id);
    // await productService.updateByProductStoring(company_id);
    // await storeService.updateByPromotion(company_id);
    const update = await this.warningByRefund({ company });
    await companyService.update(company.id, update);
  },
  async warningByBalanceLimit({ company }) {
    const max = await companyService.getMaxPromotionValue(company._id);
    const setting = await configService.get('company_limit');
    const update = max;
    const companyLimit =
      setting.find((el) => el.product_refund > max.max_refund) || setting[setting.length - 1];
    update.level = companyLimit.level;
    update.balance_limit = companyLimit.balance;
    // * if balance < 20% limit => suspend
    if (company.wallet < Math.round(companyLimit.balance * 0.2)) {
      update.status = 'suspend';
      update.notification_status = 3;
      company.notification_status !== 3 &&
        notificationService.createAndSend({
          company_id: company._id,
          type: 'company_suspend',
          user_id: company.user_id,
          title: 'Tạm ngưng doanh nghiệp!!',
          message:
            'Doanh nghiệp của bạn đã bị tạm dừng do không đủ hạn mức tối thiểu. Vui lòng nạp thêm để doanh nghiệp có thể hoạt động trở lại.'
        });
      // * if balance > 20% & <30% limit => suspend
    } else if (
      company.wallet < companyLimit.balance * 0.3 &&
      company.wallet >= companyLimit.balance * 0.2
    ) {
      update.status = 'approved';
      update.notification_status = 2;
      company.notification_status !== 2 &&
        notificationService.createAndSend({
          company_id: company._id,
          user_id: company.user_id,
          type: 'company_balance_below_30',
          title: 'Cảnh báo hạn mức doanh nghiệp',
          message:
            'Số dư doanh nghiệp của bạn đã dưới 30% hạn mức doanh nghiệp tối thiểu. Doanh nghiệp sẽ bị tạm ngưng nếu dưới 20% hạn mức.'
        });
      // * if balance > 30% & <50% limit => suspend
    } else if (
      company.wallet < companyLimit.balance * 0.5 &&
      company.wallet >= companyLimit.balance * 0.3
    ) {
      update.status = 'approved';
      update.notification_status = 1;
      company.notification_status !== 1 &&
        notificationService.createAndSend({
          company_id: company._id,
          user_id: company.user_id,
          type: 'company_balance_below_50',
          title: 'Cảnh báo hạn mức doanh nghiệp',
          message:
            'Số dư doanh nghiệp của bạn đã dưới 50% hạn mức doanh nghiệp tối thiểu. Doanh nghiệp sẽ bị tạm ngưng nếu dưới 20% hạn mức.'
        });
    } else {
      update.notification_status = 0;
      update.status = 'approved';
    }
    return update;
  },
  async warningByRefund({ company }) {
    const max = await companyService.getMaxPromotionValue(company._id);
    const setting = await configService.get('company_limit');
    const update = max;
    const companyLimit =
      setting.find((el) => el.product_refund > max.max_refund) || setting[setting.length - 1];
    update.level = companyLimit.level;
    update.balance_limit = max.max_refund;
    if (company.wallet < max.max_refund) {
      update.status = 'suspend';
      update.notification_status = 6;
      company.notification_status !== 6 &&
        notificationService.createAndSend({
          company_id: company._id,
          user_id: company.user_id,
          type: 'company_suspend',
          title: 'Tạm ngưng doanh nghiệp!!',
          message:
            'Quỹ hoàn tiền của bạn đã bị tạm khóa vì không đủ hoàn cho 1 sản phẩm hoàn tiền lớn nhất. Vui lòng nạp thêm tiền vào quỹ.'
        });
    } else if (company.wallet < max.max_refund * 2) {
      update.status = 'approved';
      update.notification_status = 5;
      company.notification_status !== 5 &&
        notificationService.createAndSend({
          company_id: company._id,
          type: 'company_balance_below_50',
          user_id: company.user_id,
          title: 'Cảnh báo quỹ hoàn tiền!',
          message: 'Quỹ hoàn tiền của bạn chỉ còn đủ hoàn cho 1 sản phẩm có giá trị hoàn lớn nhất.'
        });
    } else if (company.wallet < max.max_refund * 3) {
      update.status = 'approved';
      update.notification_status = 4;
      company.notification_status !== 4 &&
        notificationService.createAndSend({
          company_id: company._id,
          type: 'company_balance_below_50',
          user_id: company.user_id,
          title: 'Cảnh báo quỹ hoàn tiền!',
          message: 'Quỹ hoàn tiền của bạn chỉ còn đủ hoàn cho 2 sản phẩm có giá trị hoàn lớn nhất.'
        });
    } else if (company.wallet < max.max_refund * 4) {
      update.status = 'approved';
      update.notification_status = 3;
      company.notification_status !== 3 &&
        notificationService.createAndSend({
          company_id: company._id,
          type: 'company_balance_below_50',
          user_id: company.user_id,
          title: 'Cảnh báo quỹ hoàn tiền!',
          message: 'Quỹ hoàn tiền của bạn chỉ còn đủ hoàn cho 3 sản phẩm có giá trị hoàn lớn nhất.'
        });
    } else if (company.wallet < max.max_refund * 5) {
      update.status = 'approved';
      update.notification_status = 2;
      company.notification_status !== 2 &&
        notificationService.createAndSend({
          company_id: company._id,
          type: 'company_balance_below_50',
          user_id: company.user_id,
          title: 'Cảnh báo quỹ hoàn tiền!',
          message: 'Quỹ hoàn tiền của bạn chỉ còn đủ hoàn cho 4 sản phẩm có giá trị hoàn lớn nhất.'
        });
    } else if (company.wallet < max.max_refund * 6) {
      update.status = 'approved';
      update.notification_status = 1;
      company.notification_status !== 1 &&
        notificationService.createAndSend({
          company_id: company._id,
          type: 'company_balance_below_50',
          user_id: company.user_id,
          title: 'Cảnh báo quỹ hoàn tiền!',
          message: 'Quỹ hoàn tiền của bạn chỉ còn đủ hoàn cho 5 sản phẩm có giá trị hoàn lớn nhất.'
        });
    } else {
      update.notification_status = 0;
      update.status = 'approved';
    }
    return update;
  }
};
