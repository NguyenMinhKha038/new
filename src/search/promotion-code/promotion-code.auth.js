import { BaseError, errorCode } from '../../commons/utils';

const isUsable = (start_at, expire_at) => {
  let currentTime = new Date();
  if (currentTime < start_at)
    throw new BaseError({
      statusCode: 401,
      error: errorCode.authorization,
      errors: {}
    }).addMeta({ message: 'coming soon, not ready' });
  if (currentTime > expire_at)
    throw new BaseError({
      statusCode: 401,
      error: errorCode.authorization,
      errors: {}
    }).addMeta({ message: 'too late, time is expired' });
  return true;
};

export default {
  isUsable
};
