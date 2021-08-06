import { pick } from 'lodash';
import { BaseResponse } from '../../commons/utils';
import productAttributeService from './product-attribute.service';
import adminActivityService from '../../commons/admin-activity/admin-activity.service';
import populateSensitive from '../../commons/utils/populate-sensitive-field';
import { Types as ActivityTypes } from '../../commons/admin-activity/admin-activity.config';
import { Statuses } from './product-attribute.config';

export default {
  async create(req, res, next) {
    try {
      const { id: admin_id } = req.admin;
      const productAttributeBody = pick(req.body, [
        'name',
        'display_name',
        'values',
        'allow_unlisted_value'
      ]);

      const productAttribute = await productAttributeService.create({
        ...productAttributeBody,
        admin_id
      });

      adminActivityService.create({
        type: ActivityTypes.Insert,
        admin_id,
        on_model: 's_product_attribute',
        object_id: productAttribute._id,
        resource: req.originalUrl,
        snapshot: productAttribute
      });

      return new BaseResponse({ statusCode: 200, data: productAttribute }).return(res);
    } catch (err) {
      next(err);
    }
  },
  async getById(req, res, next) {
    try {
      const { id } = req.params;

      const productAttribute = await productAttributeService.findOne({
        query: { _id: id }
      });

      return new BaseResponse({ statusCode: 200, data: productAttribute }).return(res);
    } catch (err) {
      next(err);
    }
  },
  async get(req, res, next) {
    try {
      const { page, limit, select, sort, text, ...query } = req.query;

      if (text) query['$text'] = { $search: text };

      const [productAttributes, metaData] = await productAttributeService.findWithPagination({
        page,
        limit,
        query,
        select,
        sort
      });

      return new BaseResponse({ statusCode: 200, data: productAttributes })
        .addMeta(metaData)
        .return(res);
    } catch (err) {
      next(err);
    }
  },
  async put(req, res, next) {
    try {
      const { id } = req.params;
      const { id: admin_id } = req.admin;

      const updateBody = pick(req.body, [
        'name',
        'display_name',
        'values',
        'allow_unlisted_value',
        'status'
      ]);

      console.log(updateBody);

      const productAttribute = await productAttributeService.update({ _id: id }, updateBody);

      adminActivityService.create({
        type: ActivityTypes.Update,
        admin_id,
        on_model: 's_product_attribute',
        object_id: productAttribute._id,
        resource: req.originalUrl,
        snapshot: productAttribute,
        updated_fields: updateBody
      });

      return new BaseResponse({ statusCode: 200, data: productAttribute }).return(res);
    } catch (err) {
      next(err);
    }
  },
  async delete(req, res, next) {
    try {
      const { id } = req.params;

      const deletedProductAttribute = await productAttributeService.deleteProductAttribute({
        _id: id
      });
      if (deletedProductAttribute) {
        adminActivityService.create({
          type: ActivityTypes.Update,
          admin_id: req.admin.id,
          on_model: 's_product_attribute',
          object_id: deletedProductAttribute._id,
          resource: req.originalUrl,
          snapshot: deletedProductAttribute,
          updated_fields: deletedProductAttribute
        });
      }

      return new BaseResponse({ statusCode: 200, data: deletedProductAttribute._id })
        .addMeta({ message: 'product attribute has been deleted' })
        .return(res);
    } catch (err) {
      next(err);
    }
  }
};
