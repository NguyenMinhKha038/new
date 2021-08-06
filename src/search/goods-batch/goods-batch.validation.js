import Joi from '@hapi/joi';
import {
  getFindSchema,
  pathIdSchema,
  selectSchema,
  isoDateSchema,
  textSchema,
  integerSchema,
  booleanSchema
} from '../../commons/utils';
import {
  PlaceOfStock,
  Statuses,
  MovingTypes,
  ExportTypes,
  InitPlaceOfStock,
  RequesterTypes,
  MaxBatchesPerRequest
} from './goods-batch.config';
import {
  Statuses as HistoryStatuses,
  Types as HistoryTypes
} from '../product-stock-history/v2/product-stock-history.config';

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
  getBySku: {
    params: {
      sku: textSchema.required()
    },
    query: {
      select: selectSchema,
      populate: textSchema
    }
  },
  get: {
    query: {
      ...getFindSchema(),
      populate: textSchema,
      _id: pathIdSchema,
      batch_code: textSchema.regex(/^[0-9a-fA-F\-]$/),
      product_id: pathIdSchema,
      model_id: pathIdSchema,
      status: Object.values(Statuses),
      import_date_from: isoDateSchema,
      import_date_to: isoDateSchema,
      export_date_from: isoDateSchema,
      export_date_to: isoDateSchema,
      manufacturing_date_from: isoDateSchema,
      manufacturing_date_to: isoDateSchema,
      expiry_date_from: isoDateSchema,
      expiry_date_to: isoDateSchema,
      stock_keeping_unit: textSchema,
      on_sales: booleanSchema,
      place_of_stock: textSchema.only(Object.values(InitPlaceOfStock)),
      company_id: pathIdSchema,
      mall_id: pathIdSchema,
      warehouse_id: pathIdSchema,
      store_id: pathIdSchema,
      provider_id: pathIdSchema,
      out_of_stock: booleanSchema,
      in_stock: booleanSchema
    }
  },
  delete: {
    params: {
      id: pathIdSchema.required()
    }
  },
  update: {
    params: {
      id: pathIdSchema.required()
    },
    body: {
      // manufacturing_date: isoDateSchema.less('now'),
      // expiry_date: isoDateSchema.greater('now'),
      // origin: textSchema,
      // provider_id: pathIdSchema,
      transportable: booleanSchema,
      stock_keeping_unit: textSchema,
      stock: integerSchema,
      on_sales_stock: integerSchema,
      batch_stock: integerSchema,
      exported: integerSchema.min(0),
      sold: integerSchema.min(0),
      note: textSchema
        .when('stock', { is: Joi.exist(), then: Joi.required() })
        .when('batch_stock', { is: Joi.exist(), then: Joi.required() })
        .when('on_sales_stock', { is: Joi.exist(), then: Joi.required() })
    }
  },
  updateOnSales: {
    params: {
      id: pathIdSchema.required()
    },
    body: {
      on_sales: booleanSchema.required(),
      stock: integerSchema.min(0).when('on_sales', {
        is: false,
        then: Joi.required(),
        otherwise: Joi.forbidden()
      })
    }
  },
  importBatch: {
    body: {
      // place_of_stock: textSchema.only(Object.values(InitPlaceOfStock)).required(),
      place_of_stock: textSchema.only(['warehouse']).required(),
      product_id: pathIdSchema.required(),
      manufacturing_date: isoDateSchema.less('now').required(),
      expiry_date: isoDateSchema.greater('now').required(),
      stock_keeping_unit: textSchema,
      stock: integerSchema.min(1).required(),
      mall_id: pathIdSchema.when('place_of_stock', { is: PlaceOfStock.Mall, then: Joi.required() }),
      warehouse_id: pathIdSchema.when('place_of_stock', {
        is: PlaceOfStock.Warehouse,
        then: Joi.required()
      }),
      store_id: pathIdSchema.when('place_of_stock', {
        is: PlaceOfStock.Store,
        then: Joi.required()
      }),
      model_id: pathIdSchema,
      provider_id: pathIdSchema.required(),
      note: textSchema
    }
  },
  exportBatches: {
    body: {
      place_of_stock: textSchema.only(Object.values(InitPlaceOfStock)).required(),
      export_type: textSchema.only(Object.values(ExportTypes)).required(),
      batches: Joi.array()
        .items({
          id: pathIdSchema.required(),
          stock: integerSchema.min(1)
        })
        .min(1)
        .unique((batch1, batch2) => batch1.id === batch2.id)
        .required(),
      warehouse_id: pathIdSchema,
      store_id: pathIdSchema,
      mall_id: pathIdSchema,
      note: textSchema
    }
  },
  handleBatchesForSale: {
    body: {
      // place_of_stock: textSchema.only([PlaceOfStock.Store, PlaceOfStock.Mall]).required(),
      place_of_stock: textSchema.only([PlaceOfStock.Store]).required(),
      type: textSchema.only([HistoryTypes.LocalImport, HistoryTypes.LocalExport]).required(),
      batches: Joi.array()
        .items({
          id: pathIdSchema,
          product_storing_id: pathIdSchema,
          // mall_storing_id: pathIdSchema,
          stock: integerSchema.min(1).required(),
          model_id: pathIdSchema
        })
        .min(1)
        .required(),
      warehouse_id: pathIdSchema,
      store_id: pathIdSchema,
      mall_id: pathIdSchema,
      note: textSchema
    }
  },
  requestMove: {
    body: {
      moving_type: textSchema.only(Object.values(MovingTypes)),
      requester_type: textSchema.only(Object.values(RequesterTypes)).required(),
      ignore_approval: booleanSchema,
      batches: Joi.array()
        .items({
          id: pathIdSchema.required(),
          stock: integerSchema.min(1)
        })
        .min(1)
        .max(MaxBatchesPerRequest)
        .unique((a, b) => a.id === b.id),
      from_warehouse_id: pathIdSchema,
      to_warehouse_id: pathIdSchema,
      from_store_id: pathIdSchema,
      to_store_id: pathIdSchema,
      from_mall_id: pathIdSchema,
      to_mall_id: pathIdSchema,
      note: textSchema.max(300)
    }
  },
  updateMove: {
    body: {
      product_stock_history_id: pathIdSchema.required(),
      status: textSchema.only([HistoryStatuses.Cancelled]),
      batches: Joi.array()
        .items({
          id: pathIdSchema.required(),
          stock: integerSchema.min(1).required()
        })
        .min(1)
        .max(MaxBatchesPerRequest)
        .unique((a, b) => a.id === b.id),
      note: textSchema.max(300)
    }
  },
  approveMove: {
    body: {
      product_stock_history_id: pathIdSchema.required(),
      batches: Joi.array()
        .items({
          id: pathIdSchema.required(),
          status: textSchema.only([HistoryStatuses.Approved, HistoryStatuses.Cancelled])
        })
        .min(1)
        .unique((a, b) => a.id === b.id),
      note: textSchema.max(300)
    }
  },
  confirmMove: {
    body: {
      product_stock_history_id: pathIdSchema.required(),
      batches: Joi.array()
        .items({
          id: pathIdSchema.required(),
          stock: integerSchema.min(0).required(),
          // on_sales: booleanSchema,
          position: textSchema.regex(/^[0-9a-zA-Z_\-]{1,100}$/)
        })
        .min(1)
        .unique((a, b) => a.id === b.id)
        .required(),
      note: textSchema.max(300)
    }
  },
  confirmDifference: {
    body: {
      product_stock_history_id: pathIdSchema.required(),
      batches: Joi.array()
        .items({
          id: pathIdSchema.required(),
          different_move_quantity: integerSchema.min(0).required()
        })
        .min(1)
        .unique((a, b) => a.id === b.id)
        .required(),
      note: textSchema.max(300)
    }
  },
  company: {
    // nothing
  },
  mall: {
    // nothing
  },
  admin: {
    // nothing
  }
};
