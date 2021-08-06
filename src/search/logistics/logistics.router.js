import { Router } from 'express';
import { auth, isValid } from '../../commons/middlewares';
import logisticsController from './logistics.controller';
import logisticsValidation from './logistics.validation';

const router = Router(),
  admin = Router(),
  company = Router(),
  user = Router();

company.get('/', isValid(logisticsValidation.company.get), logisticsController.company.get);
company.put('/', isValid(logisticsValidation.company.put), logisticsController.company.put);
company.get('/available', logisticsController.company.getAvailable);
user.get(
  '/available',
  isValid(logisticsValidation.user.getAvailable),
  logisticsController.user.getAvailable
);
router.use('/company', auth.isAuthorized, auth.isCompanyModPermission, company);
router.use('/user', user);

router.post('/hooks/ghn', logisticsController.ghnHook);

export { router as logisticsRouter };
