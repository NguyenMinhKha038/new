import { pick, uniqBy } from 'lodash';
import productTemplateService from './product-template.service';
import adminActivityService from '../../commons/admin-activity/admin-activity.service';
import { Types as ActivityTypes } from '../../commons/admin-activity/admin-activity.config';
import {
  BaseError,
  BaseResponse,
  errorCode,
  selectToPopulate,
  transactionHelper
} from '../../commons/utils';
import productAttributeService from '../product-attribute/product-attribute.service';
import categoryService from '../category/category.service';
import { CategoryTree, PopulatedFields, Statuses } from './product-template.config';

export default {
  company: {
    async getLatestProductTemplateByCategoryId(req, res, next) {
      try {
        const { category_id } = req.query;

        const latestProductTemplate = await productTemplateService.getLatestProductTemplateEnsure({
          category_id
        });

        return new BaseResponse({ statusCode: 200, data: latestProductTemplate }).return(res);
      } catch (err) {
        next(err);
      }
    }
  },
  admin: {
    async create(req, res, next) {
      try {
        const { category_id, attribute_info, name, allow_unknown_attribute } = req.body;
        let version;

        const attributeInfoUnique = uniqBy(attribute_info, (att) => att.attribute_id);

        //check product attributes exist
        const productAttributes = await Promise.all(
          attributeInfoUnique.map(({ attribute_id }) =>
            productAttributeService.findOneActiveEnsure({ query: { _id: attribute_id } })
          )
        );

        const category = await categoryService.findOne({ _id: category_id });

        if (!category)
          throw new BaseError({
            statusCode: 404,
            error: errorCode.client,
            errors: { category_type: errorCode['client.categoryNotExist'] }
          });

        const [childrenCategory, existedTemplate] = await Promise.all([
          // find children category of request category
          // a valid category for template is a category doesn't have a children category
          categoryService.findOne({
            type: category.type + 1,
            [CategoryTree[category.type - 1]]: category._id
          }),
          productTemplateService.getLatestProductTemplate({ category_id })
        ]);

        if (childrenCategory)
          throw new BaseError({
            statusCode: 400,
            error: errorCode.client,
            errors: { category_type: errorCode['client.categoryMustBeLowestInCategoryTree'] }
          });

        version = existedTemplate ? existedTemplate.version + 1 : 1;

        const newProductTemplate = await productTemplateService.createAndPopulate({
          doc: {
            category_id,
            attributes: attributeInfoUnique,
            name,
            allow_unknown_attribute,
            version
          },
          populate: PopulatedFields
        });

        adminActivityService.create({
          admin_id: req.admin.id,
          object_id: newProductTemplate._id,
          type: ActivityTypes.Insert,
          snapshot: newProductTemplate,
          resource: req.originalUrl
        });

        return new BaseResponse({ statusCode: 200, data: newProductTemplate }).return(res);
      } catch (err) {
        next(err);
      }
    },
    async update(req, res, next) {
      try {
        const { id } = req.params;
        const updateBody = pick(req.body, [
          'attribute_info',
          'name',
          'allow_unknown_attribute',
          'category_id'
        ]);

        if (updateBody.category_id) {
          const category = await categoryService.findOne({ _id: updateBody.category_id });

          if (!category)
            throw new BaseError({
              statusCode: 404,
              error: errorCode.client,
              errors: { category_type: errorCode['client.categoryNotExist'] }
            });

          const [childrenCategory, existedTemplate] = await Promise.all([
            // find children category of request category
            // a valid category for template is a category doesn't have a children category
            categoryService.findOne({
              type: category.type + 1,
              [CategoryTree[category.type - 1]]: category._id
            }),
            productTemplateService.getLatestProductTemplate({ category_id: updateBody.category_id })
          ]);

          if (childrenCategory)
            throw new BaseError({
              statusCode: 400,
              error: errorCode.client,
              errors: { category_type: errorCode['client.categoryMustBeLowestInCategoryTree'] }
            });
          updateBody.version = existedTemplate ? existedTemplate.version + 1 : undefined;
        }

        const attributeInfoUnique = uniqBy(updateBody.attribute_info, (att) => att.attribute_id);

        // check list of attributes valid
        const productAttributes = await Promise.all(
          attributeInfoUnique.map(({ attribute_id }) =>
            productAttributeService.findOneActiveEnsure({ query: { _id: attribute_id } })
          )
        );

        updateBody.attributes = attributeInfoUnique;

        const pendingProductTemplate = await productTemplateService.getOne({
          query: { _id: id, status: Statuses.Pending }
        });

        if (!pendingProductTemplate) {
          throw new BaseError({
            statusCode: 400,
            error: errorCode.client,
            errors: { product_template: errorCode['client.cannotUpdateActiveProductTemplate'] }
          });
        }

        const updatedProductTemplate = await productTemplateService.updateOneAndPopulate({
          query: { _id: id },
          data: updateBody,
          populate: PopulatedFields
        });

        adminActivityService.create({
          type: ActivityTypes.Update,
          admin_id: req.admin.id,
          on_model: 's_product_template',
          object_id: updatedProductTemplate._id,
          resource: req.originalUrl,
          snapshot: updatedProductTemplate,
          updated_fields: updateBody
        });

        return new BaseResponse({ statusCode: 200, data: updatedProductTemplate }).return(res);
      } catch (err) {
        next(err);
      }
    },
    async get(req, res, next) {
      try {
        const { page, limit, select, sort, populate: populateStr, ...query } = req.query;

        const { populate } = selectToPopulate(populateStr, PopulatedFields);

        const [productTemplates, metaData] = await productTemplateService.findWithPagination({
          page,
          limit,
          select,
          sort,
          query,
          populate
        });

        return new BaseResponse({ statusCode: 200, data: productTemplates })
          .addMeta(metaData)
          .return(res);
      } catch (err) {
        next(err);
      }
    },
    async getById(req, res, next) {
      try {
        const { id } = req.params;

        const productTemplate = await productTemplateService.getOne({
          query: { _id: id },
          options: { populate: PopulatedFields }
        });

        return new BaseResponse({ statusCode: 200, data: productTemplate }).return(res);
      } catch (err) {
        next(err);
      }
    },
    async updateStatus(req, res, next) {
      try {
        const { id } = req.params;
        const { status } = req.body;

        const productTemplateInPending = await productTemplateService.findOne({
          _id: id,
          status: Statuses.Pending
        });

        if (!productTemplateInPending) {
          throw new BaseError({
            statusCode: 400,
            error: errorCode.client,
            errors: { product_template: errorCode['client.productTemplateNotInPending'] }
          });
        }

        const activeProductTemplate = await transactionHelper.withSession(async (session) => {
          if (status === Statuses.Active)
            await productTemplateService.deleteMany(
              { category_id: productTemplateInPending.category_id, status: Statuses.Active },
              { session }
            );

          const updatedProductTemplate = await productTemplateService.updateOneAndPopulate({
            query: {
              _id: productTemplateInPending._id
            },
            data: { status },
            options: { session },
            populate: PopulatedFields
          });

          adminActivityService.create({
            type: ActivityTypes.Update,
            admin_id: req.admin.id,
            on_model: 's_product_template',
            object_id: updatedProductTemplate._id,
            resource: req.originalUrl,
            snapshot: updatedProductTemplate,
            updated_fields: { status }
          });

          return updatedProductTemplate;
        });

        return new BaseResponse({
          statusCode: 200,
          data: activeProductTemplate
        }).return(res);
      } catch (err) {
        next(err);
      }
    }
  }
};
