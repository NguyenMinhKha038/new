import Joi from '@hapi/joi';
import { isoDateSchema, numberSchema, pathIdSchema, textSchema } from '../../commons/utils';
import { CheckingPlaces, CheckingTypes, Statuses } from './stock-checking.config';

export default {
  company: {
    create: {
      body: {
        staff_id: pathIdSchema,
        store_id: pathIdSchema.when('checking_place', {
          is: CheckingPlaces.Store,
          then: Joi.required(),
          otherwise: Joi.strip()
        }),
        warehouse_id: pathIdSchema.when('checking_place', {
          is: CheckingPlaces.Warehouse,
          then: Joi.required(),
          otherwise: Joi.strip()
        }),
        mall_id: pathIdSchema.when('checking_place', {
          is: CheckingPlaces.Mall,
          then: Joi.required(),
          otherwise: Joi.strip()
        }),
        checking_place: textSchema.valid(Object.values(CheckingPlaces)).required(),
        type: textSchema.valid(Object.values(CheckingTypes)).required(),
        category_id: pathIdSchema.when('type', {
          is: CheckingTypes.Category,
          then: Joi.required()
        })
      },
      query: {
        populate: textSchema
      }
    },
    update: {
      body: {
        status: textSchema.valid([Statuses.Handling, Statuses.Completed, Statuses.Disabled]),
        staff_id: pathIdSchema
      },
      query: {
        populate: textSchema
      }
    },
    get: {
      query: {
        status: textSchema.valid([Statuses.Handling, Statuses.Pending, Statuses.Completed]),
        checking_date: isoDateSchema,
        completed_date: isoDateSchema,
        created_from: isoDateSchema,
        created_to: isoDateSchema.min(Joi.ref('created_from')),
        checking_date_from: isoDateSchema,
        checking_date_to: isoDateSchema.min(Joi.ref('checking_date_from')),
        completed_date_from: isoDateSchema,
        completed_date_to: isoDateSchema.min(Joi.ref('completed_date_from')),
        staff_id: pathIdSchema,
        store_id: pathIdSchema,
        warehouse_id: pathIdSchema,
        type: textSchema.valid(Object.values(CheckingTypes)),
        populate: textSchema,
        select: textSchema,
        sort: textSchema,
        page: numberSchema.min(1),
        limit: numberSchema.min(0).max(50)
      }
    },
    getById: {
      params: {
        id: pathIdSchema
      }
    }
  },
  company_mall: {
    create: {
      body: {
        staff_id: pathIdSchema,
        mall_id: pathIdSchema,
        type: textSchema.valid(Object.values(CheckingTypes)).required(),
        category_id: pathIdSchema.when('type', {
          is: CheckingTypes.Category,
          then: Joi.required(),
          otherwise: Joi.strip()
        })
      },
      query: {
        populate: textSchema
      }
    },
    update: {
      body: {
        status: textSchema.valid([Statuses.Handling, Statuses.Completed, Statuses.Disabled]),
        staff_id: pathIdSchema
      },
      query: {
        populate: textSchema
      }
    },
    get: {
      query: {
        status: textSchema.valid([Statuses.Handling, Statuses.Pending, Statuses.Completed]),
        checking_date: isoDateSchema,
        completed_date: isoDateSchema,
        created_from: isoDateSchema,
        created_to: isoDateSchema.min(Joi.ref('created_from')),
        checking_date_from: isoDateSchema,
        checking_date_to: isoDateSchema.min(Joi.ref('checking_date_from')),
        completed_date_from: isoDateSchema,
        completed_date_to: isoDateSchema.min(Joi.ref('completed_date_from')),
        staff_id: pathIdSchema,
        mall_id: pathIdSchema,
        type: textSchema.valid(Object.values(CheckingTypes)),
        populate: textSchema,
        select: textSchema,
        sort: textSchema,
        page: numberSchema.min(1),
        limit: numberSchema.min(0).max(50)
      }
    },
    getById: {
      params: {
        id: pathIdSchema
      }
    }
  }
};
