import { Router } from 'express';
import addressController from './address.controller';
import { auth, isValid } from '../../commons/middlewares';
import addressValidation from './address.validation';

const router = Router(),
  user = Router();

user.get('/', addressController.get);
user.post('/', isValid(addressValidation.post), addressController.post);
user.put('/:id', isValid(addressValidation.put), addressController.put);
user.delete('/:id', isValid(addressValidation.delete), addressController.delete);

router.use('/user', auth.isAuthorized, user);

export { router as addressRouter };
