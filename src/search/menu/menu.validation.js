import Joi from '@hapi/joi';
import { Statuses } from './menu.config';
import { pathIdSchema, getFindSchema, textSchema, numberSchema } from '../../commons/utils';

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
  getByStoreId: {
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
      _id: pathIdSchema,
      company_id: pathIdSchema,
      store_id: pathIdSchema,
      ...getFindSchema()
    }
  },
  company: {
    create: {
      body: {
        store_id: pathIdSchema,
        products: Joi.array()
          .items({
            product_storing_id: pathIdSchema.required(),
            status: textSchema.only(Object.values(Statuses)).default(Statuses.Active),
            tags: Joi.array()
              .items(textSchema.min(1).max(50))
              .unique((t1, t2) => t1 === t2)
              .min(1),
            options: Joi.array()
              .items(pathIdSchema)
              .unique((o1, o2) => o1 === o2)
          })
          .unique((p1, p2) => p1.product_storing_id === p2.product_storing_id)
          .min(1)
          .required()
      }
    },
    update: {
      params: {
        id: pathIdSchema.required()
      },
      body: {
        status: textSchema.only(Object.values(Statuses)),
        products: Joi.array()
          .items({
            product_storing_id: pathIdSchema.required(),
            tags: Joi.array()
              .items(textSchema.min(1).max(50))
              .unique((t1, t2) => t1 === t2)
              .min(1),
            status: textSchema.only(Object.values(Statuses)).default(Statuses.Active),
            options: Joi.array()
              .items(pathIdSchema)
              .unique((o1, o2) => o1 === o2)
          })
          .unique((p1, p2) => p1.product_storing_id == p2.product_storing_id)
          .min(1)
          .required()
      }
    },
    delete: {
      params: {
        id: pathIdSchema.required()
      }
    }
  }
};
