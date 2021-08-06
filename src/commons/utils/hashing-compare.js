import bcrypt from 'bcrypt';
import logger from './winston-logger';
import BaseError from './base-error';

export default {
  /**
   *
   * @param {string} input  input string to compare
   * @param {string} encrypt hash string
   */
  async compareHashCode(input, encrypt) {
    try {
      if (!input || !encrypt) return false;
      return await bcrypt.compare(input, encrypt);
    } catch (err) {
      logger.error(err);
      throw new BaseError({
        statusCode: 500,
        error: 'cannot compare string',
        errors: err
      });
    }
  },
  /**
   *
   * @param {string} value
   */
  async hashing(value) {
    try {
      return await bcrypt.hash(value, 10);
    } catch (err) {
      logger.error(err);
      throw new BaseError({
        statusCode: 500,
        error: 'cannot hashing string',
        errors: err
      });
    }
  }
};
