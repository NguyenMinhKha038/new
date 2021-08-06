import Promise from 'bluebird';
import categoryService from '../../category/category.service';
import productTemplateService from '../../product-template/product-template.service';
import productHandler from './product.handler';
import productService from './product.service';
import productServiceV1 from '../product.service';
import companyActivityService from '../../company-activity/company-activity.service';
import {
  CategoryPopulateFields,
  TemplatePopulateFields,
  PopulatedFields,
  AdminPopulatedFields,
  Statuses
} from './product.config';
import {
  BaseError,
  BaseResponse,
  errorCode,
  mergeObject,
  selectToPopulate,
  splitString,
  withSafety,
  withSession
} from '../../../commons/utils';
import { CompanyActions } from '../../company-activity/company-activity.config';
import { omit } from 'lodash';
import providerService from '../../provider/provider.service';
import { Statuses as ProviderStatuses } from '../../provider/provider.config';
import companyService from '../../company/company.service';
import productStoringService from '../../product-storing/product-storing.service';
import productStoringServiceV2 from '../../product-storing/v2/product-storing.service';
import warehouseStoringService from '../../warehouse-storing/warehouse-storing.service';
import promotionService from '../../promotion/promotion.service';
import addressService from '../../address/address.service';
import { CompanySensitiveExcludes } from '../../company/company.config';
import { getDistance } from 'geolib';

