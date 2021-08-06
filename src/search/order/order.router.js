import { Router } from 'express';
import orderController from './order.controller';
import { auth, isValid, joiValidate } from '../../commons/middlewares';
import orderValidation from './order.validation';
import { orderRouterV2 } from './v2/order.router';

const router = Router(),
  user = Router(),
  company = Router(),
  admin = Router();

user.get(
  '/count-status',
  isValid(orderValidation.user.countStatus),
  orderController.user.countStatus
);
user.get(
  '/offline/get-unconfirmed',
  isValid(orderValidation.user.getUnconfirmed),
  orderController.user.getUnconfirmed
);
user.get('/', isValid(orderValidation.user.get), orderController.user.get);
user.get('/:code', isValid(orderValidation.user.getByCode), orderController.user.getByCode);
user.put('/:code', isValid(orderValidation.user.put), orderController.user.put);
user.post('/pay/:code', isValid(orderValidation.user.pay), orderController.user.pay);
user.post('/', isValid(orderValidation.user.post), orderController.user.post);
user.post(
  '/offline/confirm/:code',
  isValid(orderValidation.user.confirm),
  orderController.user.confirm
);
user.post(
  '/offline/confirm-and-pay/:code',
  isValid(orderValidation.user.confirmAndPay),
  orderController.user.confirmAndPay
);
user.post('/confirm-received/:code', orderController.user.confirmReceived);

company.get(
  '/statistic-product',
  isValid(orderValidation.company.statisticProduct),
  orderController.company.getStatisticByProduct
);
company.get(
  '/statistic-customer',
  joiValidate.validate('query', orderValidation.company.statisticCustomer),
  orderController.company.getStatisticByCustomerOrStore
);
company.get('/', isValid(orderValidation.company.get), orderController.company.get);
company.get('/v2', isValid(orderValidation.company.get_v2), orderController.company.get_v2);
company.get(
  '/:code',
  isValid(orderValidation.company.getByCode),
  orderController.company.getByCode
);
company.post(
  '/confirm',
  auth.canCompanyEnter('approved', 'suspend'),
  isValid(orderValidation.company.confirm),
  orderController.company.confirm
);
company.post(
  '/offline/confirm',
  auth.canCompanyEnter('approved'),
  isValid(orderValidation.company.confirmOffline),
  orderController.company.confirmOffline
);
company.put(
  '/offline/update-order-status/:code',
  isValid(orderValidation.company.updateOfflineOrderStatus),
  orderController.company.updateOfflineOrderStatus
);
company.post(
  '/',
  auth.canCompanyEnter('approved'),
  isValid(orderValidation.company.post),
  orderController.company.postV2
);
company.post('/pay/:code', isValid(orderValidation.company.pay), orderController.company.pay);
company.put('/:code', isValid(orderValidation.company.put), orderController.company.put);

admin.get('/', isValid(orderValidation.admin.get), orderController.admin.get);
admin.get('/statistic', isValid(orderValidation.admin.statistic), orderController.admin.statistic);
admin.get('/:code', isValid(orderValidation.admin.getByCode), orderController.admin.getByCode);
admin.get(
  '/:code/logistics',
  isValid(orderValidation.admin.getByCode),
  orderController.admin.getLogisticsOrder
);
admin.post('/pay-fee', isValid(orderValidation.admin.payFee), orderController.admin.payFee);
admin.post('/approve', isValid(orderValidation.admin.approve), orderController.admin.approve);

router.use('/user', auth.isAuthorized, user);
router.use('/admin', auth.isAdminAuthorized, auth.isAdminPermission, admin);
//* only approved
router.use('/company', auth.isAuthorized, auth.isCompanyModPermission, company);

// V2
router.use('/v2', orderRouterV2);

export { router as orderRouter };
