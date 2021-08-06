import Joi from '@hapi/joi';
import { numberSchema, pathIdSchema, textSchema } from '../../commons/utils';
import { Statuses } from './product-template.config';

export default {
  admin: {
    update: {
      params: {
        id: pathIdSchema
      },
      body: {
        category_id: pathIdSchema,
        attribute_info: Joi.array().items(
          Joi.object({
            attribute_id: pathIdSchema,
            is_required: Joi.boolean()
          })
        ),
        allow_unknown_attribute: Joi.boolean(),
        name: textSchema
      }
    },
    updateStatus: {
      params: {
        id: pathIdSchema
      },
      body: {
        status: textSchema.valid([Statuses.Active, Statuses.Disabled])
      }
    },
    create: {
      body: {
        category_id: pathIdSchema.required(),
        attribute_info: Joi.array()
          .items(
            Joi.object({
              attribute_id: pathIdSchema,
              is_required: Joi.boolean()
            })
          )
          .required(),
        name: textSchema,
        allow_unknown_attribute: Joi.boolean()
      }
    },
    get: {
      query: {
        limit: numberSchema.min(1).max(50),
        page: numberSchema.min(1),
        select: textSchema,
        sort: textSchema,
        status: textSchema.valid(Object.values(Statuses)),
        category_id: pathIdSchema,
        populate: textSchema,
        allow_unknown_attribute: Joi.boolean()
      }
    },
    getById: {
      params: {
        id: pathIdSchema
      }
    }
  },
  company: {
    getLatestTemplate: {
      query: {
        category_id: pathIdSchema.required()
      }
    }
  }
};
