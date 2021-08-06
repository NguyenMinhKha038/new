import Joi from '@hapi/joi';
import {
  pathIdSchema,
  textSchema,
  getFindSchema,
  isoDateSchema,
  booleanSchema
} from '../../commons/utils';
import { Statuses } from './group.config';

export default {
  getById: {
    params: {
      id: pathIdSchema.required()
    },
    query: {
      select: textSchema,
      populate: textSchema
    }
  },
  get: {
    query: {
      ...getFindSchema(),
      _id: pathIdSchema,
      status: textSchema.only(Object.values(Statuses)),
      is_important: booleanSchema,
      admin_id: pathIdSchema,
      company_id: pathIdSchema,
      store_id: pathIdSchema,
      mall_id: pathIdSchema,
      has_product: booleanSchema
    }
  },
  company: {
    create: {
      body: {
        store_id: pathIdSchema,
        is_important: booleanSchema,
        name: textSchema.min(1).max(128).required(),
        value: textSchema.min(1).max(128).required(),
        description: textSchema.min(1).max(512),
        image_url: textSchema
      }
    },
    update: {
      params: {
        id: pathIdSchema.required()
      },
      body: {
        is_important: booleanSchema,
        name: textSchema.min(1).max(128).required(),
        value: textSchema.min(1).max(128).required(),
        description: textSchema.min(1).max(512),
        image_url: textSchema
      }
    },
    delete: {
      params: {
        id: pathIdSchema.required()
      }
    }
  }
};
