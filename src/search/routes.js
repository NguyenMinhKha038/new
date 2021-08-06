import { Router } from 'express';
import { auth, imageHandler, isValid, resize, upload } from '../commons/middlewares';
import uploadImage from '../commons/utils/uploadImage';
import { addressRouter } from './address/address.router';
import { adminBankRouter } from './admin-bank/admin-bank.router';
import { bannerRouter } from './banner/banner.router';
import { behaviorRouter } from './behavior/behavior.router';
import { cartRouter } from './cart/cart.router';
import { categoryRouter } from './category/category.router';
import { commentRouter } from './comment/comment.router';
import { companyBankRouter } from './company-banks/companyBank.router';
import { companyHistoryRouter } from './company-history/company-history.router';
import { companyRouter } from './company/company.router';
import { transactionRouter } from './deposit-withdraw/deposit-withdraw.router';
import { followingRouter } from './following/following.router';
import { logisticsRouter } from './logistics/logistics.router';
import { luckyShoppingRouter } from './lucky-shopping/lucky-shopping.router';
import { companyMoneyFlowRouter } from './money-flow/company-money-flow.router';
import { notificationRouter } from './notification/notification.router';
import { orderCachingRouter } from './order-caching/order-caching.router';
import { orderRouter } from './order/order.router';
import { paymentGateWayRouter } from './payment-gateway/payment-gateway.router';
import { paymentRouter } from './payment/payment.router';
import { paymentCodeRouter } from './payment_code/payment-code.router';
import { searchPermissionGroupRouter } from './permission-group/permission-group.router';
import { searchPermissionRouter } from './permission/permission.router';
import { productStoringRouter } from './product-storing/product-storing.route';
import { productRouter } from './product/product.router';
import { promotionCodeRouter } from './promotion-code/promotion-code.router';
import { promotionProductStatisticRouter } from './promotion-product-statistic/promotionProduct.router';
import { promotionRouter } from './promotion/promotion.router';
import { provinceRouter } from './province/province.router';
import { ReportRouter } from './report/report.router';
import { revenueRouter } from './revenue/revenue.router';
import { searchRouter } from './search/search.router';
import { settingRouter } from './setting/setting.router';
import { statisticRouter } from './statistic/statistic.router';
import { storeRouter } from './store/store.router';
import { transferRouter } from './transfer/transfer.router';
import { userHistoryRouter } from './user-history/user-history.router';
import { billRouter } from './bill/bill.router';
import { userBankRouter } from './user-banks/user-bank.router';
import { topupRouter } from './topup/topup.router';
import { transactionCountRouter } from './transaction-count/transaction-count.router';
import { productStockHistoryRouter } from './product-stock-history/product-stock-history.route';
import { globalPromotionRouter } from './global-promotion/global-promotion.router';
import { globalPromotionRegistrationRouter } from './global-promotion-registration/global-promotion-registration.router';
import { recommendRouter } from './recommend/recommend.router';
import { stockRouter } from './stock/stock.router';
import companyActivityRouter from './company-activity/company-activity.router';
import { bankRouter } from './banks/bank.router';
import { providerRouter } from './provider/provider.router';
import { goodsBatchRouter } from './goods-batch/goods-batch.router';
import { summallRouter } from './sum-mall/sum-mall.routes';
import { warehouseRouter } from './warehouse/warehouse.router';
import { warehouseStoringRouter } from './warehouse-storing/warehouse-storing.router';
import { companyScheduleRouter } from './company-schedule/company-schedule.router';
import { sellingOptionRouter } from './selling-option/selling-option.router';
import { buyerRouter } from './buyer/buyer.router';
import { tagRouter } from './tag/tag.router';
import { groupRouter } from './group/group.router';
import { productAttributeRouter } from './product-attribute/product-attribute.router';
import { productTemplateRouter } from './product-template/product-template.router';
import { productStockTrackingRouter } from './product-stock-tracking/product-stock-tracking.router';
import { stockCheckingRouter } from './stock-checking/stock-checking.router';
import { stockCheckingItemRouter } from './stock-checking-item/stock-checking-item.router';

const router = Router();
router.use('/search', searchRouter);
router.use('/category', categoryRouter);
router.use('/company', companyRouter);
router.use('/store', storeRouter);
router.use('/product', productRouter);
router.use('/banner', bannerRouter);
router.use('/permission', searchPermissionRouter);
router.use('/promotion', promotionRouter);
router.use('/promotion-code', promotionCodeRouter);
router.use('/following', followingRouter);
router.use('/setting', settingRouter);
router.use('/order-caching', orderCachingRouter);
router.use('/order', orderRouter);
router.use('/comment', commentRouter);
router.use('/behavior', behaviorRouter);
router.use('/history', userHistoryRouter);
router.use('/company-history', companyHistoryRouter);
router.use('/revenue', revenueRouter);
router.use('/permission-group', searchPermissionGroupRouter);
router.use('/cart', cartRouter);
router.use('/deposit-withdraw', transactionRouter);
router.use('/transfer', transferRouter);
router.use('/payment', paymentRouter);
router.use('/province', provinceRouter);
router.use('/address', addressRouter);
router.use('/admin-bank', adminBankRouter);
router.use('/report', ReportRouter);
router.use('/statistic', statisticRouter);
router.use('/payment_code', paymentCodeRouter);
router.use('/notification', notificationRouter);
router.use('/product-storing', productStoringRouter);
router.use('/promotion-product-statistic', promotionProductStatisticRouter);
router.use('/company-bank', companyBankRouter);
router.use('/logistics', logisticsRouter);
router.use('/user-bank', userBankRouter);
router.use('/transaction-count', transactionCountRouter);
router.use('/product-stock-history', productStockHistoryRouter);
router.use('/global-promotion', globalPromotionRouter);
router.use('/global-promotion-registration', globalPromotionRegistrationRouter);
router.use('/recommend', recommendRouter);
router.use('/stock', stockRouter);
router.use('/company-activity', companyActivityRouter);
router.use('/provider', providerRouter);
router.use('/goods-batch', goodsBatchRouter);
router.use('/warehouse', warehouseRouter);
router.use('/warehouse-storing', warehouseStoringRouter);
router.use('/sum-mall', summallRouter);
router.use('/company-schedule', companyScheduleRouter);
router.use('/selling-option', sellingOptionRouter);
router.use('/buyer', buyerRouter);
router.use('/tag', tagRouter);
router.use('/group', groupRouter);
router.use('/product-attribute', productAttributeRouter);
router.use('/product-template', productTemplateRouter);
router.use('/product-stock-tracking', productStockTrackingRouter);
router.use('/stock-checking', stockCheckingRouter);
router.use('/stock-checking-item', stockCheckingItemRouter);
router.post(
  '/upload-images',
  auth.isAuthorized,
  upload.uploadImage,
  resize.resize({ width: 500 }),
  uploadImage.uploadImage
);
router.post(
  '/v2/upload-images',
  isValid(imageHandler.imageValidation),
  auth.isUserOrAdminAuthorized,
  upload.uploadImage,
  imageHandler.resizeImage
);
router.post(
  '/upload-private-images',
  auth.isAuthorized,
  upload.uploadPrivateImageMiddleWare,
  resize.resize({ width: 500 }),
  uploadImage.uploadImage
);
router.use('/company-money-flow', companyMoneyFlowRouter);
router.use('/payment-gateway', paymentGateWayRouter);
router.use('/lucky-shopping', luckyShoppingRouter);
router.use('/bill', billRouter);
router.use('/topup', topupRouter);
router.use('/bank', bankRouter);

export default router;
