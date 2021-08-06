import Joi from '@hapi/joi';
import {
  pathIdSchema,
  textSchema,
  getFindSchema,
  numberSchema,
  booleanSchema
} from '../../commons/utils';
import { Scopes, Statuses, Types, Units } from './selling-option.config';

export default {
  user: {},
  company: {
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
        status: textSchema.only(Object.values(Statuses)),
        type: textSchema.only(Object.values(Types)),
        unit: textSchema.only(Object.values(Units)),
        store_id: pathIdSchema,
        company_id: pathIdSchema,
        required: booleanSchema,
        scope: textSchema.only(Object.values(Scopes))
      }
    },
    create: {
      body: {
        store_id: pathIdSchema,
        name: textSchema.min(1).max(256).required(),
        type: textSchema.only(Object.values(Types)).default(Types.Option),
        unit: textSchema.only(Object.values(Units)),
        required: booleanSchema,
        image_url: textSchema,
        options: Joi.array()
          .items({
            name: textSchema.min(1).max(256).required(),
            value: Joi.alternatives(textSchema.min(1).max(256), numberSchema).required(),
            image_url: textSchema,
            price: numberSchema.required(),
            is_limited_quantity: booleanSchema.default(true),
            quantity: numberSchema.when('is_limited_quantity', { is: true, then: Joi.required() })
          })
          .min(1)
          .unique((o1, o2) => o1.name === o2.name)
          .required()
      }
    },
    update: {
      params: {
        id: pathIdSchema.required()
      },
      body: {
        name: textSchema.min(1).max(256),
        unit: textSchema.only(Object.values(Units)),
        image_url: textSchema,
        status: textSchema.only(Object.values(Statuses)),
        required: booleanSchema,
        options: Joi.array()
          .items({
            status: textSchema.only(Object.values(Statuses)),
            name: textSchema.min(1).max(256).required(),
            value: Joi.alternatives(textSchema.min(1).max(256), numberSchema).required(),
            image_url: textSchema,
            price: numberSchema.required(),
            is_limited_quantity: booleanSchema.default(true),
            quantity: numberSchema.when('is_limited_quantity', { is: true, then: Joi.required() })
          })
          .min(1)
          .unique((o1, o2) => o1.name === o2.name)
      }
    },
    delete: {
      params: {
        id: pathIdSchema.required()
      }
    }
  },
  admin: {
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
        status: textSchema.only(Object.values(Statuses)),
        type: textSchema.only(Object.values(Types)),
        unit: textSchema.only(Object.values(Units)),
        store_id: pathIdSchema,
        company_id: pathIdSchema,
        required: booleanSchema,
        scope: textSchema.only(Object.values(Scopes))
      }
    },
    create: {
      body: {
        name: textSchema.min(1).max(256).required(),
        type: textSchema.only(Object.values(Types)).default(Types.Option),
        unit: textSchema.only(Object.values(Units)),
        required: booleanSchema,
        image_url: textSchema,
        options: Joi.array()
          .items({
            name: textSchema.min(1).max(256).required(),
            value: Joi.alternatives(textSchema.min(1).max(256), numberSchema).required(),
            image_url: textSchema,
            price: numberSchema.required(),
            is_limited_quantity: booleanSchema.default(true),
            quantity: numberSchema.when('is_limited_quantity', { is: true, then: Joi.required() })
          })
          .min(1)
          .unique((o1, o2) => o1.name === o2.name)
          .required()
      }
    },
    update: {
      params: {
        id: pathIdSchema.required()
      },
      body: {
        name: textSchema.min(1).max(256),
        unit: textSchema.only(Object.values(Units)),
        image_url: textSchema,
        status: textSchema.only(Object.values(Statuses)),
        required: booleanSchema,
        options: Joi.array()
          .items({
            status: textSchema.only(Object.values(Statuses)),
            name: textSchema.min(1).max(256).required(),
            value: Joi.alternatives(textSchema.min(1).max(256), numberSchema).required(),
            image_url: textSchema,
            price: numberSchema.required(),
            is_limited_quantity: booleanSchema.default(true),
            quantity: numberSchema.when('is_limited_quantity', { is: true, then: Joi.required() })
          })
          .min(1)
          .unique((o1, o2) => o1.name === o2.name)
      }
    },
    delete: {
      params: {
        id: pathIdSchema.required()
      }
    }
  }
};
