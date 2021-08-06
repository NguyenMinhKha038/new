import Joi from '@hapi/joi';
import {
  getFindSchema,
  pathIdSchema,
  selectSchema,
  textSchema,
  booleanSchema,
  numberSchema,
  integerSchema
} from '../../../commons/utils';
import { Statuses } from './product-storing.config';

export default {
  search: {
    query: {
      store_id: pathIdSchema,
      q: textSchema,
      query: textSchema,
      SKU: textSchema,
      limit: integerSchema.min(1)
    }
  },
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
      'model_list.model_id': pathIdSchema,
      store_id: pathIdSchema,
      company_id: pathIdSchema,
      groups: pathIdSchema,
      tags: pathIdSchema,
      status: Object.values(Statuses),
      in_menu: booleanSchema,
      is_active_product: booleanSchema,
      is_lucky: booleanSchema,
      transportable: booleanSchema,
      is_limited_stock: booleanSchema,
      has_accompanied_products: booleanSchema,
      has_wholesale: booleanSchema,
      is_directed_import: booleanSchema,
      product_id: Joi.alternatives().try(pathIdSchema, Joi.array().items(pathIdSchema).min(1))
    }
  },
  company: {
    importProducts: {
      body: {
        store_id: pathIdSchema,
        note: textSchema.max(256),
        products: Joi.array()
          .items({
            id: pathIdSchema.required(),
            in_menu: booleanSchema.default(false),
            is_limited_stock: booleanSchema.default(true),
            on_sales_stock: integerSchema.min(0).default(0),
            has_wholesale: booleanSchema,
            stock_per_box: integerSchema.min(1).when('has_wholesale', {
              is: true,
              then: Joi.required(),
              otherwise: Joi.forbidden()
            }),
            box_price: numberSchema.min(0).when('has_wholesale', {
              is: true,
              then: Joi.required(),
              otherwise: Joi.forbidden()
            }),
            model_list: Joi.array()
              .items({
                model_id: pathIdSchema.required(),
                price: numberSchema.min(0),
                box_price: numberSchema.min(0),
                batch_stock: integerSchema.min(0),
                on_sales_stock: integerSchema.min(0),
                status: textSchema.only(Object.values(Statuses)),
                SKU: textSchema,
                sold_count: integerSchema.min(0),
                refund: numberSchema.min(0),
                refund_rate: numberSchema.min(0).max(1),
                discount: numberSchema.min(0),
                discount_rate: numberSchema.min(0).max(1)
              })
              .unique((m1, m2) => m1.model_id === m2.model_id)
              .min(1),
            accompanied_products: Joi.array()
              .items({
                product_storing_id: pathIdSchema.required(),
                model_id: pathIdSchema,
                on_sales_stock: integerSchema.min(1).required(),
                price: numberSchema.min(0).required()
              })
              .max(2)
              .unique((p1, p2) => p1.product_storing_id === p2.product_storing_id),
            options: Joi.array()
              .items({
                id: pathIdSchema.required(),
                required: booleanSchema,
                status: textSchema.only(['active', 'inactive'])
              })
              .unique((o1, o2) => o1.id === o2.id)
              .min(1)
              .max(20),
            groups: Joi.array()
              .items(pathIdSchema)
              .unique((g1, g2) => g1 === g2)
              .min(1)
              .max(20),
            tags: Joi.array()
              .items(pathIdSchema)
              .unique((t1, t2) => t1 === t2)
              .min(1)
              .max(20)
          })
          .min(1)
          .unique((p1, p2) => p1.id === p2.id)
          .required()
      }
    },
    updateStatus: {
      body: {
        product_storings: Joi.array()
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
        in_menu: booleanSchema,
        on_sales_stock: integerSchema.min(0),
        has_wholesale: booleanSchema,
        stock_per_box: integerSchema.min(1).when('has_wholesale', {
          is: true,
          then: Joi.required(),
          otherwise: Joi.forbidden()
        }),
        box_price: numberSchema.min(0).when('has_wholesale', {
          is: true,
          then: Joi.required(),
          otherwise: Joi.forbidden()
        }),
        model_list: Joi.array()
          .items({
            model_id: pathIdSchema.required(),
            price: numberSchema.min(0),
            box_price: numberSchema.min(0),
            batch_stock: integerSchema.min(0),
            on_sales_stock: integerSchema.min(0),
            status: textSchema.only(Object.values(Statuses)),
            SKU: textSchema,
            sold_count: integerSchema.min(0),
            refund: numberSchema.min(0),
            refund_rate: numberSchema.min(0).max(1),
            discount: numberSchema.min(0),
            discount_rate: numberSchema.min(0).max(1)
          })
          .unique((m1, m2) => m1.model_id === m2.model_id)
          .min(1),
        accompanied_products: Joi.array()
          .items({
            product_storing_id: pathIdSchema.required(),
            model_id: pathIdSchema,
            on_sales_stock: integerSchema.min(1).required(),
            price: numberSchema.min(0).required()
          })
          .max(2)
          .unique((p1, p2) => p1.product_storing_id === p2.product_storing_id),
        options: Joi.array()
          .items({
            id: pathIdSchema.required(),
            required: booleanSchema,
            status: textSchema.only(['active', 'inactive'])
          })
          .unique((o1, o2) => o1.id === o2.id)
          .max(20),
        groups: Joi.array()
          .items(pathIdSchema)
          .unique((g1, g2) => g1 === g2)
          .max(20),
        tags: Joi.array()
          .items(pathIdSchema)
          .unique((t1, t2) => t1 === t2)
          .max(20)
      }
    }
  }
};
