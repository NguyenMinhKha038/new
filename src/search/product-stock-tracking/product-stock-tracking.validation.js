import Joi from '@hapi/joi';
import {
  booleanSchema,
  integerSchema,
  isoDateSchema,
  pathIdSchema,
  textSchema
} from '../../commons/utils';
import { TrackingPlaces } from './product-stock-tracking.config';

export default {
  company: {
    getStockCheckingForOneProduct: {
      query: {
        limit: integerSchema.min(1).max(50).default(30),
        page: integerSchema.min(1).default(1),
        date_order: textSchema.only(['increasing', 'decreasing']).default('decreasing'),
        tracking_place: textSchema
          .only([TrackingPlaces.Warehouse, TrackingPlaces.Store])
          .required(),
        product_id: pathIdSchema.required(),
        store_id: pathIdSchema,
        warehouse_id: pathIdSchema,
        created_from: isoDateSchema,
        created_to: isoDateSchema
      }
    },
    getStockChecking: {
      query: {
        limit: integerSchema.min(1).max(50).default(30),
        page: integerSchema.min(1).default(1),
        tracking_place: textSchema
          .only([TrackingPlaces.Warehouse, TrackingPlaces.Store])
          .required(),
        store_id: pathIdSchema,
        warehouse_id: pathIdSchema,
        type_category_id: pathIdSchema,
        company_category_id: pathIdSchema,
        sub_category_id: pathIdSchema,
        product_id: Joi.alternatives().try([
          pathIdSchema,
          Joi.array()
            .items(pathIdSchema)
            .min(1)
            .unique((p1, p2) => p1 === p2)
        ]),
        created_from: isoDateSchema,
        created_to: isoDateSchema,
        newest_first: booleanSchema.default(false)
      }
    },
    getOnSalesChecking: {
      query: {
        limit: integerSchema.min(1).max(50).default(30),
        page: integerSchema.min(1).default(1),
        tracking_place: textSchema.only([TrackingPlaces.Mall, TrackingPlaces.Store]).required(),
        store_id: pathIdSchema,
        mall_id: pathIdSchema,
        type_category_id: pathIdSchema,
        company_category_id: pathIdSchema,
        sub_category_id: pathIdSchema,
        product_id: Joi.alternatives().try([
          pathIdSchema,
          Joi.array()
            .items(pathIdSchema)
            .min(1)
            .unique((p1, p2) => p1 === p2)
        ]),
        created_from: isoDateSchema,
        created_to: isoDateSchema,
        newest_first: booleanSchema.default(false)
      }
    },
    getOnSalesCheckingForOneProduct: {
      query: {
        limit: integerSchema.min(1).max(50).default(30),
        page: integerSchema.min(1).default(1),
        date_order: textSchema.only(['increasing', 'decreasing']).default('decreasing'),
        tracking_place: textSchema.only([TrackingPlaces.Mall, TrackingPlaces.Store]).required(),
        product_id: pathIdSchema.required(),
        store_id: pathIdSchema.when('tracking_place', {
          is: TrackingPlaces.Store,
          then: Joi.required(),
          otherwise: Joi.strip()
        }),
        mall_id: pathIdSchema.when('tracking_place', {
          is: TrackingPlaces.Mall,
          then: Joi.required(),
          otherwise: Joi.strip()
        }),
        created_from: isoDateSchema,
        created_to: isoDateSchema
      }
    }
  },
  mall: {}
};
