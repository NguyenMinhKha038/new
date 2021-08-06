import Joi from '@hapi/joi';
import {
  pathIdSchema,
  textSchema,
  getFindSchema,
  selectSchema,
  booleanSchema
} from '../../commons/utils';
import { Statuses } from './warehouse.config';
import { QueryStatuses } from '../sum-mall/mall-storing/mall-storing.config';

export default {
  getById: {
    params: {
      id: pathIdSchema.required()
    },
    query: {
      select: selectSchema
    }
  },
  get: {
    query: {
      ...getFindSchema(),
      _id: pathIdSchema,
      company_id: pathIdSchema,
      manager_id: pathIdSchema,
      type_category_id: pathIdSchema,
      company_category_id: pathIdSchema,
      status: textSchema.only(Object.values(QueryStatuses)),
      is_active_company: booleanSchema
    }
  },
  company: {
    create: {
      body: {
        name: textSchema.max(256).required(),
        address: Joi.object({
          text: textSchema.min(0).max(256).required(),
          province: textSchema.min(0).max(48).required(),
          district: textSchema.min(0).max(48).required(),
          ward: textSchema.min(0).max(48).required(),
          province_code: textSchema.min(0).max(48).required(),
          district_code: textSchema.min(0).max(48).required(),
          ward_code: textSchema.min(0).max(48).required(),
          phone_number: textSchema.length(10).required(),
          manager_name: textSchema.required()
        }).required(),
        location: textSchema.regex(/^(\-?\d+(\.\d+)?).?,\s*(\-?\d+(\.\d+)?)$/),
        manager_id: pathIdSchema
      }
    },
    put: {
      params: {
        id: pathIdSchema.required()
      },
      body: {
        name: textSchema.max(256),
        address: Joi.object({
          text: textSchema.min(0).max(256).required(),
          province: textSchema.min(0).max(48).required(),
          district: textSchema.min(0).max(48).required(),
          ward: textSchema.min(0).max(48).required(),
          province_code: textSchema.min(0).max(48).required(),
          district_code: textSchema.min(0).max(48).required(),
          ward_code: textSchema.min(0).max(48).required(),
          phone_number: textSchema.length(10).required(),
          manager_name: textSchema.required()
        }),
        location: textSchema.regex(/^(\-?\d+(\.\d+)?).?,\s*(\-?\d+(\.\d+)?)$/),
        manager_id: pathIdSchema,
        status: textSchema.only(Object.values(Statuses))
      }
    },
    delete: {
      params: {
        id: pathIdSchema.required()
      }
    }
  }
};
