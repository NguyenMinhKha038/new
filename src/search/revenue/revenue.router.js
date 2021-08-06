import { Router } from 'express';
import revenueController from './revenue.controller';
import { auth, isValid } from '../../commons/middlewares';
import revenueValidation from './revenue.validation';

const router = Router(),
  company = Router(),
  admin = Router();

company.get('/', isValid(revenueValidation.company.get), revenueController.get);
company.get(
  '/by-time-type',
  isValid(revenueValidation.company.getByTimeType),
  revenueController.getByTimeType
);
company.get('/statics', isValid(revenueValidation.company.statics), revenueController.statistic);
company.get('/total', isValid(revenueValidation.company.statics), revenueController.getTotal);
company.get(
  '/statics-store',
  isValid(revenueValidation.company.statics),
  revenueController.statisticStore
);
company.get(
  '/statics-store-dates',
  isValid(revenueValidation.company.staticsStoreDate),
  revenueController.statisticStoreDates
);
company.get(
  '/menu/period',
  isValid(revenueValidation.company.menuRevenueByPeriod),
  revenueController.menuRevenueByPeriod
);
company.get(
  '/menu/date',
  isValid(revenueValidation.company.menuRevenueByDate),
  revenueController.menuRevenueByDate
);
company.get('/:id', isValid(revenueValidation.getById), revenueController.getById);

admin.get('/', isValid(revenueValidation.admin.get), revenueController.get);
admin.get(
  '/statistic-company-date',
  isValid(revenueValidation.admin.statisticCompanyDate),
  revenueController.statisticCompanyDates
);
admin.get('/:id', isValid(revenueValidation.getById), revenueController.getById);

router.use('/company', auth.isAuthorized, auth.isCompanyModPermission, company);
router.use('/admin', auth.isAdminAuthorized, auth.isAdminPermission, admin);

export { router as revenueRouter };
