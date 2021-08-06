import { Router } from 'express';
import menuValidation from './menu.validation';
import { isValid, auth } from '../../commons/middlewares';
import menuController from './menu.controller';

const router = Router();
const companyRouter = Router();

companyRouter.post('/', isValid(menuValidation.company.create), menuController.company.create);
companyRouter
  .route('/:id')
  .put(isValid(menuValidation.company.update), menuController.company.update)
  .delete(isValid(menuValidation.company.delete), menuController.company.delete);

router.get('/id/:id', auth.isAuthorized, isValid(menuValidation.getById), menuController.getById);
router.get(
  '/store/:id',
  auth.isAuthorized,
  isValid(menuValidation.getByStoreId),
  menuController.getByStoreId
);
router.get('/', auth.isAuthorized, isValid(menuValidation.get), menuController.get);

router.use(
  '/company',
  auth.isAuthorized,
  auth.isCompanyModPermission,
  auth.canCompanyEnter('approved'),
  companyRouter
);

export { router as menuRouter };