export default {
  company: {
    async create(req, res, next) {
      try {
        const { populate: populateStr } = req.query;

        const {
          product_template_id,
          category_id,
          attributes,
          unknown_attributes,
          tier_variations,
          model_list,
          providers,
          ...productBody
        } = req.body;
        const { id: company_id } = req.company;
        const { id: user_id, is_lucky } = req.user;

        if (productBody.has_wholesale) {
          const modelMissingBoxPrice = model_list.find((model) => !model.box_price);
          if (modelMissingBoxPrice)
            throw new BaseError({
              statusCode: 400,
              error: errorCode.client,
              message: 'Missing box_price in model_list'
            });
        }

        const providersPromise = providers
          ? providers.map(({ provider_id }) =>
              providerService.findOneEnsure({ _id: provider_id, status: ProviderStatuses.Active })
            )
          : [];

        const [productTemplate, category, ...listProviders] = await Promise.all([
          productTemplateService.findOneActiveEnsure({
            query: { _id: product_template_id },
            options: {
              populate: TemplatePopulateFields
            }
          }),
          //findOneEnsure
          categoryService.findById(category_id, null, {
            populate: CategoryPopulateFields
          }),
          ...providersPromise
        ]);
        if (!productTemplate.category_id.equals(category._id))
          throw new BaseError({
            statusCode: 400,
            error: errorCode.client,
            errors: { product: errorCode['client.productTemplateIsNotAllow'] }
          });

        const { type_category_id, company_category_id, sub_category_id } = category;

        const [existedProduct, existedSKU] = await Promise.all([
          productService.findOne({
            name: productBody.name,
            company_id,
            type_category_id,
            company_category_id,
            sub_category_id,
            status: { $ne: Statuses.Disabled }
          }),
          productBody.SKU
            ? productService.findOne({
                company_id,
                SKU: productBody.SKU,
                status: { $ne: Statuses.Disabled }
              })
            : null
        ]);

        if (existedProduct)
          throw new BaseError({
            statusCode: 400,
            error: errorCode.client,
            errors: { product: errorCode['client.productExisted'] }
          });
        if (existedSKU || !productBody.SKU) delete productBody.SKU;

        const allowedAttribute = productHandler.takeAllowedAttribute(
          attributes,
          productTemplate.attributes
        );
        let correctedModelListTierIndex = productHandler.handleTierIndex(
          tier_variations,
          model_list
        );

        if (
          correctedModelListTierIndex.length === 0 &&
          (!productBody.price || (productBody.has_wholesale && !productBody.box_price))
        ) {
          throw new BaseError({
            statusCode: 400,
            message: 'Missing price or box_price',
            error: errorCode.client
          });
        }
        correctedModelListTierIndex = await Promise.mapSeries(
          correctedModelListTierIndex,
          async (model) => {
            if (model.SKU) {
              const existedSKU = await productService.findOne({
                company_id,
                'model_list.SKU': model.SKU
              });
              if (existedSKU) return omit(model, 'SKU');
              return model;
            }
            return model;
          }
        );
        const { category_path, pure_category_path } = productHandler.createCategoryPath(category);

        const { populate } = selectToPopulate(populateStr, PopulatedFields);
        const product = await productService.createAndPopulate({
          doc: {
            ...productBody,
            refund:
              productBody.price && productBody.refund_rate
                ? productBody.refund_rate * productBody.price
                : 0,
            category_id,
            attributes: allowedAttribute,
            unknown_attributes: productTemplate.allow_unknown_attribute
              ? unknown_attributes
              : undefined,
            model_list: correctedModelListTierIndex,
            product_template_id,
            tier_variations,
            company_id,
            user_id,
            category_path,
            pure_category_path,
            type_category_id: category.type_category_id,
            company_category_id: category.company_category_id,
            sub_category_id: category.sub_category_id,
            ...(is_lucky
              ? { is_lucky, status: 'approved', original_price, refund: 0, refund_rate: 0 }
              : {}),
            providers
          },
          populate
        });

        companyService.changeCount(company_id, { total_product: 1 });

        withSafety(() => {
          companyActivityService.implicitCreate(CompanyActions.addProduct)(req, {
            object_id: product._id
          });
        });

        return new BaseResponse({ statusCode: 200, data: product }).return(res);
      } catch (err) {
        next(err);
      }
    },
    async put(req, res, next) {
      try {
        const { id } = req.params;
        const { _id: company_id } = req.company;

        const { populate: populateStr } = req.query;
        let updateBody = req.body;

        const providersPromise = updateBody.providers
          ? updateBody.providers.map(({ provider_id }) =>
              providerService.findOneEnsure({ _id: provider_id, status: ProviderStatuses.Active })
            )
          : [];

        const [product, ...listProviders] = await Promise.all([
          productService.findOneEnsure({
            query: { _id: id, company_id, status: { $ne: Statuses.Disabled } },
            options: {
              populate: [
                {
                  path: 'product_template',
                  populate: [
                    {
                      path: 'attributes.product_attribute',
                      select: 'name values allow_unlisted_value'
                    }
                  ]
                }
              ]
            }
          }),
          ...providersPromise
        ]);
        const { category_id } = product.product_template;

        const currentTemplate = product.product_template;

        const finalTemplate = updateBody.useLatestTemplate
          ? await productTemplateService.getLatestProductTemplateEnsure({
              category_id
            })
          : currentTemplate;

        let correctedModelListTierIndex;
        const { attributes, model_list } = updateBody;
        const tier_variations = updateBody.tier_variations || product.tier_variations;

        if (updateBody.attributes)
          updateBody.attributes = productHandler.takeAllowedAttribute(
            attributes,
            finalTemplate.attributes
          );

        if (updateBody.tier_variations || updateBody.model_list) {
          correctedModelListTierIndex = productHandler.handleTierIndex(tier_variations, model_list);
          correctedModelListTierIndex = productHandler.mergeModelList(
            product.model_list,
            correctedModelListTierIndex
          );
          updateBody.model_list = correctedModelListTierIndex;
        }
        if (!finalTemplate.allow_unknown_attribute) {
          updateBody.unknown_attributes && delete updateBody.unknown_attributes;
        }
        const { populate } = selectToPopulate(populateStr, PopulatedFields);

        let updatedProduct = await productService.findOne({ _id: id });

        const hasBeenApproved = updatedProduct.status === Statuses.Approved ? true : false;

        updateBody.status = updateBody.status || Statuses.Pending;

        Object.assign(updatedProduct, updateBody);

        updatedProduct = await withSession(async (session) => {
          await (await updatedProduct.save({ session }))
            .populate(populate ? populate : [])
            .execPopulate();
          if (updateBody.status === Statuses.Disabled) {
            companyService.changeCount(
              updatedProduct.company_id,
              {
                total_product: -1
              },
              { session }
            );
            if (hasBeenApproved)
              companyService.changeCount(
                updatedProduct.company_id,
                {
                  active_product: -1
                },
                { session }
              );
            await Promise.all([
              productStoringService.updateMany(
                { product_id: updatedProduct._id },
                { is_active_product: false },
                { session }
              ),
              warehouseStoringService.updateMany(
                { product_id: updatedProduct._id },
                { is_active_product: false },
                { session }
              )
            ]);
          } else if (
            (updateBody.status === Statuses.Pending || updateBody.status === Statuses.Inactive) &&
            hasBeenApproved
          )
            companyService.changeCount(
              updatedProduct.company_id,
              {
                active_product: -1
              },
              { session }
            );
          return updatedProduct;
        });

        withSafety(() => {
          companyActivityService.implicitCreate(CompanyActions.updateProductInfo)(req, {
            object_id: updatedProduct._id
          });
        });

        return new BaseResponse({ statusCode: 200, data: updatedProduct }).return(res);
      } catch (err) {
        next(err);
      }
    },
    async get(req, res, next) {
      try {
        const {
          limit,
          page,
          select,
          sort,
          populate: populateStr,
          product_ids,
          text,
          updated_from,
          updated_to,
          created_from,
          created_to,
          store_id,
          ...query
        } = req.query;

        query['$and'] = [{ status: { $ne: Statuses.Disabled } }];

        const { id: company_id } = req.company;

        query.company_id = company_id;
        if (product_ids) {
          query._id = { $in: product_ids };
        }
        if (text) {
          query['$text'] = { $search: text };
        }
        if (updated_from || updated_to) {
          query.company_updated_at = {};
          updated_from && (query.company_updated_at['$gte'] = new Date(updated_from));
          updated_to && (query.company_updated_at['$lte'] = new Date(updated_to));
        }
        if (created_from || created_to) {
          query.createdAt = {};
          created_from && (query.createdAt['$gte'] = new Date(created_from));
          created_to && (query.createdAt['$lte'] = new Date(created_to));
        }

        const { populate } = selectToPopulate(populateStr, PopulatedFields);

        const [products, metaData] = await productService.findWithPagination({
          page,
          limit,
          select,
          sort,
          populate: populate
            ? [
                ...populate,
                {
                  path: 'productStorings',
                  ...(store_id ? { match: { store_id: store_id } } : {}),
                  populate: [
                    {
                      path: 'store'
                    }
                  ]
                }
              ]
            : [],
          query
        });

        return new BaseResponse({ statusCode: 200, data: products }).addMeta(metaData).return(res);
      } catch (err) {
        next(err);
      }
    },
    async getById(req, res, next) {
      try {
        const { id } = req.params;
        const { select, populate: populateStr } = req.query;
        const { id: company_id } = req.company;

        const { populate } = selectToPopulate(populateStr, PopulatedFields);

        const product = await productService.findOneEnsure({
          query: { _id: id, company_id, status: { $ne: Statuses.Disabled } },
          select,
          options: {
            populate
          }
        });

        return new BaseResponse({ statusCode: 200, data: product }).return(res);
      } catch (error) {
        next(error);
      }
    }
  },
  admin: {
    async getById(req, res, next) {
      try {
        const { id } = req.params;
        const { select, populate: populateStr } = req.query;

        // map exclusive fields for admin
        // const populatedFields = PopulatedFields.map(
        //   (pf) => AdminExtendPopulatedFields.find((apf) => apf.path === pf.path) || pf
        // );

        const { populate } = selectToPopulate(populateStr, AdminPopulatedFields);

        const product = await productService.findOneEnsure({
          query: { _id: id },
          select,
          options: {
            populate
          }
        });

        return new BaseResponse({ statusCode: 200, data: product }).return(res);
      } catch (error) {
        next(error);
      }
    },
    async get(req, res, next) {
      try {
        const {
          limit,
          page,
          select,
          sort,
          populate: populateStr,
          product_ids,
          text,
          updated_from,
          updated_to,
          created_from,
          created_to,
          ...query
        } = req.query;

        query['status'] = query['status'] ? query['status'] : Statuses.Approved;

        if (product_ids) {
          query._id = { $in: product_ids };
        }
        if (text) {
          query['$text'] = { $search: text };
        }
        if (updated_from || updated_to) {
          query.company_updated_at = {};
          updated_from && (query.company_updated_at['$gte'] = new Date(updated_from));
          updated_to && (query.company_updated_at['$lte'] = new Date(updated_to));
        }
        if (created_from || created_to) {
          query.createdAt = {};
          created_from && (query.createdAt['$gte'] = new Date(created_from));
          created_to && (query.createdAt['$lte'] = new Date(created_to));
        }

        const { populate } = selectToPopulate(populateStr, AdminPopulatedFields);

        const [products, metaData] = await productService.findWithPagination({
          page,
          limit,
          select,
          sort,
          populate,
          query
        });

        return new BaseResponse({ statusCode: 200, data: products }).addMeta(metaData).return(res);
      } catch (err) {
        next(err);
      }
    }
  },
  async get(req, res, next) {
    try {
      const {
        limit,
        page,
        select,
        sort,
        populate: populateStr,
        updated_from,
        updated_to,
        created_from,
        created_to,
        ...query
      } = req.query;
      if (query.category_id) {
        query.$or = [
          { type_category_id: query.category_id },
          { company_category_id: query.category_id },
          { sub_category_id: query.category_id }
        ];
        delete query.category_id;
      }
      if (updated_from || updated_to) {
        query.company_updated_at = {};
        updated_from && (query.company_updated_at['$gte'] = new Date(updated_from));
        updated_to && (query.company_updated_at['$lte'] = new Date(updated_to));
      }
      if (created_from || created_to) {
        query.createdAt = {};
        created_from && (query.createdAt['$gte'] = new Date(created_from));
        created_to && (query.createdAt['$lte'] = new Date(created_to));
      }

      query.is_active_company = true;
      query.status = Statuses.Approved;

      let { populate } = selectToPopulate(populateStr, PopulatedFields);

      const [products, metaData] = await productService.findWithPagination({
        page,
        limit,
        select,
        sort,
        query,
        populate: populate ? populate : []
      });

      return new BaseResponse({ statusCode: 200, data: products }).addMeta(metaData).return(res);
    } catch (error) {
      next(error);
    }
  },
  async getTop(req, res, next) {
    try {
      const { limit = 20, category_ids, type } = req.query;
      const categoryList = splitString(category_ids);
      const categories = await categoryService.find({ _id: categoryList, type });
      const data = {};
      await Promise.map(categories, async (category) => {
        const query = mergeObject(
          type === 1
            ? { type_category_id: category._id }
            : type === 2
            ? { company_category_id: category._id }
            : { sub_category_id: category._id }
        );
        const products = await productService.find({
          ...query,
          sort: '-views_count',
          limit,
          status: 'approved',
          is_active_company: true
        });
        data[category.id] = products;
      });
      return new BaseResponse({ statusCode: 200, data }).return(res);
    } catch (error) {
      next(error);
    }
  },
  async getById(req, res, next) {
    try {
      const { id } = req.params;
      let [product, productStorings, promotions, address] = await Promise.all([
        productService.findOneActiveEnsure({
          query: { _id: id },
          options: {
            populate: [
              { path: 'company', select: CompanySensitiveExcludes },
              ...(req.user
                ? [
                    {
                      path: 'reaction',
                      select: ' favorite like share shares_count view views_count',
                      match: { user_id: req.user.id }
                    }
                  ]
                : []),
              {
                path: 'promotion',
                match: {
                  start_at: { $lt: new Date() },
                  expire_at: { $gt: new Date() },
                  active: true
                }
              }
            ]
          }
        }),
        productStoringService.find({
          query: { product_id: id, active: true, is_active_store: true, is_active_company: true },
          populate: 'store'
        }),
        promotionService.mFind({
          product_ids: id,
          expire_at: { $gte: new Date() },
          start_at: { $lte: new Date() },
          status: 'active'
        }),
        req.user &&
          addressService.findOne({ user_id: req.user.id }, null, {
            sort: '-is_default'
          })
      ]);
      // assign promotion
      if (promotions.length)
        productStorings.map((productStoring) => {
          let existPromotion = promotions.find((promo) => {
            return promo.store_id.toString() === productStoring.store_id.toString();
          });
          if (existPromotion) {
            existPromotion = omit(existPromotion.toObject(), [
              'max_product_refund',
              'max_product_price',
              'max_product_discount',
              'store_ids',
              'total_payment',
              'total_discount',
              'total_refund',
              'total_uses'
            ]);
            existPromotion.products = existPromotion.products.filter(
              (product) => product.product_id.toString() === productStoring.product_id.toString()
            );
            if (
              existPromotion.products[0].unlimited === false &&
              existPromotion.products[0].remain <= 0
            )
              existPromotion = null;
          }
          productStoring.promotion = existPromotion;
        });

      if (!address) {
        address = addressService.getDefaultAddress();
      }
      productStorings = await Promise.map(
        productStorings,
        (productStoring) => {
          return getDistances({
            address,
            store: productStoring.store,
            productStoring
          });
        }
        // { concurrency: 5 }
      );

      product.productStorings = productStorings
        .sort((a, b) => -a.refund + b.refund)
        .filter((productStoring) => !productStoring.is_limited_stock || productStoring.stock > 0);
      productServiceV1.viewUp({
        product,
        ip: req.headers['x-forwarded-for'],
        user: req.user
      });
      return new BaseResponse({ statusCode: 200, data: product }).return(res);
    } catch (error) {
      next(error);
    }
  }
};
async function getDistances({ address, store, productStoring }) {
  productStoring = productStoring.toObject();
  let lat = address.location.coordinates[1];
  let lon = address.location.coordinates[0];
  let distance = getDistance(
    { lat: store.location.coordinates[1], lon: store.location.coordinates[0] },
    { lat, lon }
  );
  productStoring.store.distance = distance;
  return productStoring;
}
