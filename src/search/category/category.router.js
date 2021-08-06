import { Router } from 'express';
import categoryValidation from './category.validation';
import categoryController from './category.controller';
import { isValid, auth, upload, resize } from '../../commons/middlewares';

const router = Router(),
  admin = Router(),
  company = Router();

admin.get('/', isValid(categoryValidation.admin.get), categoryController.admin.get);
admin.post('/', isValid(categoryValidation.admin.post), categoryController.admin.post);
admin.get('/:id', isValid(categoryValidation.admin.getById), categoryController.admin.getById);
admin.put('/:id', isValid(categoryValidation.admin.put), categoryController.admin.put);
admin.delete('/:id', isValid(categoryValidation.admin.delete), categoryController.admin.delete);
admin.post('/image', upload.uploadCategoryMiddleware, resize.resize(), categoryController.upload);

company.post('/', isValid(categoryValidation.company.post), categoryController.company.post);

router.use('/admin', auth.isAdminAuthorized, auth.isAdminPermission, admin);
router.use('/company', auth.isAuthorized, auth.isCompanyModPermission, company);
router.get('/', isValid(categoryValidation.get), categoryController.get);
router.get('/:id', isValid(categoryValidation.getById), categoryController.getById);

export { router as categoryRouter };
export default router;
