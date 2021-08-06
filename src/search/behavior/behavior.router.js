import { Router } from 'express';
import behaviorController from './behavior.controller';
import behaviorValidation from './behavior.validation';
import { auth, isValid } from '../../commons/middlewares';

const router = Router();

router.get(
  '/admin',
  auth.isAdminAuthorized,
  auth.isAdminPermission,
  isValid(behaviorValidation.get),
  behaviorController.get
);

router.get(
  '/admin/:id',
  auth.isAdminAuthorized,
  auth.isAdminPermission,
  isValid(behaviorValidation.getById),
  behaviorController.getById
);

export { router as behaviorRouter };
