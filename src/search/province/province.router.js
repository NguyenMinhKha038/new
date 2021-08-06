import { Router } from 'express';
import provinceController from './province.controller';
import { isValid } from '../../commons/middlewares';
import provinceValidation from './province.validation';

const router = Router();

router.get('/', isValid(provinceValidation.get), provinceController.get);

export { router as provinceRouter };
