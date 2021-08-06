import Joi from '@hapi/joi';
import { PaymentTypes } from './payment-gateway.config';

export default {
  restore: {
    body: {
      code: Joi.string().required(),
      type: Joi.string().valid(Object.keys(PaymentTypes))
    }
  }
};
