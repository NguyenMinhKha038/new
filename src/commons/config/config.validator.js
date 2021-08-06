import Joi from '@hapi/joi';
import { BaseError, errorCode } from '../utils';
import * as configSchema from './config.schema';

export const isValidConfig = async (data) => {
  if (!configSchema[data.key]) return console.log('\u2717 missing schema ');
  let result = Joi.validate(data, configSchema[data.key], { allowUnknown: true });
  if (result.error) {
    throw new BaseError({
      statusCode: 400,
      error: errorCode.client,
      errors: { config: errorCode['server.invalidConfig'], details: result.error.details }
    });
  }
  return result.value;
};
