import Joi from '@hapi/joi';
import {
  getFindSchema,
  pathIdSchema,
  selectSchema,
  textSchema,
  booleanSchema,
  limitSchema,
  numberSchema,
  isoDateSchema,
  integerSchema
} from '../../../commons/utils';
import { Statuses, QueryStatuses } from './mall-storing.config';

export default {
  getById: {
    params: {
      id: pathIdSchema.required()
    },
    query: {
      select: selectSchema,
      populate: textSchema
    }
  },
  get: {
    query: {
      ...getFindSchema(),
      _id: pathIdSchema,
      'model_list._id': pathIdSchema,
      groups: pathIdSchema,
      tags: pathIdSchema,
      in_menu: booleanSchema,
      is_active_product: booleanSchema,
      is_lucky: booleanSchema,
      transportable: booleanSchema,
      is_limited_stock: booleanSchema,
      has_accompanied_products: booleanSchema,
      product_id: Joi.alternatives().try(pathIdSchema, Joi.array().items(pathIdSchema).min(1)),
      mall_id: pathIdSchema,
      status: Object.values(QueryStatuses)
    }
  },
  mall: {
    search: {
      query: {
        query: textSchema.max(256),
        limit: limitSchema
      }
    },
    updateStatus: {
      body: {
        mall_storings: Joi.array()
          .items({
            id: pathIdSchema.required(),
            status: textSchema.only(Object.values(Statuses)).default(Statuses.Active)
          })
          .min(1)
          .unique((a, b) => a.id === b.id)
      }
    },
    update: {
      params: {
        id: pathIdSchema.required()
      },
      body: {
        note: textSchema.max(256),
        status: textSchema.only(Object.values(Statuses)),
        price: numberSchema,
        refund_rate: numberSchema,
        refund: numberSchema,
        discount_rate: numberSchema,
        discount: numberSchema,
        promotion_refund_rate: numberSchema,
        promotion_discount_rate: numberSchema,
        global_promotion_refund_rate: numberSchema,
        global_promotion_discount_rate: numberSchema,
        total_refund_rate: numberSchema,
        is_limited_stock: booleanSchema,
        is_lucky: booleanSchema,
        on_sales_stock: integerSchema.min(0)
        // in_menu: booleanSchema,
        // accompanied_products: Joi.array()
        //   .items({
        //     product_storing_id: pathIdSchema.required(),
        //     model_id: pathIdSchema,
        //     on_sales_stock: integerSchema.min(1).required(),
        //     price: numberSchema.min(0).required()
        //   })
        //   .max(2)
        //   .unique((p1, p2) => p1.product_storing_id === p2.product_storing_id),
        // options: Joi.array()
        //   .items({
        //     id: pathIdSchema.required(),
        //     required: booleanSchema,
        //     status: textSchema.only(['active', 'inactive'])
        //   })
        //   .unique((o1, o2) => o1.id === o2.id)
        //   .min(1)
        //   .max(20),
        // groups: Joi.array()
        //   .items(pathIdSchema)
        //   .unique((g1, g2) => g1 === g2)
        //   .min(1)
        //   .max(20),
        // tags: Joi.array()
        //   .items(pathIdSchema)
        //   .unique((t1, t2) => t1 === t2)
        //   .min(1)
        //   .max(20)
      }
    }
  }
};
