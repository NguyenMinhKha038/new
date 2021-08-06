import Joi from '@hapi/joi';
import {
  getFindSchema,
  pathIdSchema,
  selectSchema,
  textSchema,
  booleanSchema,
  numberSchema
} from '../../commons/utils';
import { Statuses } from './warehouse-storing.config';

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
      company_id: pathIdSchema,
      'model_list._id': pathIdSchema,
      warehouse_id: pathIdSchema,
      product_id: Joi.alternatives().try(
        pathIdSchema,
        Joi.array()
          .min(1)
          .unique((id1, id2) => id1 === id2)
      ),
      status: Object.values(Statuses),
      is_active_product: booleanSchema,
      is_lucky: booleanSchema,
      transportable: booleanSchema,
      is_limited_stock: booleanSchema
    }
  },
  company: {
    updateStatus: {
      body: {
        warehouse_storings: Joi.array()
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
        is_lucky: booleanSchema
      }
    }
  }
};
