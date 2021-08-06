import { Router } from 'express';
import companyController from './company.controller';
import { auth, isValid, upload, resize } from '../../commons/middlewares';
import companyValidation from './company.validation';

const router = Router(),
  admin = Router(),
  user = Router(),
  company = Router();

admin.get('/', isValid(companyValidation.admin.get), companyController.admin.get);
admin.get('/:id', isValid(companyValidation.admin.getById), companyController.admin.getById);
admin.put('/approve', isValid(companyValidation.admin.approve), companyController.admin.approve);
admin.post(
  '/update-limit/:id',
  isValid(companyValidation.admin.getById),
  companyController.admin.updateLimit
);

user.get('/', companyController.user.get);
user.get('/get-chat-user', companyController.user.getChatUser);
user.post('/', isValid(companyValidation.user.post), companyController.user.post);
user.post('/like', isValid(companyValidation.user.like), companyController.user.like);
user.post('/share', isValid(companyValidation.user.share), companyController.user.share);
user.post('/rate', isValid(companyValidation.user.rate), companyController.user.rate);
user.post('/follow', isValid(companyValidation.user.follow), companyController.user.follow);
user.get('/rate', isValid(companyValidation.user.getRate), companyController.user.getRate);
user.get('/follow', isValid(companyValidation.user.getFollow), companyController.user.getFollow);
user.get('/view', isValid(companyValidation.user.getFollow), companyController.user.getView);

user.post(
  '/upload/business-form',
  upload.uploadBusinessFormImageMiddleware,
  resize.resize({ width: 1000 }),
  companyController.company.upload
);

user.post(
  '/upload',
  upload.uploadCompanyImageMiddleware,
  resize.resize({ width: 500 }),
  companyController.company.upload
);
router.post(
  '/view',
  isValid(companyValidation.user.view),
  auth.noNeedAuthorized,
  companyController.user.viewsUp
);
router.get('/rate', isValid(companyValidation.getRate), companyController.getRate);

company.put('/', isValid(companyValidation.company.put), companyController.company.put);
company.put('/pin', isValid(companyValidation.company.pin), companyController.company.updatePin);
company.post('/pin', isValid(companyValidation.company.authPin), companyController.company.authPin);
company.put(
  '/reset-pin',
  isValid(companyValidation.company.resetPin),
  companyController.company.resetPin
);
company.get(
  '/follow',
  isValid(companyValidation.company.getFollow),
  companyController.company.getFollow
);
company.get(
  '/statistic',
  isValid(companyValidation.company.getStatistic),
  companyController.company.getStastic
);

router.use('/admin', auth.isAdminAuthorized, auth.isAdminPermission, admin);
router.use('/user', auth.isAuthorized, user);
router.use('/company', auth.isAuthorized, auth.isCompanyModPermission, company);

router.get('/', isValid(companyValidation.get), companyController.get);
router.get(
  '/:id',
  isValid(companyValidation.getById),
  auth.noNeedAuthorized,
  companyController.getById
);

router.post('/user-start-chat', companyController.user.startChatWithCompany);

export { router as companyRouter };
