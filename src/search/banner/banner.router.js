import { Router } from 'express';
import validation from './banner.validation';
import isValid from '../../commons/middlewares/validator';
import controller from './banner.controller';
import { auth, upload, resize } from '../../commons/middlewares';

const router = Router(),
  admin = Router(),
  company = Router();

company.get('/', isValid(validation.company.get), controller.company.get);
company.get('/:id', isValid(validation.company.getById), controller.company.getById);
company.post('/', isValid(validation.company.post), controller.company.post);
company.post(
  '/image',
  upload.uploadBannerImageMiddleWare,
  resize.resize({ width: 500, height: 250 }),
  controller.company.upload
);
company.put('/:id', isValid(validation.company.put), controller.company.put);

admin.get('/', isValid(validation.admin.get), controller.admin.get);
admin.post('/', isValid(validation.admin.post), controller.admin.post);
admin.put('/:id', isValid(validation.admin.put), controller.admin.put);
admin.get('/:id', isValid(validation.admin.getById), controller.admin.getById);
admin.put('/approve/:id', isValid(validation.admin.approve), controller.admin.approve);
//*must be approved
router.use(
  '/company',
  auth.isAuthorized,
  auth.isCompanyModPermission,
  auth.canCompanyEnter('approved'),
  company
);
router.use('/admin', auth.isAdminAuthorized, auth.isAdminPermission, admin);
router.get('/', isValid(validation.get), controller.get);
router.get('/slot', isValid(validation.company.getSlot), controller.company.getSlot);
router.get('/:id', isValid(validation.getById), controller.getById);

export { router as bannerRouter };
