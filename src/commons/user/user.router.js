import express from 'express';
import userController from './user.controller';
import adminUserController from './user.admin.controller';
import { auth, joiValidate } from '../middlewares';
import userValidate from './user.validate';
import phoneFormat from '../middlewares/phone.format';

const router = express.Router();

const user = express.Router();

const admin = express.Router();

user.get('/get-user-info', userController.getUserInfo);
user.get('/get-chat-user', userController.getChatUser);

user.get('/count-statistic-explore', userController.countStatisticExplore);

user.get(
  '/get-ref-users',
  phoneFormat.phoneFormat('query', 'phone'),
  joiValidate.validate('query', userValidate.user.getRefUsers),
  userController.getRefUserOfOne
);

user.get(
  '/specific-field',
  joiValidate.validate('query', userValidate.user.specificFieldSchema),
  userController.checkStatusUserBySpecificFields
);

user.get(
  '/:phone',
  phoneFormat.phoneFormat('params', 'phone'),
  joiValidate.validate('params', userValidate.user.findByPhone),
  userController.getByPhone
);

user.post(
  '/update-user-info',
  joiValidate.validate('body', userValidate.user.updateinformation),
  userController.updateUserInfo
);

// user.post('/update-KYC', upload.uploadPicturePrivateMiddleware, resize(), userController.updateUserKyc);
user.post(
  '/update-KYC',
  joiValidate.validate('body', userValidate.user.userKYC),
  userController.updateUserKyc
);
user.put(
  '/update-KYC-raw',
  joiValidate.validate('body', userValidate.user.updateKYC),
  userController.updateKYCRaw
);
user.post(
  '/enter-ref-code',
  joiValidate.validate('body', userValidate.user.refCode),
  userController.updateRefPoint
);

user.post('/auth-pin', joiValidate.validate('body', userValidate.user.Pin), userController.authPin);
user.post(
  '/pin',
  joiValidate.validate('body', userValidate.user.updatePin),
  userController.updatePin
);

user.put(
  '/change-pass',
  joiValidate.validate('body', userValidate.user.changePass),
  userController.changePass
);

user.put(
  '/reset-pin',
  joiValidate.validate('body', userValidate.user.resetPin),
  userController.resetPin
);

//admin
admin.get(
  '/get-users',
  joiValidate.validate('query', userValidate.admin.findSchema),
  adminUserController.getUsers
);

admin.get(
  '/raw-users',
  joiValidate.validate('query', userValidate.admin.rawAdminFind),
  adminUserController.rawGetUsers
);

admin.get(
  '/get-user',
  joiValidate.validate('query', joiValidate.idSchema),
  adminUserController.getOneById
);

admin.get('/get-by-status', adminUserController.getUserByStatus);

admin.get(
  '/get-between-period',
  joiValidate.validate('query', userValidate.admin.periodTime),
  adminUserController.getRegisterBetweenPeriodTime
);

admin.get(
  '/get-ref-users-between-period',
  joiValidate.validate('query', userValidate.admin.periodTime),
  adminUserController.getRefBetweenPeriodTime
);

admin.get(
  '/:phone',
  phoneFormat.phoneFormat('params', 'phone'),
  joiValidate.validate('params', userValidate.admin.findByPhone),
  adminUserController.getUserByPhone
);

// admin.get
//post
admin.post(
  '/check-KYC',
  joiValidate.validate('body', userValidate.admin.adminUpdateStatusKYC),
  adminUserController.checkKYC
);

admin.post(
  '/update-status',
  joiValidate.validate('body', userValidate.admin.statusUser),
  adminUserController.updateStatusUser
);

router.use('/admin', auth.isAdminAuthorized, auth.isAdminPermission, admin);
router.use('/', auth.isAuthorized, user);

export { router as userRouter };
