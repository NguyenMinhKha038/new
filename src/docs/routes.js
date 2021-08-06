import { Router } from 'express';
import basicAuth from 'express-basic-auth';
import swaggerUi from 'swagger-ui-express';
import swaggerDocumentV1 from './search.json';
import swaggerDocumentV2 from './v2';

const docsRouter = Router();
const router = Router();

docsRouter.use('/v1', swaggerUi.setup(swaggerDocumentV1));

docsRouter.use('/v2', swaggerUi.setup(swaggerDocumentV2));

docsRouter.use('/', (req, res) => res.redirect('/docs/v2'));

router.use(
  '/',
  basicAuth({ challenge: true, users: { admin: 'codosa' } }),
  swaggerUi.serve,
  docsRouter
);

export default router;
