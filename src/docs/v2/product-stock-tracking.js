import findSchema, {
  idSchema,
  isoDateSchema,
  limitSchema,
  pageSchema,
  sortSchema,
  textSchema
} from '../commons/find.schema';
import { response200, response201 } from '../commons/responses.schema';
import withSchema from '../commons/with-schema';

export default {
  '/s_/product-stock-tracking/company/all': {
    get: {
      tags: ['product-stock-tracking'],
      summary: 'stock staff gets product stock checking at [warehouse|store]',
      description: 'stock staff gets product stock checking at [warehouse|store]',
      parameters: [
        limitSchema,
        pageSchema,
        withSchema(textSchema, {
          name: 'tracking_place',
          'schema.enum': ['warehouse', 'store']
        }),
        withSchema(idSchema, {
          name: 'store_id',
          description: 'required when `tracking_place` is `store`'
        }),
        withSchema(idSchema, {
          name: 'warehouse_id',
          description: 'required when `tracking_place` is `warehouse`'
        }),
        withSchema(idSchema, { name: 'type_category_id' }),
        withSchema(idSchema, { name: 'company_category_id' }),
        withSchema(idSchema, { name: 'sub_category_id' }),
        withSchema(idSchema, { name: 'product_id' }),
        withSchema(isoDateSchema, { name: 'created_from' }),
        withSchema(isoDateSchema, { name: 'created_to' })
      ],
      responses: response200
    }
  },
  '/s_/product-stock-tracking/company/detail': {
    get: {
      tags: ['product-stock-tracking'],
      summary: 'stock staff gets product stock checking for one product at [warehouse|store]',
      description: 'stock staff gets product stock checking for one product at [warehouse|store]',
      parameters: [
        limitSchema,
        pageSchema,
        withSchema(textSchema, {
          name: 'tracking_place',
          'schema.enum': ['warehouse', 'store']
        }),
        withSchema(idSchema, {
          name: 'store_id',
          description: 'required when `tracking_place` is `store`'
        }),
        withSchema(idSchema, {
          name: 'warehouse_id',
          description: 'required when `tracking_place` is `warehouse`'
        }),
        withSchema(idSchema, { name: 'product_id', required: true }),
        withSchema(textSchema, { name: 'date_order', 'schema.enum': ['increasing', 'decreasing'] }),
        withSchema(isoDateSchema, { name: 'created_from' }),
        withSchema(isoDateSchema, { name: 'created_to' })
      ],
      responses: response200
    }
  },
  '/s_/product-stock-tracking/company/sales/detail': {
    get: {
      tags: ['product-stock-tracking'],
      summary: 'Get on sales checking for one product at [mall|store]',
      description: 'Get on sales checking for one product at [mall|store]',
      parameters: [
        limitSchema,
        pageSchema,
        withSchema(textSchema, {
          name: 'tracking_place',
          'schema.enum': ['store', 'mall']
        }),
        withSchema(idSchema, {
          name: 'store_id',
          description: 'required when `tracking_place` is `store`'
        }),
        withSchema(idSchema, {
          name: 'mall_id',
          description: 'required when `tracking_place` is `mall`'
        }),
        withSchema(idSchema, { name: 'product_id', required: true }),
        withSchema(textSchema, { name: 'date_order', 'schema.enum': ['increasing', 'decreasing'] }),
        withSchema(isoDateSchema, { name: 'created_from' }),
        withSchema(isoDateSchema, { name: 'created_to' })
      ],
      responses: response200
    }
  },
  '/s_/product-stock-tracking/company/sales/all': {
    get: {
      tags: ['product-stock-tracking'],
      summary: 'Get on sales checking at [store|mall]',
      description: 'Get on sales checking at [store|mall]',
      parameters: [
        limitSchema,
        pageSchema,
        withSchema(textSchema, {
          name: 'tracking_place',
          'schema.enum': ['mall', 'store']
        }),
        withSchema(idSchema, {
          name: 'store_id',
          description: 'required when `tracking_place` is `store`'
        }),
        withSchema(idSchema, {
          name: 'mall_id',
          description: 'required when `tracking_place` is `mall`'
        }),
        withSchema(idSchema, { name: 'type_category_id' }),
        withSchema(idSchema, { name: 'company_category_id' }),
        withSchema(idSchema, { name: 'sub_category_id' }),
        withSchema(idSchema, { name: 'product_id' }),
        withSchema(isoDateSchema, { name: 'created_from' }),
        withSchema(isoDateSchema, { name: 'created_to' })
      ],
      responses: response200
    }
  }
};
