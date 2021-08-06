/* eslint-disable prettier/prettier */
import { Promise } from 'bluebird';
import { BaseError, errorCode, mergeObject } from '../../../commons/utils';
import productStoringModel from '../product-storing.model';
import productStockHistoryServiceV2 from '../../product-stock-history/v2/product-stock-history.service';
import {
  Types as HistoryTypes,
  RelateTo
} from '../../product-stock-history/v2/product-stock-history.config';
import productService from '../../product/product.service';
import productServiceV2 from '../../product/v2/product.service';
import productStoringService from './product-storing.service';
import storeService from '../../store/store.service';
import companyService from '../../company/company.service';
import { DeletedStatus, PopulatedFields } from '../product-storing.config';
import { Statuses } from './product-storing.config';
import sellingOptionService from '../../selling-option/selling-option.service';
import groupService from '../../group/group.service';
import tagService from '../../tag/tag.service';
import { Scopes as TagScopes } from '../../tag/tag.config';
import {
  TrackingPlaces,
  Types as TrackingTypes
} from '../../product-stock-tracking/product-stock-tracking.config';
import productStockTrackingService from '../../product-stock-tracking/product-stock-tracking.service';
import { SaleForms } from '../../order/v2/order.config';

const productStoringHandler = {
  async createOrUpdateStock(data, options = {}) {
    const { session, populate, create = true, update = true } = options;
    const {
      _id,
      id,
      __v,
      product_storing_id,
      store_storing_id,
      updatedAt,
      createdAt,
      status,
      ...dataToCreate
    } = data;

    // Check if product storing exists or not
    const { store_id, product_id, model_id, company_id } = dataToCreate;
    const query =
      product_storing_id || store_storing_id
        ? {
            _id: product_storing_id || store_storing_id,
            status: { $ne: DeletedStatus },
            is_directed_import: false
          }
        : {
            product_id,
            company_id,
            store_id,
            is_directed_import: false,
            status: { $ne: DeletedStatus }
          };
    let productStoring = await productStoringService.findOne(query, null, {
      populate,
      session
    });

    // Create new one or update product storing
    let productStoringSnapshot = null;
    if (!productStoring && create) {
      if (model_id) {
        const index = dataToCreate.model_list.findIndex(
          (model) => model.model_id === model_id.toString()
        );
        if (index !== -1) {
          dataToCreate.model_list[index].on_sales_stock = dataToCreate.on_sales_stock;
          dataToCreate.model_list[index].batch_stock = dataToCreate.batch_stock;
        }
      } else if (dataToCreate.model_list[0].name === 'Default') {
        dataToCreate.model_list[0].on_sales_stock = dataToCreate.on_sales_stock;
        dataToCreate.model_list[0].batch_stock = dataToCreate.batch_stock;
      }
      productStoring = await new productStoringModel(dataToCreate).save({ session });
      // Update total products in store
      await storeService.findOneActiveAndUpdate(
        { _id: store_id, company_id },
        { $inc: { total_product: 1, active_product: 1 } },
        { session }
      );
    } else if (update && productStoring) {
      productStoringSnapshot = productStoring.toObject();
      if (productStoring.is_limited_stock) {
        productStoring.batch_stock += dataToCreate.batch_stock || 0;
        productStoring.on_sales_stock += dataToCreate.on_sales_stock || 0;
        productStoring.stock = productStoring.batch_stock + productStoring.on_sales_stock;

        if (model_id) {
          const index = productStoring.model_list.findIndex(
            (model) => model.model_id === model_id.toString()
          );
          if (index !== -1) {
            productStoring.model_list[index].on_sales_stock += dataToCreate.on_sales_stock;
            productStoring.model_list[index].batch_stock += dataToCreate.batch_stock;
          }
        } else if (productStoring.model_list[0].name === 'Default') {
          productStoring.model_list[0].on_sales_stock += dataToCreate.on_sales_stock;
          productStoring.model_list[0].batch_stock += dataToCreate.batch_stock;
        }
      }
      await productStoring.save({ session });
    }

    return {
      productStoring,
      productStoringSnapshot,
      storeStoring: productStoring,
      storeStoringSnapshot: productStoringSnapshot
    };
  },
  async getProduct({ storeId, companyId, productId }, doc = {}, options = {}) {
    const { session } = options;
    let productStoring = await productStoringService.findOne(
      {
        company_id: companyId,
        store_id: storeId,
        product_id: productId,
        is_directed_import: false
      },
      null,
      options
    );
    if (productStoring) {
      return productStoring;
    }

    // Check if one of [store, company, product] is not found
    const [store, company, product] = await Promise.all([
      storeService.findOne({ _id: storeId }, null, { session }),
      companyService.findOne({ _id: companyId }, null, { session }),
      productServiceV2.findOne({ _id: productId }, null, { session })
    ]);
    const errorData = { errorCode: 404, error: errorCode.client };
    if (!store) {
      throw new BaseError({
        ...errorData,
        errors: { store: errorCode['client.storeNotExist'] }
      });
    }
    if (!company) {
      throw new BaseError({
        ...errorData,
        errors: { company: errorCode['client.companyNotExist'] }
      });
    }
    if (!product) {
      throw new BaseError({
        ...errorData,
        errors: { product: errorCode['client.productNotExist'] }
      });
    }

    // Create new
    const { _id, id, createdAt, updatedAt, status, ...productData } = product.toObject();
    const dataToCreate = {
      ...productData,
      store_id: storeId,
      company_id: companyId,
      product_id: productId,
      stock: doc.stock || 0,
      batch_stock: 0,
      on_sales_stock: doc.stock || 0,
      is_active_product: product.status === 'approved',
      is_active_company: company.status === 'approved',
      is_active_store: store.status === 'active'
    };

    productStoring = await productStoringService.update(
      { company_id: companyId, store_id: storeId, product_id: productId },
      dataToCreate,
      options
    );

    productStoring.product = product;
    await Promise.all([
      productStoringService.updateOneByPromotion({ productStoring }),
      storeService.updateOneByPromotion(store),
      storeService.updateProductCount(storeId, { session })
    ]);

    productStoring.product = undefined;

    return productStoring;
  },
  async updateStock(
    {
      productStoringDoc,
      productStoringId, //
      storeStoringDoc,
      storeStoringId,
      stock: stockToUpdate = 0, //
      model_stock = {}, //
      accompanied_stock = {},
      sale_form
    },
    options = {}
  ) {
    const { session } = options;

    let storingDoc = null;
    let storingId = productStoringId || storeStoringId;
    if (productStoringDoc || storeStoringDoc) {
      storingDoc = productStoringDoc || storeStoringDoc;
    } else if (storingId) {
      storingDoc = await productStoringService.findOne( //điều kiện
        null,
        { session, populate: PopulatedFields }
      );
    }
    if (!storingDoc) {
      throw new BaseError({
        statusCode: 404,
        error: errorCode.client,
        errors: { product_storing_id: errorCode['client.productNotExistInStore'] }
      });
    }

    // Cache storingDoc
    const storingSnapshot = storingDoc.toObject();

    await Promise.map(accompanied_stock.accompanied_products, async (product) => {
      let accompaniedQuantity;
      let accompanied_product = storingDoc.accompanied_products.find((item) => { // kiểm tra accompany_product có nằm trong danh sách sản phẩm kèm theo của productStoring k
        if (item.product_storing_id.toString() === product.product_storing_id.toString()) {
          accompaniedQuantity = item.on_sales_stock; //mỗi 1 sp sẽ có ds sản phẩm kèm theo. Kiểm tra nếu đúng điều kiện trên thì số accompaniedQuantity = số lượng sp hiện có kèm theo hiện có
          return true;
        }
        return false;
      });
      const accompaniedStoring = await productStoringService.findActive({ //tìm cái sản phẩm đính kèm đó
        _id: product.product_storing_id,
        options: { session }
      });
      const maxQuantity =
        accompaniedQuantity < accompaniedStoring.on_sales_stock // kiểm tra số lượng sản phẩm kèm theo cần có nếu nhỏ hơn số lượng sản phẩm đang có ở ch
          ? accompaniedQuantity //thì giữ nguyên số lượng đó, ngược lại nếu số lượng cần có lớn hơn số lượng hiện tại ở ch thì lấy số lượng đang có ở ch
          : accompaniedStoring.on_sales_stock;
      if (
        accompanied_stock.action === 'remove_product' &&
        product.quantity < 0 &&
        Math.abs(product.quantity) > maxQuantity
      ) {
        throw new BaseError({
          statusCode: 400,
          error: errorCode.client,
          errors: {
            quantity: errorCode['client.accompaniedProductQuantityNotEnough']
          }
        });
      }
      const accompaniedQuantityUpdate =
        accompanied_stock.action === 'add_product' ? -product.quantity : product.quantity; // nếu kiểu la2 add thì trừ số lượng ra
      accompaniedStoring.stock += accompaniedQuantityUpdate;
      accompaniedStoring.on_sales_stock += accompaniedQuantityUpdate;
      accompaniedStoring.sold_count -= accompaniedQuantityUpdate;
      accompanied_product.on_sales_stock += accompaniedQuantityUpdate;
      accompanied_product.sold -= accompaniedQuantityUpdate;

      await accompaniedStoring.save({ session });
    });

    // Update stock of product storing
    if (stockToUpdate && storingDoc.is_limited_stock) {
      const stockFromStoring = storingDoc.stock;
      if (stockFromStoring + stockToUpdate < 0) {
        throw new BaseError({
          statusCode: 400,
          error: errorCode.client,
          errors: { stock: errorCode['client.stockCannotBeNegative'] }
        });
      }

      const updateStockModel = storingDoc.model_list.find(
        (model) => model._id.toString() === model_stock.model_id.toString()
      );

      if (updateStockModel.on_sales_stock + model_stock.stock < 0) {
        throw new BaseError({
          statusCode: 400,
          error: errorCode.client,
          errors: { stock: errorCode['client.stockCannotBeNegative'] }
        });
      }
      if (sale_form === SaleForms.Retail) {
        updateStockModel.on_sales_stock += stockToUpdate;
        const maxOsBoxStock = Math.floor(
          updateStockModel.on_sales_stock / updateStockModel.stock_per_box
        );
        if (maxOsBoxStock < updateStockModel.os_box_stock) {
          updateStockModel.os_box_stock = maxOsBoxStock;
        }
      } else {
        updateStockModel.os_box_stock += model_stock.box_stock;
        updateStockModel.on_sales_stock += stockToUpdate;
        updateStockModel.box_stock += model_stock.box_stock;
      }

      updateStockModel.sold_count -= stockToUpdate;

      storingDoc.stock += stockToUpdate;
      storingDoc.on_sales_stock += stockToUpdate;
      storingDoc.sold -= stockToUpdate;
      await storingDoc.save({ session });
    }

    return { storingDoc, storingSnapshot };
  },
  async updateStockAndCreateHistory(
    {
      productStoringDoc,
      productStoringId,
      storeStoringDoc,
      storeStoringId,
      stock,
      model_stock = {},
      on_sales_stock,
      accompanied_stock = {},
      sale_form = SaleForms.Retail
    },
    { note, type = HistoryTypes.Sell, transactionId, onModel, performedUser },
    options = {}
  ) {
    const { session } = options;

    if (!performedUser) {
      throw new BaseError({
        statusCode: 500,
        message: 'UpdateStock: Perform user was not provided'
      });
    }

    const { storingDoc, storingSnapshot } = await this.updateStock(
      {
        productStoringDoc,
        productStoringId,
        storeStoringDoc,
        storeStoringId,
        stock,
        model_stock,
        accompanied_stock,
        on_sales_stock,
        sale_form
      },
      { session }
    );

    let stockHistory = null;
    if (stock) {
      const historyDataToCreate = {
        products: [
          {
            id: storingDoc.product_id,
            product_storing_id: storingDoc._id,
            delta_quantity: stock,
            product_storing_snapshot: storingSnapshot
          }
        ],
        user_id: performedUser.id,
        from_store_id: storingDoc.store_id,
        company_id: storingDoc.company_id,
        note,
        type,
        transaction_id: transactionId,
        on_model: onModel,
        relate_to: RelateTo.Store
      };

      [stockHistory] = await Promise.all([
        productStockHistoryServiceV2.create(historyDataToCreate, { session }),
        [TrackingTypes.Sell, TrackingTypes.Refund].includes(type) &&
          productStockTrackingService.create(
            {
              trackingPlace: TrackingPlaces.Store,
              prevStoringDoc: storingSnapshot,
              curStoringDoc: storingDoc,
              type
            },
            { session }
          )
      ]);
    }

    return { stockHistory, storingSnapshot, storingDoc };
  },
  async updateStockFromOrder({ order, performedUser, note }, options = {}) {
    const { session } = options;

    if (!performedUser) {
      throw new BaseError({
        statusCode: 500,
        message: 'UpdateStock: Perform user was not provided'
      });
    }

    if (order.without_product) {
      return [];
    }
    return await Promise.all(
      order.products.map((data) => // cứ mỗi 1 sp thì update lại số lượng
        this.updateStockAndCreateHistory(
          {
            productStoringId: data.product_storing_id,
            stock: -data.quantity,
            model_stock: {
              stock: -data.quantity,
              model_id: data.model_id,
              box_stock: -data.box_quantity
            },
            accompanied_stock: {
              accompanied_products: data.accompanied_products,
              action: 'add_product'
            },
            sale_form: data.type
          },
          {
            note,
            type: HistoryTypes.Sell,
            transactionId: order._id,
            onModel: 's_order',
            performedUser
          },
          { session }
        )
      )
    );
  },
  async importProducts({ products, companyId, storeId, performedUser, note }, options = {}) {
    const { session } = options;

    const productStorings = await Promise.map(products, async (productToImport) => {
      let {
        id: productId,
        on_sales_stock: ossToUpdate,
        accompanied_products = [],
        model_list = [],
        ...restData
      } = productToImport;
      // This query for checking existence of accompanied products
      const accompaniedProductQueries = accompanied_products.map((ap) => {
        const query = {
          _id: ap.product_storing_id,
          company_id: companyId,
          status: Statuses.Active
        };
        query['$or'] = [
          { is_limited_stock: true, on_sales_stock: { $gte: ap.on_sales_stock } },
          { is_limited_stock: false }
        ];
        if (ap.model_id) {
          query['model_list._id'] = ap.model_id;
        }

        return query;
      });

      // Checking existences
      let [productStoring, product, accompaniedProductStorings] = await Promise.all([
        productStoringService.findOne(
          {
            status: Statuses.Active,
            product_id: productId,
            company_id: companyId,
            store_id: storeId,
            is_directed_import: true
          },
          null,
          { session }
        ),
        productServiceV2.findOneEnsure({
          query: {
            status: 'approved',
            company_id: companyId,
            _id: productId
          },
          options: { session }
        }),
        accompaniedProductQueries.length &&
          productStoringService.findManyEnsure(accompaniedProductQueries, null, { session })
      ]);

      // Update
      if (productStoring) {
        const productStoringSnapshot = productStoring.toObject();
        // Check updating model_list (if any)
        if ((productStoring.model_list || []).length && model_list) {
          ossToUpdate = 0;
          productStoring.model_list.forEach((modelItem) => {
            const modelItemUpdates = model_list.find((m) => m.model_id === modelItem.model_id);
            if (modelItemUpdates) {
              const { on_sales_stock: oss = 0, ...updates } = modelItemUpdates;
              Object.assign(modelItem, updates);
              modelItem.on_sales_stock += !!restData.is_limited_stock * oss;
              ossToUpdate += !!restData.is_limited_stock * oss;
            }
          });
          productStoring.on_sales_stock += !!productStoring.is_limited_stock * ossToUpdate;
          productStoring.stock += !!productStoring.is_limited_stock * ossToUpdate;
        }

        // Tracking product stock
        const updatedProductStoring = await productStoring.save({ session });
        // await productStockTrackingService.create(
        //   {
        //     trackingPlace: TrackingPlaces.Store,
        //     prevStoringDoc: productStoringSnapshot,
        //     curStoringDoc: updatedProductStoring,
        //     type: TrackingTypes.Import
        //   },
        //   { session }
        // );
        return { productStoring: updatedProductStoring, productStoringSnapshot };
      }

      // Create new
      // Check options, groups, tags
      const optionQueries = (restData.options || []).map((option) => ({
        _id: option.id,
        status: 'active',
        $or: [
          { company_id: companyId, scope: 'company' },
          { company_id: companyId, store_id: storeId, scope: 'store' },
          { scope: 'global' }
        ]
      }));
      const groupQuries = (restData.groups || []).map((gid) => ({
        _id: gid,
        company_id: companyId,
        store_id: storeId,
        status: 'active'
      }));
      const tagQuries = (restData.tags || []).map((tid) => ({
        _id: tid,
        $or: [
          { scope: TagScopes.Global },
          { scope: TagScopes.Company, company_id: companyId },
          { scope: TagScopes.Store, store_id: storeId }
        ],
        status: 'active'
      }));
      const [options, groups, tags] = await Promise.all([
        optionQueries.length &&
          sellingOptionService.findManyEnsure(optionQueries, null, { session }),
        groupQuries.length && groupService.findManyEnsure(groupQuries, null, { session }),
        tagQuries.length && tagService.findManyEnsure(tagQuries, null, { session })
      ]);

      // Increase total_product of groups
      groups &&
        groups.forEach((group) => {
          group.total_product += 1;
        });

      const accompaniedProducts = accompanied_products.map((ap, index) => ({
        ...ap,
        id: accompaniedProductStorings[index].product_id
      }));

      // Check creating with model_list (if any)
      let modelList = product.model_list;
      if ((product.model_list || []).length && model_list) {
        ossToUpdate = 0;
        modelList.forEach((modelItem) => {
          const modelItemUpdates = model_list.find((m) => m.model_id === modelItem.model_id);
          if (modelItemUpdates) {
            const { on_sales_stock: oss = 0, ...updates } = modelItemUpdates;
            Object.assign(modelItem, updates);
            modelItem.on_sales_stock += !!restData.is_limited_stock * oss;
            ossToUpdate += !!restData.is_limited_stock * oss;
          }
        });
      }
      [productStoring] = await Promise.all([
        productStoringService.createFromProduct(
          {
            productDoc: product,
            newFields: {
              store_id: storeId,
              on_sales_stock: ossToUpdate,
              stock: ossToUpdate,
              transportable: false,
              accompanied_products: accompaniedProducts,
              model_list: modelList,
              is_directed_import: true,
              ...restData
            }
          },
          { session }
        ),
        ...(groups ? [...groups.map((group) => group.save({ session }))] : [])
      ]);
      // // Tracking product stock
      // await productStockTrackingService.create(
      //   {
      //     trackingPlace: TrackingPlaces.Store,
      //     curStoringDoc: productStoring,
      //     type: TrackingTypes.Import
      //   },
      //   { session }
      // );
      return { productStoring, productStoringSnapshot: null };
    });

    // Create history
    const historyProducts = productStorings.map(
      ({ productStoring: ps, productStoringSnapshot: psSnapshot }, index) => ({
        id: ps.product_id,
        product_id: ps.product_id,
        product_storing_id: ps._id,
        delta_quantity: products[index].on_sales_stock,
        product_storing_snapshot: psSnapshot
      })
    );
    const historyData = {
      company_id: companyId,
      requester: performedUser,
      type: HistoryTypes.Import,
      relate_to: 'store',
      from_store_id: storeId,
      products: historyProducts,
      note
    };
    const stockHistory = await productStockHistoryServiceV2.create(historyData, { session });

    return { stockHistory, productStorings };
  },
  async update(
    { productStoringDoc, productStoringId, companyId, storeId, performedUser, note },
    updates,
    options = {}
  ) {
    const { session } = options;

    // Check if product storing exists or not
    let productStoring = null;
    if (productStoringDoc) {
      productStoring = productStoringDoc;
    } else if (productStoringId) {
      productStoring = await productStoringService.findOneEnsure(
        {
          _id: productStoringId,
          status: Statuses.Active
        },
        null,
        { session, populate: 'groups' }
      );
    }
    const productStoringSnapshot = productStoring.toObject();

    // Check selling options, groups, tags, accompanied products
    if (!!updates.options + !!updates.groups + !!updates.tags + !!updates.accompanied_products) {
      const optionQueries = (updates.options || []).map((option) => ({
        _id: option.id,
        status: 'active',
        $or: [
          { company_id: companyId, scope: 'company' },
          { company_id: companyId, store_id: storeId, scope: 'store' },
          { scope: 'global' }
        ]
      }));
      const groupQuries = (updates.groups || []).map((gid) => ({
        _id: gid,
        company_id: companyId,
        store_id: storeId,
        status: 'active'
      }));
      const tagQuries = (updates.tags || []).map((tid) => ({
        _id: tid,
        $or: [
          { scope: TagScopes.Global },
          { scope: TagScopes.Company, company_id: companyId },
          { scope: TagScopes.Store, store_id: storeId }
        ],
        status: 'active'
      }));
      const accompaniedProductQueries = (updates.accompanied_products || []).map((ap) => {
        const query = { _id: ap.product_storing_id, status: Statuses.Active };
        query['$or'] = [
          { is_limited_stock: true, on_sales_stock: { $gte: ap.on_sales_stock } },
          { is_limited_stock: false }
        ];
        if (ap.model_id) {
          query['model_list._id'] = ap.model_id;
        }

        return query;
      });

      let [options, groups, tags, accompaniedProducts] = await Promise.all([
        optionQueries.length &&
          sellingOptionService.findManyEnsure(optionQueries, null, { session }),
        groupQuries.length && groupService.findManyEnsure(groupQuries, null, { session }),
        tagQuries.length && tagService.findManyEnsure(tagQuries, null, { session }),
        accompaniedProductQueries.length &&
          productStoringService.findManyEnsure(accompaniedProductQueries, null, { session })
      ]);

      // Update total_product
      if (groups) {
        groups.forEach((group) => {
          group.total_product += 1;
        });
        await Promise.all(groups.map((group) => group.save({ session })));
        if (productStoring.groups && productStoring.groups.length) {
          const oldGroups = productStoring.groups;
          oldGroups.forEach((group) => {
            group.total_product -= 1;
          });
          await Promise.all(oldGroups.map((group) => group.save({ session })));
        }
      }

      if (accompaniedProducts) {
        updates.accompanied_products = updates.accompanied_products.map((ap, index) => ({
          ...ap,
          id: accompaniedProducts[index].product_id
        }));
      }
    }

    // Check updating model_list (if any)
    if ((productStoring.model_list || []).length && updates.model_list) {
      updates.on_sales_stock = 0;
      productStoring.model_list.forEach((modelItem) => {
        const modelItemUpdates = updates.model_list.find((m) => m.model_id === modelItem.model_id);
        if (modelItemUpdates) {
          Object.assign(modelItem, modelItemUpdates);
        }
        // updates.on_sales_stock += (modelItem.status === Statuses.Active) * modelItem.on_sales_stock;
        updates.on_sales_stock += modelItem.on_sales_stock;
      });
      delete updates.model_list;
    } else if (
      (productStoring.model_list || []).length &&
      typeof updates.on_sales_stock === 'number'
    ) {
      throw new BaseError({
        statusCode: 400,
        error: errorCode.client,
        errors: { on_sales_stock: errorCode['any.invalid'] },
        message: 'update `on_sales_stock` for each model item instead'
      });
    }

    // Create stock history & update on_sales_stock, stock if updates.on_sales_stock exists
    if (updates.on_sales_stock) {
      updates.on_sales_stock *= !!productStoring.is_limited_stock && !!updates.is_limited_stock;
      updates.stock = productStoring.batch_stock + updates.on_sales_stock;
      const historyData = {
        company_id: companyId,
        requester: performedUser,
        type: HistoryTypes.Edit,
        relate_to: 'store',
        from_store_id: productStoring.store_id,
        products: [
          {
            id: productStoring.product_id,
            product_id: productStoring.product_id,
            product_storing_id: productStoring._id,
            delta_quantity: updates.on_sales_stock - productStoring.on_sales_stock,
            product_storing_snapshot: productStoring
          }
        ],
        note
      };
      await productStockHistoryServiceV2.create(historyData, { session });
    }

    mergeObject(productStoring, updates);

    // TRACKING PRODUCT STOCK
    await productStockTrackingService.create(
      {
        trackingPlace: TrackingPlaces.Store,
        prevStoringDoc: productStoringSnapshot,
        curStoringDoc: productStoring,
        type: TrackingTypes.Edit
      },
      { session }
    );

    return await productStoring.save({ session });
  }
};

export default productStoringHandler;
