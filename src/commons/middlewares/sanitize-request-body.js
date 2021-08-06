import { logger, BaseError, errorCode } from '../utils';
import { handleXss } from '../utils/utils';

export default function (req, res, next) {
  try {
    const rawBody = req.body;
    const sanitizedBody = handleXss(rawBody);
    req.body = sanitizedBody;

    next();
  } catch (err) {
    logger.error('sanitize request body error: %o', err);
    const error = new BaseError({
      statusCode: 500,
      error: errorCode.server,
      errors: { msg: 'something went wrong' }
    });
    next(error);
  }
}
