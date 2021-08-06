import { Router } from 'express';
import sharePageController from './share-page.controller';

const router = Router();

router.get('/company/:company_id', sharePageController.company.get);

export { router as sharePageRouter };
