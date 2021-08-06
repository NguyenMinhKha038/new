import errorCode from './error-code';
import { invert } from 'lodash';

const invertedErrorCode = invert(errorCode);

class BaseError extends Error {
  constructor({ statusCode, error, errors, message }) {
    super();
    if (!statusCode) {
      throw new Error('create error failure');
    }
    this.statusCode = statusCode;
    this.error = error;
    this.message = message;
    !this.message &&
      (this.message =
        (errors &&
          !isNaN(Object.values(errors)[0]) &&
          invertedErrorCode[Object.values(errors)[0]]) ||
        '');
    this.errors = errors;
  }
  addMeta(meta) {
    Object.assign(this, meta);
    if (!this.message) this.message = '';
    return this;
  }
  return(res) {
    return res.status(this.statusCode).json(this);
  }
}
export default BaseError;
