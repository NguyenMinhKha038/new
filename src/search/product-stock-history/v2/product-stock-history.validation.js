import Joi from '@hapi/joi';
import { Types, Statuses, RelateTo } from './product-stock-history.config';
import {
  pathIdSchema,
  getFindSchema,
  textSchema,
  booleanSchema,
  isoDateSchema
} from '../../../commons/utils';
import { MovingTypes, ExportTypes } from '../../goods-batch/goods-batch.config';

export default {
  getById: {
    params: {
      id: pathIdSchema
    },
    query: {
      select: textSchema,
      populate: textSchema
    }
  },
  get: {
    query: {
      ...getFindSchema(),
      status: textSchema.only(Object.values(Statuses)),
      _id: pathIdSchema,
      user_id: pathIdSchema,
      from_store_id: pathIdSchema,
      to_store_id: pathIdSchema,
      from_warehouse_id: pathIdSchema,
      to_warehouse_id: pathIdSchema,
      from_mall_id: pathIdSchema,
      to_mall_id: pathIdSchema,
      company_id: pathIdSchema,
      type: Joi.alternatives().try(
        textSchema.only(Object.values(Types)),
        Joi.array().items(textSchema.only(Object.values(Types)))
      ),
      direction: textSchema.only(['in', 'out']),
      direction_entity_id: pathIdSchema.when('direction', {
        is: Joi.exist(),
        then: Joi.required(),
        otherwise: Joi.forbidden()
      }),
      moving_type: textSchema.only(Object.values(MovingTypes)),
      transaction_id: pathIdSchema,
      on_model: textSchema.only(['s_order']),
      relate_to: textSchema,
      need_approved: booleanSchema,
      confirmed_difference: booleanSchema,
      need_confirm_difference: booleanSchema,
      export_type: textSchema.only(Object.values(ExportTypes)),
      'requester.user_id': pathIdSchema,
      'requester.mall_id': pathIdSchema,
      'requester.warehouse_id': pathIdSchema,
      'requester.store_id': pathIdSchema,
      'approver.user_id': pathIdSchema,
      'approver.mall_id': pathIdSchema,
      'approver.warehouse_id': pathIdSchema,
      'approver.store_id': pathIdSchema,
      'confirmor.user_id': pathIdSchema,
      'confirmor.mall_id': pathIdSchema,
      'confirmor.warehouse_id': pathIdSchema,
      'confirmor.store_id': pathIdSchema,
      'batches.original_batch_id': pathIdSchema,
      'batches.batch_id': pathIdSchema,
      'batches.batch_code': textSchema,
      'batches.product_id': pathIdSchema,
      'products.product_id': pathIdSchema,
      product_id: pathIdSchema,
      // special query fields
      created_from: isoDateSchema,
      created_to: isoDateSchema,
      store_id: pathIdSchema,
      warehouse_id: pathIdSchema,
      mall_id: pathIdSchema
    }
  }
};
