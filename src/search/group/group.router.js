import { Router } from 'express';
import groupController from './group.controller';
import { isValid, sanitizeRequestBody, auth } from '../../commons/middlewares';
import groupValidation from './group.validation';

const router = Router();
const userRouter = Router();
const companyRouter = Router();
const mallRouter = Router();

// User --
userRouter.get('/', isValid(groupValidation.get), groupController.user.get);
userRouter.get('/:id', isValid(groupValidation.getById), groupController.user.getById);
// --

// Company --
companyRouter
  .route('/')
  .get(isValid(groupValidation.get), groupController.company.get)
  .post(
    sanitizeRequestBody,
    isValid(groupValidation.company.create),
    groupController.company.create
  );
companyRouter
  .route('/:id')
  .get(isValid(groupValidation.getById), groupController.company.getById)
  .put(sanitizeRequestBody, isValid(groupValidation.company.update), groupController.company.update)
  .delete(isValid(groupValidation.company.delete), groupController.company.delete);
// --

router.use('/user', auth.isAuthorized, userRouter);
router.use('/company', auth.isAuthorized, auth.isCompanyModPermission, companyRouter);

export { router as groupRouter };
