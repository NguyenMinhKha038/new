import {
  limitSchema,
  sortSchema,
  pageSchema,
  selectSchema,
  textSchema,
  booleanSchema,
  isoDateSchema,
  idSchema,
  populateSchema
} from '../commons/find.schema';
import withSchema from '../commons/with-schema';
import { pathIDSchema } from '../commons/path-id.schema';
import { response200 } from '../commons/responses.schema';

export default {
  '/s_/product-stock-history/company/get-history/{id}': {
    get: {
      tags: ['product-stock-history'],
      summary: 'Get stock history by id.',
      description: 'Get stock history by id.',
      parameters: [
        pathIDSchema,
        {
          name: 'select',
          in: 'query',
          schema: {
            type: 'string',
            enum: [
              'from_store',
              'to_store',
              'from_product_storing',
              'to_product_storing',
              'product',
              'performed_by',
              'user',
              'transaction'
            ]
          }
        }
      ],
      responses: response200
    }
  },
  '/s_/product-stock-history/company/get-histories': {
    get: {
      tags: ['product-stock-history'],
      summary: 'Get stock histories',
      parameters: [
        limitSchema,
        sortSchema,
        pageSchema,
        {
          name: 'select',
          in: 'query',
          required: false,
          schema: {
            type: 'string',
            enum: [
              'from_store',
              'to_store',
              'from_product_storing',
              'to_product_storing',
              'product',
              'performed_by',
              'user',
              'transaction'
            ]
          }
        },
        {
          name: 'from_store_id',
          in: 'query',
          required: false,
          schema: {
            type: 'string'
          }
        },
        {
          name: 'to_store_id',
          in: 'query',
          required: false,
          schema: {
            type: 'string'
          }
        },
        {
          name: 'product_id',
          in: 'query',
          required: false,
          schema: {
            type: 'string'
          }
        },
        {
          name: 'company_id',
          in: 'query',
          required: false,
          schema: {
            type: 'string'
          }
        },
        {
          name: 'id',
          in: 'query',
          required: false,
          schema: {
            type: 'string'
          }
        },
        {
          name: '_id',
          in: 'query',
          required: false,
          schema: {
            type: 'string'
          }
        },
        {
          name: 'type',
          in: 'query',
          required: false,
          schema: {
            type: 'string',
            enum: ['import', 'export', 'sell', 'refund', 'move']
          }
        },
        {
          name: 'requester_type',
          in: 'query',
          required: false,
          schema: {
            type: 'string',
            enum: ['stock', 'store']
          }
        },
        {
          name: 'moving_type',
          in: 'query',
          required: false,
          schema: {
            type: 'string',
            enum: ['stock_to_store', 'store_to_stock', 'store_to_store']
          }
        },
        {
          name: 'relate_to',
          in: 'query',
          required: false,
          schema: {
            type: 'string',
            enum: ['stock', 'store', 'both'],
            example: 'stock both'
          }
        },
        {
          name: 'created_from',
          in: 'query',
          required: false,
          schema: {
            type: 'iso date'
          }
        },

        {
          name: 'created_to',
          in: 'query',
          required: false,
          schema: {
            type: 'iso date'
          }
        },
        {
          name: 'user_id',
          in: 'query',
          required: false,
          schema: {
            type: 'string'
          }
        },
        {
          name: 'handled_by_id',
          in: 'query',
          required: false,
          schema: {
            type: 'string'
          }
        },
        {
          name: 'approved_by_id',
          in: 'query',
          required: false,
          schema: {
            type: 'string'
          }
        },
        {
          name: 'status',
          in: 'query',
          required: false,
          schema: {
            type: 'string',
            enum: ['pending', 'completed', 'cancelled', 'approved']
          }
        },
        {
          name: 'need_approved',
          in: 'query',
          required: false,
          schema: {
            type: 'boolean'
          }
        },
        {
          name: 'store_id',
          in: 'query',
          required: false,
          schema: {
            type: 'string'
          }
        }
      ],
      responses: response200
    }
  },
  // V2
  '/s_/product-stock-history/v2/company-mall/{id}': {
    get: {
      tags: ['product-stock-history'],
      summary: 'Get stock history by id.',
      description: 'Get stock history by id.',
      parameters: [pathIDSchema, selectSchema, populateSchema],
      responses: response200
    }
  },
  '/s_/product-stock-history/v2/company-mall/': {
    get: {
      tags: ['product-stock-history'],
      summary: 'Get stock histories',
      parameters: [
        limitSchema,
        sortSchema,
        pageSchema,
        selectSchema,
        populateSchema,
        withSchema(textSchema, {
          name: 'status',
          'schema.enum': ['pending', 'approved', 'cancelled', 'completed']
        }),
        withSchema(idSchema, { name: '_id' }),
        withSchema(idSchema, { name: 'user_id' }),
        withSchema(idSchema, { name: 'from_store_id' }),
        withSchema(idSchema, { name: 'to_store_id' }),
        withSchema(idSchema, { name: 'from_warehouse_id' }),
        withSchema(idSchema, { name: 'to_warehouse_id' }),
        withSchema(idSchema, { name: 'from_mall_id' }),
        withSchema(idSchema, { name: 'to_mall_id' }),
        withSchema(textSchema, {
          name: 'type',
          'schema.enum': ['import', 'export', 'sell', 'refund', 'move']
        }),
        withSchema(textSchema, {
          name: 'moving_type',
          'schema.enum': [
            'warehouse_to_warehouse',
            'warehouse_to_store',
            'warehouse_to_mall',
            'store_to_store',
            'store_to_warehouse',
            'store_to_mall',
            'mall_to_mall',
            'mall_to_warehouse',
            'mall_to_store'
          ]
        }),
        withSchema(idSchema, { name: 'transaction_id' }),
        withSchema(booleanSchema, { name: 'confirmed_difference' }),
        withSchema(booleanSchema, { name: 'need_confirm_difference' }),
        withSchema(textSchema, { name: 'on_model' }),
        withSchema(textSchema, {
          name: 'relate_to',
          'schema.enum': [
            'warehouse',
            'store',
            'mall',
            'mall_mall',
            'warehouse_warehouse',
            'store_store',
            'warehouse_store',
            'warehouse_store',
            'warehouse_mall',
            'warehouse_mall',
            'mall_store',
            'mall_store'
          ]
        }),
        withSchema(booleanSchema, { name: 'need_approved' }),
        withSchema(textSchema, { name: 'export_type', 'schema.enum': ['destructing', 'other'] }),
        withSchema(idSchema, { name: 'requester.user_id' }),
        withSchema(idSchema, { name: 'requester.mall_id' }),
        withSchema(idSchema, { name: 'requester.warehouse_id' }),
        withSchema(idSchema, { name: 'requester.store_id' }),
        withSchema(idSchema, { name: 'approver.user_id' }),
        withSchema(idSchema, { name: 'approver.mall_id' }),
        withSchema(idSchema, { name: 'approver.warehouse_id' }),
        withSchema(idSchema, { name: 'approver.store_id' }),
        withSchema(idSchema, { name: 'confirmor.user_id' }),
        withSchema(idSchema, { name: 'confirmor.mall_id' }),
        withSchema(idSchema, { name: 'confirmor.warehouse_id' }),
        withSchema(idSchema, { name: 'confirmor.store_id' }),
        withSchema(idSchema, { name: 'batches.batch_id' }),
        withSchema(textSchema, { name: 'batches.batch_code' }),
        withSchema(idSchema, { name: 'batches.product_id' }),
        withSchema(idSchema, { name: 'products.product_id' }),
        withSchema(idSchema, { name: 'product_id' }),
        withSchema(isoDateSchema, { name: 'created_from' }),
        withSchema(isoDateSchema, { name: 'created_to' }),
        withSchema(textSchema, { name: 'direction', 'schema.enum': ['in', 'out'] }),
        withSchema(idSchema, { name: 'direction_entity_id', description: 'Used with direction' }),
        withSchema(idSchema, {
          name: 'store_id',
          description: 'Used for querying histories relate to a specific store'
        }),
        withSchema(idSchema, {
          name: 'warehouse_id',
          description: 'Used for querying histories relate to a specific warehouse'
        }),
        withSchema(idSchema, {
          name: 'mall_id',
          description: 'Used for querying histories relate to a specific mall'
        })
      ],
      responses: response200
    }
  },
  '/s_/product-stock-history/v2/admin/{id}': {
    get: {
      tags: ['product-stock-history'],
      summary: 'Admin get stock history by id.',
      description: 'Admin Get stock history by id.',
      parameters: [pathIDSchema, selectSchema, populateSchema],
      responses: response200
    }
  },
  '/s_/product-stock-history/v2/admin/': {
    get: {
      tags: ['product-stock-history'],
      summary: 'Admin get stock histories',
      parameters: [
        limitSchema,
        sortSchema,
        pageSchema,
        selectSchema,
        populateSchema,
        withSchema(textSchema, {
          name: 'status',
          'schema.enum': ['pending', 'approved', 'cancelled', 'completed']
        }),
        withSchema(idSchema, { name: '_id' }),
        withSchema(idSchema, { name: 'user_id' }),
        withSchema(idSchema, { name: 'from_store_id' }),
        withSchema(idSchema, { name: 'to_store_id' }),
        withSchema(idSchema, { name: 'from_warehouse_id' }),
        withSchema(idSchema, { name: 'to_warehouse_id' }),
        withSchema(idSchema, { name: 'from_mall_id' }),
        withSchema(idSchema, { name: 'to_mall_id' }),
        withSchema(idSchema, { name: 'company_id' }),
        withSchema(textSchema, {
          name: 'type',
          'schema.enum': ['import', 'export', 'sell', 'refund', 'move']
        }),
        withSchema(textSchema, {
          name: 'moving_type',
          'schema.enum': [
            'warehouse_to_warehouse',
            'warehouse_to_store',
            'warehouse_to_mall',
            'store_to_store',
            'store_to_warehouse',
            'store_to_mall',
            'mall_to_mall',
            'mall_to_warehouse',
            'mall_to_store'
          ]
        }),
        withSchema(idSchema, { name: 'transaction_id' }),
        withSchema(textSchema, { name: 'on_model' }),
        withSchema(booleanSchema, { name: 'confirmed_difference' }),
        withSchema(booleanSchema, { name: 'need_confirm_difference' }),
        withSchema(textSchema, {
          name: 'relate_to',
          'schema.enum': [
            'warehouse',
            'store',
            'mall',
            'mall_mall',
            'warehouse_warehouse',
            'store_store',
            'warehouse_store',
            'warehouse_store',
            'warehouse_mall',
            'warehouse_mall',
            'mall_store',
            'mall_store'
          ]
        }),
        withSchema(booleanSchema, { name: 'need_approved' }),
        withSchema(textSchema, { name: 'export_type', 'schema.enum': ['destructing', 'other'] }),
        withSchema(idSchema, { name: 'requester.user_id' }),
        withSchema(idSchema, { name: 'requester.mall_id' }),
        withSchema(idSchema, { name: 'requester.warehouse_id' }),
        withSchema(idSchema, { name: 'requester.store_id' }),
        withSchema(idSchema, { name: 'approver.user_id' }),
        withSchema(idSchema, { name: 'approver.mall_id' }),
        withSchema(idSchema, { name: 'approver.warehouse_id' }),
        withSchema(idSchema, { name: 'approver.store_id' }),
        withSchema(idSchema, { name: 'confirmor.user_id' }),
        withSchema(idSchema, { name: 'confirmor.mall_id' }),
        withSchema(idSchema, { name: 'confirmor.warehouse_id' }),
        withSchema(idSchema, { name: 'confirmor.store_id' }),
        withSchema(idSchema, { name: 'batch_id' }),
        withSchema(textSchema, { name: 'batch_code' }),
        withSchema(idSchema, { name: 'product_id' }),
        withSchema(isoDateSchema, { name: 'created_from' }),
        withSchema(isoDateSchema, { name: 'created_to' }),
        withSchema(idSchema, {
          name: 'store_id',
          description: 'Used for querying histories relate to a specific store'
        }),
        withSchema(idSchema, {
          name: 'warehouse_id',
          description: 'Used for querying histories relate to a specific warehouse'
        }),
        withSchema(idSchema, {
          name: 'mall_id',
          description: 'Used for querying histories relate to a specific mall'
        })
      ],
      responses: response200
    }
  }
};
