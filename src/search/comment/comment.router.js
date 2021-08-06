import { Router } from 'express';
import commentController from './comment.controller';
import commentValidation from './comment.validation';
import { auth, isValid } from '../../commons/middlewares';

const router = Router(),
  user = Router(),
  company = Router(),
  admin = Router();

user.get('/', isValid(commentValidation.user.get), commentController.user.getPersonal);
user.post('/', isValid(commentValidation.user.postComment), commentController.user.postComment);
user.post('/reply', isValid(commentValidation.user.postReply), commentController.user.postReply);
user.put('/', isValid(commentValidation.user.putComment), commentController.user.put);
user.delete('/:id', isValid(commentValidation.user.delete), commentController.user.delete);

company.get('/', isValid(commentValidation.company.get), commentController.company.get);

admin.get('/', isValid(commentValidation.admin.get), commentController.admin.get);
admin.post('/approve', isValid(commentValidation.admin.approve), commentController.admin.approve);

router.use('/user', auth.isAuthorized, user);
router.use('/company', auth.isAuthorized, auth.isCompanyModPermission, company);
router.use('/admin', auth.isAdminAuthorized, auth.isAdminPermission, admin);
router.get(
  '/product/:product_id',
  isValid(commentValidation.common.getByProductId),
  commentController.common.getByProductId
);
router.get(
  '/:comment_id',
  isValid(commentValidation.common.getById),
  commentController.common.getById
);
router.get(
  '/:comment_id/reply',
  isValid(commentValidation.common.getReply),
  commentController.common.getReply
);

export { router as commentRouter };
