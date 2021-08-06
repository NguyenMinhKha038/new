import BaseError from './base-error';
import errorCode from './error-code';

export const checkRole = (mall, role) => {
  if (mall.type !== role) {
    throw new BaseError({
      statusCode: 400,
      error: errorCode.authorization,
      errors: {
        unAuthorized: errorCode['auth.unAuthorized']
      }
    });
  }
  return;
};
