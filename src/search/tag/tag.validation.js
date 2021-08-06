import Joi from '@hapi/joi';
import { pathIdSchema, textSchema, getFindSchema, isoDateSchema } from '../../commons/utils';
import { Statuses, Types, Scopes } from './tag.config';

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
      type: textSchema.only(Object.values(Types)),
      scope: textSchema.only(Object.values(Scopes)),
      expiry_date_from: isoDateSchema.min('now'),
      expiry_date_to: isoDateSchema.min('now'),
      admin_id: pathIdSchema,
      company_id: pathIdSchema,
      store_id: pathIdSchema,
      mall_id: pathIdSchema
    }
  },
  company: {
    create: {
      body: {
        type: textSchema.only(Object.values(Types)).required(),
        scope: textSchema.only([Scopes.Company, Scopes.Store]).required(),
        store_id: pathIdSchema.when('scope', { is: Scopes.Company, then: Joi.forbidden() }),
        expiry_date: isoDateSchema
          .min('now')
          .when('type', { is: Types.Flash, then: Joi.required(), otherwise: Joi.forbidden() }),
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
        expiry_date: isoDateSchema,
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
