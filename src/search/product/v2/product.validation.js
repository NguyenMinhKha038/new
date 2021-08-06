import Joi, { number } from '@hapi/joi';
import {
  booleanSchema,
  isoDateSchema,
  numberSchema,
  pathIdSchema,
  textSchema
} from '../../../commons/utils';
import { queryStatus, Statuses, ProviderStatuses } from './product.config';

const modelListSchema = {
  name: textSchema.required(),
  price: numberSchema.positive().required(),
  box_price: numberSchema.positive(),
  stock_per_box: numberSchema.positive(),
  tier_index: Joi.array().items(numberSchema).required(),
  images: Joi.array().items(textSchema),
  refund_rate: numberSchema.greater(0).max(1),
  SKU: textSchema.allow(''),
  is_limited_stock: booleanSchema
};

export default {
  company: {
    post: {
      body: {
        name: textSchema.min(8).max(256).required(),
        description: textSchema.min(80).max(3096).required(),
        price: numberSchema.positive(),
        status: Joi.string().valid([Statuses.Disabled, Statuses.Inactive, Statuses.Pending]),
        thumbnail: textSchema.required(),
        images: Joi.array().items(textSchema),
        condition: textSchema.max(256),
        category_id: pathIdSchema.required(),
        refund_rate: numberSchema.greater(0).max(1),
        transportable: booleanSchema,
        packaging_weight: numberSchema
          .min(0)
          .required()
          .when('transportable', { is: false, then: Joi.optional() }),
        packaging_width: numberSchema.min(0),
        packaging_length: numberSchema.min(0),
        packaging_height: numberSchema.min(0),
        is_free_transport: booleanSchema,
        is_limited_stock: booleanSchema,
        SKU: textSchema.allow(''),
        product_template_id: pathIdSchema.required(),
        attributes: Joi.object()
          .pattern(/^[0-9a-fA-F]{24}$/, textSchema)
          .required(),
        unknown_attributes: Joi.array().items(
          Joi.object({
            name: textSchema.required(),
            value: textSchema.required()
          })
        ),
        tier_variations: Joi.array()
          .items(
            Joi.object({
              name: textSchema,
              values: Joi.array().items(textSchema).min(1).max(20).required()
            }).max(2)
          )
          .required(),
        model_list: Joi.array().items(modelListSchema).required(),
        origin: textSchema.max(100),
        unit: textSchema,
        box_unit: textSchema,
        box_price: numberSchema.positive(),
        has_wholesale: Joi.boolean(),
        stock_per_box: numberSchema.when('has_wholesale', { is: true, then: Joi.required() }),
        providers: Joi.array()
          .items({
            provider_id: pathIdSchema,
            status: textSchema.valid(Object.values(ProviderStatuses))
          })
          .unique((a, b) => a.provider_id === b.provider_id)
      }
    },
    getById: {
      params: {
        id: pathIdSchema
      },
      query: {
        populate: textSchema,
        select: textSchema
      }
    },
    get: {
      query: {
        limit: numberSchema.min(0).max(50),
        page: numberSchema.min(1),
        select: textSchema,
        sort: textSchema,
        pid: textSchema,
        SKU: textSchema,
        is_limited_stock: booleanSchema,
        category_id: pathIdSchema,
        type_category_id: pathIdSchema,
        company_category_id: pathIdSchema,
        sub_category_id: pathIdSchema,
        _id: pathIdSchema,
        product_ids: Joi.array().items(pathIdSchema),
        store_id: pathIdSchema,
        status: Joi.alternatives().try(
          Joi.array().items(Joi.string().valid(Object.values(queryStatus))),
          Joi.string().valid(Object.values(queryStatus))
        ),
        populate: textSchema,
        text: textSchema.max(200),
        updated_from: isoDateSchema.max('now'),
        updated_to: isoDateSchema.min(Joi.ref('updated_from')),
        created_from: isoDateSchema.max('now'),
        created_to: isoDateSchema.min(Joi.ref('updated_from')),
        'model_list.model_id': pathIdSchema,
        'model_list.SKU': textSchema,
        'model_list.is_limited_stock': booleanSchema
      }
    },
    put: {
      body: {
        useLatestTemplate: Joi.boolean(),
        name: textSchema.min(8).max(256),
        description: textSchema.min(80).max(3096),
        price: numberSchema.positive(),
        status: Joi.string().valid([Statuses.Disabled, Statuses.Pending, Statuses.Inactive]),
        thumbnail: textSchema,
        images: Joi.array().items(textSchema),
        condition: textSchema.max(256),
        refund_rate: numberSchema.greater(0).max(1),
        transportable: booleanSchema,
        packaging_weight: numberSchema
          .min(0)
          .when('transportable', { is: true, then: Joi.required() }),
        packaging_width: numberSchema.min(0),
        packaging_length: numberSchema.min(0),
        packaging_height: numberSchema.min(0),
        is_free_transport: booleanSchema,
        is_limited_stock: booleanSchema,
        SKU: textSchema.allow(''),
        attributes: Joi.object().pattern(
          /^[0-9a-fA-F]{24}$/,
          Joi.alternatives().try(textSchema, numberSchema)
        ),
        unknown_attributes: Joi.array().items(
          Joi.object({
            name: textSchema.required(),
            value: textSchema.required()
          })
        ),
        tier_variations: Joi.array().items(
          Joi.object({
            name: textSchema,
            values: Joi.array().items(textSchema).min(1).max(20)
          }).max(2)
        ),
        model_list: Joi.array().items({ ...modelListSchema, model_id: pathIdSchema }),
        origin: textSchema.max(100),
        unit: textSchema,
        box_unit: textSchema,
        has_wholesale: Joi.boolean(),
        stock_per_box: numberSchema
          .when('has_wholesale', { is: true, then: Joi.required() })
          .when('has_wholesale', { is: false, then: Joi.strip() }),
        box_price: numberSchema.positive(),
        providers: Joi.array()
          .items({
            provider_id: pathIdSchema,
            status: textSchema.valid(Object.values(ProviderStatuses))
          })
          .unique((a, b) => a.provider_id === b.provider_id)
      },
      params: {
        id: pathIdSchema
      }
    }
  },
  admin: {
    getById: {
      params: {
        id: pathIdSchema
      },
      query: {
        populate: textSchema,
        select: textSchema
      }
    },
    get: {
      query: {
        limit: numberSchema.min(0).max(50),
        page: numberSchema.min(1),
        select: textSchema,
        sort: textSchema,
        pid: textSchema,
        SKU: textSchema,
        category_id: pathIdSchema,
        type_category_id: pathIdSchema,
        company_category_id: pathIdSchema,
        sub_category_id: pathIdSchema,
        _id: pathIdSchema,
        product_ids: Joi.array().items(pathIdSchema),
        // store_id: pathIdSchema,
        status: Joi.alternatives().try(
          Joi.array().items(Joi.string().valid(Object.values(queryStatus))),
          Joi.string().valid(Object.values(queryStatus))
        ),
        populate: textSchema,
        text: textSchema.max(200),
        updated_from: isoDateSchema.max('now'),
        updated_to: isoDateSchema.min(Joi.ref('updated_from')),
        created_from: isoDateSchema.max('now'),
        created_to: isoDateSchema.min(Joi.ref('updated_from')),
        'model_list.model_id': pathIdSchema,
        'model_list.SKU': textSchema
      }
    }
  },
  getTop: {
    query: {
      category_ids: Joi.string(),
      limit: Joi.number().min(1).max(50),
      type: Joi.number().default(1)
    }
  },
  get: {
    query: {
      limit: Joi.number().min(1).max(50),
      page: Joi.number().min(1),
      select: Joi.string(),
      sort: Joi.string(),
      category_id: Joi.string().regex(/^[0-9a-fA-F]{24}$/, {
        name: 'object id'
      }),
      store_id: Joi.string().regex(/^[0-9a-fA-F]{24}$/, { name: 'object id' }),
      company_id: Joi.string().regex(/^[0-9a-fA-F]{24}$/, {
        name: 'object id'
      }),
      is_lucky: Joi.boolean(),
      updated_from: Joi.date().iso().max('now'),
      updated_to: Joi.date().iso().min(Joi.ref('updated_from')),
      created_from: Joi.date().iso().max('now'),
      created_to: Joi.date().iso().min(Joi.ref('updated_from')),
      populate: textSchema,
      'model_list._id': pathIdSchema,
      'model_list.SKU': textSchema
    }
  },
  getById: {
    params: {
      id: Joi.string()
        .regex(/^[0-9a-fA-F]{24}$/, { name: 'object id' })
        .required()
    },
    query: {
      select: Joi.string()
    }
  }
};
