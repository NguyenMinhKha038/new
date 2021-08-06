import bodyParser from 'body-parser';
import cors from 'cors';
import express, { json, urlencoded } from 'express';
import path, { join } from 'path';
import docsRouter from './docs/routes';
import { database, middlewares } from './commons';
import adminService from './commons/admin/admin.service';
import { configService } from './commons/config';
import { error } from './commons/middlewares';
import over from './commons/over_function/over';
import permissionService from './commons/permission/permission.service';
import { sharePageRouter } from './commons/share-page/share-page.router';
import { getDate, logger } from './commons/utils';
import customMorgan from './commons/utils/custom-morgan';
import router from './routes';
import categoryJob from './search/category/category.job';
import categoryService from './search/category/category.service';
import luckyShoppingHandler from './search/lucky-shopping/lucky-shopping.handler';
import companyPermissionService from './search/permission/permission.service';
import topupJob from './search/topup/topup.job';
import promotionJob from './search/promotion/promotion.job';
import workScheduleJob from './search/sum-mall/work-schedule/work-schedule.job';
import appVersion from './commons/middlewares/app-version';
import productService from './search/product/v2/product.service';

logger.info('Env version %s', process.env.ENV_VERSION);
console.log('Env version', process.env.ENV_VERSION);
console.log('Node version', process.version);

const app = express();
app.use('*', cors());
// auth.facebookService.init();
database.service.connect();
middlewares.auth.init();
topupJob.startTopupComboJob();
categoryJob.startCheckCategoryHasProductJob();
promotionJob.startCheckPromotion();
workScheduleJob.startAddSchedule();

app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

// docs
app.use('/docs', docsRouter);

app.use('/api', appVersion.setAppVersion, customMorgan, router);
app.use(json());
app.use(urlencoded({ extended: false }));

app.use('/public', express.static(join(__dirname, '../public')));
app.use('/.well-known', express.static(join(__dirname, '../public/.well-known')));
app.use(
  '/private',
  middlewares.auth.isUserOrAdminAuthorized,
  middlewares.auth.canGetKYC,
  express.static(join(__dirname, '../private'))
);
// app.use('/backend-assets', express.static(join(__dirname, '../assets')));

app.use('/share', sharePageRouter);

app.use('/pages', express.static(join(__dirname, '../assets/pages')));

app.set('assets', path.join(__dirname, 'assets'));

const initServer = async () => {
  try {
    logger.info('Start Date, %s', getDate());
    let [permissions, companyPermissions, admin, category] = await Promise.all([
      permissionService.findAll(),
      companyPermissionService.find(),
      adminService.findOne({ user_name: process.env.ADMIN_USER_NAME }),
      categoryService.find({}),
      luckyShoppingHandler.init()
    ]);
    if (!permissions || permissions.length == 0) {
      const permissionsList = require('../assets/permission.json');
      await permissionService.insertMany(permissionsList);
      logger.info('INIT PERMISSION SUCCESS');
    }
    if (!companyPermissions || companyPermissions.length == 0) {
      const companyPermissionList = require('../assets/company-permission.json');
      await companyPermissionService.insertMany(companyPermissionList);
      logger.info('INIT COMPANY PERMISSION SUCCESS');
    }
    const configList = require('../assets/config.json');
    await configService.updateMany(configList);
    logger.info('INIT CONFIGS SUCCESS');
    await configService.sync();

    if (!category || category.length == 0) {
      const categoryList = require('../assets/category.json');
      await categoryService.insertMany(categoryList);
      logger.info('INIT CATEGORY');
    }
    if (!admin) {
      const defaultAdmin = {
        user_name: process.env.ADMIN_USER_NAME,
        name: process.env.ADMIN_USER_NAME,
        email: process.env.ADMIN_USER_EMAIL,
        password: process.env.ADMIN_USER_PASSWORD,
        permission_codes: [1],
        token: over.randomText(40),
        status: 'active'
      };

      await adminService.create(defaultAdmin);
      logger.info('INIT ADMIN SUCCESS');
    }
  } catch (err) {
    logger.error(err);
  }
};

initServer();
appVersion.initAppVersion();

app.use(error.catcher, error.handler);
module.exports = app;
