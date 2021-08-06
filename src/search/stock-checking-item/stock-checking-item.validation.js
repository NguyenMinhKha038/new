import Joi from '@hapi/joi';
import { numberSchema, pathIdSchema, textSchema } from '../../commons/utils';
import { Statuses } from './stock-checking-item.config';

export default {
  company: {
    update: {
      params: {
        id: pathIdSchema
      },
      query: {
        populate: textSchema
      },
      body: {
        product_storing_id: pathIdSchema,
        warehouse_storing_id: pathIdSchema,
        model_id: pathIdSchema,
        status: textSchema.valid(Object.values(Statuses)),
        stock: numberSchema,
        actual_stock: numberSchema,
        good_condition: numberSchema,
        medium_condition: numberSchema,
        poor_condition: numberSchema
      }
    },
    updateMany: {
      body: Joi.array()
        .items({
          stock_checking_item_id: pathIdSchema.required(),
          product_storing_id: pathIdSchema,
          warehouse_storing_id: pathIdSchema,
          model_id: pathIdSchema,
          status: textSchema.valid(Object.values(Statuses)),
          stock: numberSchema,
          actual_stock: numberSchema,
          good_condition: numberSchema,
          medium_condition: numberSchema,
          poor_condition: numberSchema
        })
        .max(15),
      query: {
        populate: textSchema
      }
    },
    create: {
      body: {
        stock_checking_id: pathIdSchema.required(),
        warehouse_storing_id: pathIdSchema,
        product_storing_id: pathIdSchema,
        model_id: pathIdSchema,
        stock: numberSchema,
        actual_stock: numberSchema,
        good_condition: numberSchema,
        medium_condition: numberSchema,
        poor_condition: numberSchema
      },
      query: {
        populate: textSchema
      }
    },
    get: {
      query: {
        status: textSchema.valid([Statuses.Checked, Statuses.Pending]),
        stock_checking_id: pathIdSchema,
        storing_id: pathIdSchema,
        product_storing_id: pathIdSchema,
        warehouse_storing_id: pathIdSchema,
        product_id: pathIdSchema,
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
