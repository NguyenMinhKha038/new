import { Router } from 'express';
import { auth, isValid } from '../../commons/middlewares';
import searchValidation from './search.validation';
import searchController from './search.controller';

const router = Router();
const admin = Router();
const company = Router();

router.get('/', isValid(searchValidation.get), searchController.get);
router.get('/auto-complete', isValid(searchValidation.autoComplete), searchController.autoComplete);
router.get(
  '/coordinates',
  isValid(searchValidation.getCoordinates),
  searchController.getCoordinates
);
router.get('/address', isValid(searchValidation.getAddress), searchController.getAddress);

admin.get(
  '/text-search',
  isValid(searchValidation.admin.getByName),
  searchController.admin.getByName
);

company.get(
  '/text-search',
  isValid(searchValidation.admin.getByName),
  searchController.company.getByName
);

router.use('/admin', auth.isAdminAuthorized, auth.isAdminPermission, admin);
router.use('/company', auth.isAuthorized, company);

export { router as searchRouter };
