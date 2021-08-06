import router from './auth.router';
import service from './auth.service';
import facebookService from './facebook.service';
export { router as authRouter, service as authService, facebookService };
export default {
  router,
  service,
  facebookService
};
