import BaseError from '../utils/base-error';
import logger from '../utils/winston-logger';

const isDev = process.env.NODE_ENV === 'development';

export const catcher = (req, res, next) => {
  next(new BaseError({ statusCode: 404, message: 'not found' }));
};

export const handler = (error, req, res, next) => {
  Object.assign(error, {
    ...(req.user ? { user_id: req.user.id } : {}),
    ...(req.company ? { company_id: req.company.id } : {})
  });
  logger.error(error);
  if (error instanceof BaseError && error.statusCode) {
    res.status(error.statusCode).json(error);
  } else {
    res.status(500).json(new BaseError({ statusCode: 500, ...(isDev && { errors: error.stack }) }));
  }
};

export default { catcher, handler };
