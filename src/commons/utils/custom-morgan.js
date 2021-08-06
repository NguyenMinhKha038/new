import morgan from 'morgan';
import logger from './winston-logger';

export default morgan(function (tokens, req, res) {
  const message = [
    tokens.method(req, res),
    tokens.url(req, res),
    tokens.status(req, res),
    tokens.res(req, res, 'content-length'),
    '-',
    tokens['response-time'](req, res),
    'ms'
  ].join(' ');
  logger.info(message, {
    body: req.body,
    ...(req.user ? { user_id: req.user.id } : {}),
    ...(req.company ? { company_id: req.company.id } : {})
  });
});
