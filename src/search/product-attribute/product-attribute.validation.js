import Joi from '@hapi/joi';
import { numberSchema, pathIdSchema, textSchema } from '../../commons/utils';
import { Statuses } from './product-attribute.config';

export default {
  create: {
    body: {
      name: textSchema.required(),
      display_name: textSchema.required(),
      values: Joi.array().items(textSchema).required(),
      allow_unlisted_value: Joi.boolean()
    }
  },
  getById: {
    params: {
      id: pathIdSchema.required()
    }
  },
  get: {
    query: {
      limit: numberSchema.min(1).max(50),
      page: numberSchema.min(1),
      select: textSchema,
      sort: textSchema,
      text: textSchema,
      status: textSchema.valid(Object.values(Statuses))
    }
  },
  update: {
    body: {
      name: textSchema,
      display_name: textSchema,
      values: Joi.array().items(textSchema),
      allow_unlisted_value: Joi.boolean(),
      status: textSchema.valid(Object.values(Statuses))
    }
  }
};
