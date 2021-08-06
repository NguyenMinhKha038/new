import { Router } from 'express';
import followingController from './following.controller';
import { auth, isValid } from '../../commons/middlewares';
import followingValidation from './following.validation';

const router = Router(),
  user = Router(),
  admin = Router();

user.get('/', isValid(followingValidation.get), followingController.get);
user.post('/', isValid(followingValidation.post), followingController.post);
user.delete('/', isValid(followingValidation.delete), followingController.delete);

router.use('/user', auth.isAuthorized, user);

export { router as followingRouter };
