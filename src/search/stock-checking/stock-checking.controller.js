import {
  BaseError,
  BaseResponse,
  errorCode,
  selectToPopulate,
  transactionHelper,
  withSafety
} from '../../commons/utils';
import categoryService from '../category/category.service';
import permissionGroupService from '../permission-group/permission-group.service';
import productStoringService from '../product-storing/v2/product-storing.service';
import storeService from '../store/store.service';
import warehouseService from '../warehouse/warehouse.service';
import warehouseStoringService from '../warehouse-storing/warehouse-storing.service';
import stockCheckingService from './stock-checking.service';
import stockCheckingItemService from '../stock-checking-item/stock-checking-item.service';
import {
  AllowedStaffRole,
  AllowedStatusUpdate,
  CheckingPlaces,
  CheckingTypes,
  PopulatedFields,
  Statuses
} from './stock-checking.config';
import productService from '../product/v2/product.service';
import { pick } from 'lodash';
import mallService from '../sum-mall/mall/mall.service';
import staffService from '../sum-mall/staff/staff.service';
import mallStoringService from '../sum-mall/mall-storing/mall-storing.service';
import { CompanyActions } from '../company-activity/company-activity.config';
import companyActivityService from '../company-activity/company-activity.service';

export default {
  company: {
    async create(req, res, next) {
      try {
        const stockPermission = req.stock_permission;
        const { company_id } = req.stock_permission;
        const { populate: populateStr } = req.query;

        const { staff_id, store_id, warehouse_id, checking_place, type, category_id } = req.body;

        // check if user exist in store||warehouse or not
        if (!stockPermission[`${checking_place}_ids`].includes(req.body[`${checking_place}_id`])) {
          throw new BaseError({
            statusCode: 403,
            error: errorCode.authorization,
            errors: { stockChecking: errorCode['permission.notAllow'] }
          });
        }

        let storingService;
        let checking_place_id;
        let storingItemsQuery = {};
        let staffQuery = {};

        if (store_id) {
          const store = await storeService.findOneEnsure({ company_id, _id: store_id });
          storingService = productStoringService;
          storingItemsQuery.store_id = store._id;
          staffQuery.store_id = store._id;
          checking_place_id = store._id;
        }

        if (warehouse_id) {
          const warehouse = await warehouseService.findOneEnsure({ company_id, _id: warehouse_id });
          storingService = warehouseStoringService;
          storingItemsQuery.warehouse_id = warehouse._id;
          staffQuery.warehouse_id = warehouse_id;
          checking_place_id = warehouse._id;
        }

        if (staff_id) {
          const staffPermission = await permissionGroupService.findOneActive({
            ...staffQuery,
            company_id,
            user_id: staff_id,
            type: { $in: Object.values(AllowedStaffRole) }
          });
          if (!staffPermission)
            throw new BaseError({
              statusCode: 404,
              error: errorCode.client,
              errors: { warehouse: errorCode['client.staffNotExists'] }
            });
        }

        if (category_id && type === CheckingTypes.Category) {
          //find one active ensure
          await categoryService.findActive(category_id);
        }

        switch (type) {
          case CheckingTypes.All:
            storingItemsQuery = { ...storingItemsQuery, company_id };
            break;
          case CheckingTypes.Category:
            storingItemsQuery = {
              ...storingItemsQuery,
              company_id,
              $or: [
                { company_category_id: category_id },
                { type_category_id: category_id },
                { sub_category_id: category_id }
              ]
            };
            break;
        }

        const storingItems =
          type !== CheckingTypes.Custom
            ? (await storingService.findWithPagination({ query: storingItemsQuery }))[0]
            : [];

        const { populate } = selectToPopulate(populateStr, PopulatedFields);

        const [stockChecking, stockCheckingItems] = await transactionHelper.withSession(
          async (session) => {
            const stockChecking = await stockCheckingService.createAndPopulate({
              doc: {
                staff_id,
                company_id,
                store_id,
                warehouse_id,
                checking_place,
                checking_place_id,
                type,
                category_id: type === CheckingTypes.Category ? category_id : undefined
              },
              options: { session },
              populate: populate || []
            });
            const stockCheckingItems = await Promise.all(
              storingItems.map(async ({ _id, product_id, warehouse_id, store_id }) => {
                const product = await productService.findOne({ _id: product_id });
                if (product)
                  return await stockCheckingItemService.create(
                    {
                      stock_checking_id: stockChecking._id,
                      warehouse_storing_id: warehouse_id ? _id : undefined,
                      product_storing_id: store_id ? _id : undefined,
                      storing_id: _id,
                      product_id,
                      name: product.name
                    },
                    { session }
                  );
              })
            );
            return [stockChecking, stockCheckingItems];
          }
        );
        withSafety(() => {
          companyActivityService.implicitCreate(CompanyActions.createStockChecking)(req, {
            object_id: stockChecking._id
          });
        });
        return new BaseResponse({ statusCode: 201, data: stockChecking }).return(res);
      } catch (err) {
        next(err);
      }
    },
    async update(req, res, next) {
      try {
        const { id } = req.params;
        const { company_id, is_owner } = req.stock_permission;
        const stockPermission = req.stock_permission;

        const user_id = req.user.id;
        const { populate: populateStr } = req.query;

        const updateBody = pick(req.body, ['staff_id', 'status']);

        const stockChecking = await stockCheckingService.findOne({
          _id: id,
          company_id,
          status: { $ne: Statuses.Disabled }
        });
        if (!stockChecking)
          throw new BaseError({
            statusCode: 404,
            error: errorCode.client,
            errors: { stockChecking: errorCode['client.stockCheckingNotFound'] }
          });
        if (stockChecking.store_id) {
          if (!stockPermission.store_ids.includes(stockChecking.store_id.toString()))
            throw new BaseError({
              statusCode: 403,
              error: errorCode.authorization,
              errors: { stockChecking: errorCode['permission.notAllow'] }
            });
        }
        if (stockChecking.warehouse_id) {
          if (!stockPermission.warehouse_ids.includes(stockChecking.warehouse_id.toString()))
            throw new BaseError({
              statusCode: 403,
              error: errorCode.authorization,
              errors: { stockChecking: errorCode['permission.notAllow'] }
            });
        }
        const manager = stockPermission.type
          ? stockPermission.type.find(
              (type) =>
                type === AllowedStaffRole.StoreManager || type === AllowedStaffRole.WarehouseManager
            )
          : null;

        // only assigned staff can edit stock checking status
        if (!manager && !is_owner && user_id.toString() !== stockChecking.staff_id.toString()) {
          throw new BaseError({
            statusCode: 400,
            error: errorCode.authorization,
            errors: { stockChecking: errorCode['permission.notAllow'] }
          });
        }

        // staff can't assign task to another staff
        if (!manager && !is_owner) delete updateBody.staff_id;

        if (!AllowedStatusUpdate[stockChecking.status][updateBody.status])
          throw new BaseError({
            statusCode: 400,
            error: errorCode.client,
            errors: { stockChecking: errorCode['client.statusNotAllowed'] }
          });

        //check if new staff exist in store || warehouse
        if (updateBody.staff_id) {
          const staffQuery = {};
          if (stockChecking.store_id) {
            staffQuery.store_id = stockChecking.store_id;
          }
          if (stockChecking.warehouse_id) {
            staffQuery.warehouse_id = stockChecking.warehouse_id;
          }
          const staffPermission = await permissionGroupService.findOneActive({
            ...staffQuery,
            company_id,
            user_id: updateBody.staff_id,
            type: { $in: Object.values(AllowedStaffRole) }
          });
          if (!staffPermission)
            throw new BaseError({
              statusCode: 404,
              error: errorCode.client,
              errors: { warehouse: errorCode['client.staffNotExists'] }
            });
        }

        if (updateBody.status === Statuses.Handling) {
          updateBody.checking_date = Date.now();
        }
        if (updateBody.status === Statuses.Completed) {
          updateBody.completed_date = Date.now();
        }

        const { populate } = selectToPopulate(populateStr, PopulatedFields);

        const updatedStockChecking = await stockCheckingService.updateAndPopulate({
          query: { _id: id },
          doc: updateBody,
          populate
        });

        withSafety(() => {
          companyActivityService.implicitCreate(CompanyActions.updateStockChecking)(req, {
            object_id: stockChecking._id
          });
        });

        return new BaseResponse({ statusCode: 200, data: updatedStockChecking }).return(res);
      } catch (err) {
        next(err);
      }
    },
    async get(req, res, next) {
      try {
        const { company_id } = req.stock_permission;
        const {
          status,
          page,
          limit,
          select,
          sort,
          populate: populateStr,
          created_from,
          created_to,
          checking_date_from,
          checking_date_to,
          completed_date_from,
          completed_date_to,
          ...query
        } = req.query;

        if (created_from || created_to) {
          query.createdAt = {};
          created_from && (query.createdAt['$gte'] = new Date(created_from));
          created_to && (query.createdAt['$lte'] = new Date(created_to).setHours(23, 59, 59, 999));
        }
        if (checking_date_from || checking_date_to) {
          query.checking_date = {};
          checking_date_from && (query.checking_date['$gte'] = new Date(checking_date_from));
          checking_date_to &&
            (query.checking_date['$lte'] = new Date(checking_date_to).setHours(23, 59, 59, 999));
        }
        if (completed_date_from || completed_date_to) {
          query.completed_date = {};
          completed_date_from && (query.completed_date['$gte'] = new Date(completed_date_from));
          completed_date_to &&
            (query.completed_date['$lte'] = new Date(completed_date_to).setHours(23, 59, 59, 999));
        }
        query.status = status ? status : { $ne: Statuses.Disabled };
        query.company_id = company_id;
        const { populate } = selectToPopulate(populateStr, PopulatedFields);

        const [stockCheckings, metaData] = await stockCheckingService.findWithPagination({
          page,
          limit,
          select,
          sort,
          populate,
          query
        });

        return new BaseResponse({ statusCode: 200, data: stockCheckings })
          .addMeta(metaData)
          .return(res);
      } catch (err) {
        next(err);
      }
    },
    async getById(req, res, next) {
      try {
        const { id } = req.params;
        const { company_id } = req.stock_permission;

        const stockChecking = await stockCheckingService.findOneEnsure(
          { _id: id, company_id },
          null,
          {
            populate: PopulatedFields
          }
        );

        return new BaseResponse({ statusCode: 200, data: stockChecking }).return(res);
      } catch (err) {
        next(err);
      }
    }
  },
  company_mall: {
    async create(req, res, next) {
      try {
        const { is_mall_manager, mall_id: mall_id_auth } = req.mall;
        const { staff_id, mall_id, type, category_id } = req.body;

        if (mall_id !== mall_id_auth.toString()) {
          throw new BaseError({
            statusCode: 403,
            error: errorCode.authorization,
            errors: { stockChecking: errorCode['permission.notAllow'] }
          });
        }

        const mall = await mallService.findEnsure({ _id: mall_id });

        const mallStoringQuery = { mall_id: mall._id };

        staff_id && (await staffService.findEnsure({ _id: staff_id }));

        if (category_id) {
          await categoryService.findActive(category_id);
          mallStoringQuery['$or'] = [
            { company_category_id: category_id },
            { type_category_id: category_id },
            { sub_category_id: category_id }
          ];
        }

        const storingItems =
          type !== CheckingTypes.Custom
            ? (await mallStoringService.findWithPagination({ query: mallStoringQuery }))[0]
            : [];
        const { populate } = selectToPopulate(populateStr, PopulatedFields);

        const [stockChecking, stockCheckingItems] = await transactionHelper.withSession(
          async (session) => {
            const stockChecking = await stockCheckingService.createAndPopulate({
              doc: {
                staff_id,
                mall_id,
                checking_place: CheckingPlaces.Mall,
                checking_place_id: mall._id,
                type,
                category_id: type === CheckingTypes.Category ? category_id : undefined
              },
              options: { session },
              populate: populate || []
            });
            const stockCheckingItems = await Promise.all(
              storingItems.map(async ({ _id, product_id, mall_id }) => {
                const product = await productService.findOne({ _id: product_id });
                if (product)
                  return await stockCheckingItemService.create(
                    {
                      stock_checking_id: stockChecking._id,
                      mall_id: mall_id,
                      storing_id: _id,
                      product_id,
                      name: product.name
                    },
                    { session }
                  );
              })
            );
            return [stockChecking, stockCheckingItems];
          }
        );
        return new BaseResponse({ statusCode: 201, data: stockChecking }).return(res);
      } catch (err) {
        next(err);
      }
    },
    async update(req, res, next) {
      try {
        const { id } = req.params;
        const { is_mall_manager, mall_id } = req.mall;
        const user_id = req.user.id;
        const { populate: populateStr } = req.query;

        const updateBody = pick(req.body, ['staff_id', 'status']);

        const stockChecking = await stockCheckingService.findOne({
          _id: id,
          mall_id,
          status: { $ne: Statuses.Disabled }
        });
        if (!stockChecking)
          throw new BaseError({
            statusCode: 404,
            error: errorCode.client,
            errors: { stockChecking: errorCode['client.stockCheckingNotFound'] }
          });

        // only assigned staff can edit stock checking status
        if (!is_mall_manager && user_id.toString() !== stockChecking.staff_id.toString()) {
          throw new BaseError({
            statusCode: 400,
            error: errorCode.authorization,
            errors: { stockChecking: errorCode['permission.notAllow'] }
          });
        }

        // staff can't assign task to another staff
        if (!is_mall_manager) delete updateBody.staff_id;

        if (!AllowedStatusUpdate[stockChecking.status][updateBody.status])
          throw new BaseError({
            statusCode: 400,
            error: errorCode.client,
            errors: { stockChecking: errorCode['client.statusNotAllowed'] }
          });

        //check if new staff exist in store || warehouse
        if (updateBody.staff_id) {
          const staffPermission = await permissionGroupService.findOneActive({
            mall_id: stockChecking.mall_id,
            user_id: updateBody.staff_id,
            type: { $in: Object.values(AllowedStaffRole) }
          });
          if (!staffPermission)
            throw new BaseError({
              statusCode: 404,
              error: errorCode.client,
              errors: { warehouse: errorCode['client.staffNotExists'] }
            });
        }

        if (updateBody.status === Statuses.Handling) {
          updateBody.checking_date = Date.now();
        }
        if (updateBody.status === Statuses.Completed) {
          updateBody.completed_date = Date.now();
        }

        const { populate } = selectToPopulate(populateStr, PopulatedFields);

        const updatedStockChecking = await stockCheckingService.updateAndPopulate({
          query: { _id: id },
          doc: updateBody,
          populate
        });

        return new BaseResponse({ statusCode: 200, data: updatedStockChecking }).return(res);
      } catch (err) {
        next(err);
      }
    },
    async get(req, res, next) {
      try {
        const { mall_id } = req.mall;
        const {
          status,
          page,
          limit,
          select,
          sort,
          populate: populateStr,
          created_from,
          created_to,
          checking_date_from,
          checking_date_to,
          completed_date_from,
          completed_date_to,
          ...query
        } = req.query;

        if (created_from || created_to) {
          query.createdAt = {};
          created_from && (query.createdAt['$gte'] = new Date(created_from));
          created_to && (query.createdAt['$lte'] = new Date(created_to).setHours(23, 59, 59, 999));
        }
        if (checking_date_from || checking_date_to) {
          query.checking_date = {};
          checking_date_from && (query.checking_date['$gte'] = new Date(checking_date_from));
          checking_date_to &&
            (query.checking_date['$lte'] = new Date(checking_date_to).setHours(23, 59, 59, 999));
        }
        if (completed_date_from || completed_date_to) {
          query.completed_date = {};
          completed_date_from && (query.completed_date['$gte'] = new Date(completed_date_from));
          completed_date_to &&
            (query.completed_date['$lte'] = new Date(completed_date_to).setHours(23, 59, 59, 999));
        }
        query.status = status ? status : { $ne: Statuses.Disabled };
        query.mall_id = mall_id;

        const { populate } = selectToPopulate(populateStr, PopulatedFields);

        const [stockCheckings, metaData] = await stockCheckingService.findWithPagination({
          page,
          limit,
          select,
          sort,
          populate,
          query
        });

        return new BaseResponse({ statusCode: 200, data: stockCheckings })
          .addMeta(metaData)
          .return(res);
      } catch (err) {
        next(err);
      }
    },
    async getById(req, res, next) {
      try {
        const { id } = req.params;
        const { mall_id } = req.mall;

        const stockChecking = await stockCheckingService.findOneEnsure({ _id: id, mall_id }, null, {
          populate: PopulatedFields
        });

        return new BaseResponse({ statusCode: 200, data: stockChecking }).return(res);
      } catch (err) {
        next(err);
      }
    }
  }
};
