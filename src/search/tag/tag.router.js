import { Router } from 'express';
import tagController from './tag.controller';
import { isValid, sanitizeRequestBody, auth } from '../../commons/middlewares';
import tagValidation from './tag.validation';

const router = Router();
const userRouter = Router();
const companyRouter = Router();
const mallRouter = Router();

// Company --
companyRouter
  .route('/')
  .post(sanitizeRequestBody, isValid(tagValidation.company.create), tagController.company.create);
companyRouter
  .route('/:id')
  .put(sanitizeRequestBody, isValid(tagValidation.company.update), tagController.company.update)
  .delete(isValid(tagValidation.company.delete), tagController.company.delete);
// --

// General --
router.get('/', auth.isAuthorized, isValid(tagValidation.get), tagController.get);
router.get('/:id', auth.isAuthorized, isValid(tagValidation.getById), tagController.getById);
// --

router.use('/user', auth.isAuthorized, userRouter);
router.use('/company', auth.isAuthorized, auth.isCompanyModPermission, companyRouter);

export { router as tagRouter };
