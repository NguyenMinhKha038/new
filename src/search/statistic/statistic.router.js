import { Router } from 'express';
import statisticController from './statistic.controller';
import { auth, isValid } from '../../commons/middlewares';
import statisticValidation from './statistic.validation';

const router = Router(),
  admin = Router();

admin.get('/', isValid(statisticValidation.admin.get), statisticController.get);
admin.get('/statics', isValid(statisticValidation.admin.statics), statisticController.statistic);
admin.get(
  '/time-type',
  isValid(statisticValidation.statisticByTimeType),
  statisticController.statisticByTimeType
);
admin.get('/:id', isValid(statisticValidation.getById), statisticController.getById);

router.use('/admin', auth.isAdminAuthorized, auth.isAdminPermission, admin);

export { router as statisticRouter };
