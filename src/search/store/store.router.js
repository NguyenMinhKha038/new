import { Router } from 'express';
import { auth, isValid, sanitizeRequestBody } from '../../commons/middlewares';
import storeController from './store.controller';
import storeValidation from './store.validation';

const router = Router(),
  company = Router(),
  admin = Router();

company
  .route('/')
  .get(isValid(storeValidation.company.get), storeController.company.get)
  .post(sanitizeRequestBody, isValid(storeValidation.company.post), storeController.company.post);
company
  .route('/:id')
  .get(isValid(storeValidation.company.getById), storeController.company.getById)
  .put(sanitizeRequestBody, isValid(storeValidation.company.put), storeController.company.put);

admin.get('/', isValid(storeValidation.admin.get), storeController.admin.get);
admin.get('/:id', isValid(storeValidation.admin.getById), storeController.admin.getById);

router.use('/admin', auth.isAdminAuthorized, auth.isAdminPermission, admin);
//* not disabled or rejected
router.use(
  '/company',
  auth.isAuthorized,
  auth.isCompanyModPermission,
  auth.canCompanyEnter('approved', 'suspend', 'pending'),
  company
);

router.get('/', isValid(storeValidation.get), storeController.get);
router.get('/nearest', isValid(storeValidation.getNearest), storeController.getNearest);
router.get('/:id', isValid(storeValidation.getById), storeController.getById);

export { router as storeRouter };
