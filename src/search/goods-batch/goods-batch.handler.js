import { Promise } from 'bluebird';
import { capitalize } from 'lodash';
import goodsBatchService from './goods-batch.service';
import productStockHistoryServiceV2 from '../product-stock-history/v2/product-stock-history.service';
import productService from '../product/product.service';
import providerService from '../provider/provider.service';
import storeService from '../store/store.service';
import mallService from '../sum-mall/mall/mall.service';
import goodsBatchModel from './goods-batch.model';
import {
  PlaceOfStock,
  Statuses,
  DeletedStatus,
  RequesterTypes,
  ExportTypes,
  AvailableStatuses
} from './goods-batch.config';
import warehouseService from '../warehouse/warehouse.service';
import { BaseError, errorCode, mergeObject, logger } from '../../commons/utils';
import companyService from '../company/company.service';
import productStoringHandlerV2 from '../product-storing/v2/product-storing.handler';
import warehouseStoringHandler from '../warehouse-storing/warehouse-storing.handler';
import mallStoringHandler from '../sum-mall/mall-storing/mall-storing.handler';
import {
  RelateTo,
  Types as HistoryTypes,
  Statuses as HistoryStatuses,
  PopulatedFields as HistoryPopulatedFields
} from '../product-stock-history/v2/product-stock-history.config';
import warehouseStoringService from '../warehouse-storing/warehouse-storing.service';
import productStoringServiceV2 from '../product-storing/v2/product-storing.service';
import mallStoringService from '../sum-mall/mall-storing/mall-storing.service';
import productStockTrackingService from '../product-stock-tracking/product-stock-tracking.service';
import { Types as TrackingTypes } from '../product-stock-tracking/product-stock-tracking.config';

// THIS FOR GET [MALL|WAREHOUSE|MALL]_STORING SERVICES & HANDLERS BY PLACE_OF_STOCK
const StoringDict = {
  mall: { service: mallStoringService, handler: mallStoringHandler },
  warehouse: { service: warehouseStoringService, handler: warehouseStoringHandler },
  store: { service: productStoringServiceV2, handler: productStoringHandlerV2 }
};

export default {
  /**
   * @description Create a goods batch at [warehouse|store|mall]
   * @param {{ batchData: GoodsBatchDataToCreate, performedUser: User }} { batchData, performedUser }
   * @param {*} options
   * @returns {Promise<{
   *  stockHistory: any,
   *  goodsBatch:any,
   *  mallStoring: any,
   *  warehouseStoring: any,
   *  productStoring: any,
   *  storeStoring: any
   * }>} { stockHistory, goodsBatch, mallStoring, warehouseStoring, productStoring, storeStoring }
   */
  async createGoodsBatch({ batchData, performedUser }, options = {}) {
    const {
      company_id,
      product_id,
      model_id,
      provider_id,
      store_id,
      warehouse_id,
      mall_id,
      place_of_stock: placeOfStock,
      note,
      ...dataToCreate
    } = batchData;
    const { session } = options;

    // VALIDATING PARAMS --

    // Check if [product, provider, store, warehouse, mall]_id exist or not
    const extraQuery = company_id ? { company_id } : {};
    let [product, company, provider, store, warehouse, mall] = await Promise.all([
      productService.findOneActive(
        {
          _id: product_id,
          is_limited_stock: true,
          ...(model_id ? { 'model_list.model_id': model_id } : {}),
          ...extraQuery
        },
        null,
        { session }
      ),
      company_id && companyService.findOneActive({ _id: company_id }, null, { session }),
      providerService.findOneActive({ _id: provider_id }, null, { session }),
      placeOfStock === PlaceOfStock.Store &&
        storeService.findOneActive({ _id: store_id, ...extraQuery }, null, { session }),
      placeOfStock === PlaceOfStock.Warehouse &&
        warehouseService.findOneActive({ _id: warehouse_id, ...extraQuery }, null, { session }),
      placeOfStock === PlaceOfStock.Mall &&
        mallService.findOne({ _id: mall_id, status: 'active' }, null, { session }) // Update into findOneActive later
    ]);
    if (!company_id && product) {
      company = await companyService.findOneActive({ _id: product.company_id }, null, { session });
    }

    let errors = null;
    if (!product) {
      errors = { product_id: errorCode['client.productNotExist'] };
    } else if (!company) {
      errors = { company_id: errorCode['client.companyNotExist'] };
    } else if (!provider) {
      errors = { provider_id: errorCode['client.providerNotFound'] };
    } else if (placeOfStock === PlaceOfStock.Store && !store) {
      errors = { store_id: errorCode['client.storeNotExist'] };
    } else if (placeOfStock === PlaceOfStock.Warehouse && !warehouse) {
      errors = { warehouse_id: errorCode['client.warehouseNotFound'] };
    } else if (placeOfStock === PlaceOfStock.Mall && !mall) {
      errors = { mall_id: errorCode['client.mallNotExist'] };
    }
    // check provider if exist product's providers
    if (product && product.toObject().providers && product.toObject().providers.length) {
      if (
        !product
          .toObject()
          .providers.some(
            (provider) =>
              provider.provider_id.toString() === provider_id && provider.status === 'active'
          )
      )
        errors = {
          provider: errorCode['client.providerNotFound']
        };
    }
    if (errors) {
      throw new BaseError({
        statusCode: 404,
        error: errorCode.client,
        errors
      });
    }
    // --

    // UPDATE/CREATE [MALL|WAREHOUSE|STORE]_STORING --
    const argsByPlace = {
      mall: { id: mall_id, doc: mall },
      warehouse: { id: warehouse_id, doc: warehouse },
      store: { id: store_id, doc: store }
    };
    const { id: entityId, doc: entityDoc } = argsByPlace[placeOfStock];
    const { handler: storingHandler } = StoringDict[placeOfStock];
    const stockFromGoodsBatch = dataToCreate.stock;
    const [stockToUpate, bsToUpdate, ossToUpdate] = dataToCreate.on_sales
      ? [0, 0, stockFromGoodsBatch]
      : [stockFromGoodsBatch, stockFromGoodsBatch, 0];

    const storingData = {
      ...product.toObject(),
      product_id,
      model_id,
      company_id: company._id,
      // stock: dataToCreate.stock,
      batch_stock: bsToUpdate,
      on_sales_stock: ossToUpdate,
      stock: bsToUpdate + ossToUpdate,
      is_active_product: product.status === 'approved',
      is_active_company: company.status === 'approved',
      [`${placeOfStock}_id`]: entityId,
      [`is_active_${placeOfStock}`]: entityDoc.status === 'active'
    };
    const rawResult = await storingHandler.createOrUpdateStock(storingData, { session });
    const storing = rawResult[`${placeOfStock}Storing`];
    const storingSnapshot = rawResult[`${placeOfStock}StoringSnapshot`];
    // --

    // CREATE OR MERGE GOODS BATCH AT [MALL|WAREHOUSE|STORE] --
    dataToCreate.product_id = product_id;
    dataToCreate.model_id = model_id;
    dataToCreate.provider_id = provider_id;
    dataToCreate.provider_name = provider.name;
    dataToCreate.company_id = company_id;
    dataToCreate.place_of_stock = placeOfStock;
    dataToCreate.stock = stockToUpate;
    dataToCreate.stock_keeping_unit = dataToCreate.stock_keeping_unit || product.SKU;
    dataToCreate[`${placeOfStock}_id`] = entityId;
    dataToCreate[`${placeOfStock}_storing_id`] = storing._id;

    let newGoodsBatch = new goodsBatchModel(dataToCreate);
    let canMergedBatch = await newGoodsBatch.findCanMergedBatch({
      ...(model_id ? { model_id } : {})
    });
    if (canMergedBatch) {
      newGoodsBatch = canMergedBatch.mergeBatch(newGoodsBatch);
      await newGoodsBatch.save({ session });
    } else {
      newGoodsBatch = await goodsBatchService.create(dataToCreate, { session });
    }
    // --

    // CREATE STOCK HISTORY & TRACKING --
    const historyData = {
      company_id,
      requester: { ...performedUser, perform_as: placeOfStock, perform_as_id: entityId },
      type: HistoryTypes.Import,
      relate_to: placeOfStock,
      [`from_${placeOfStock}_id`]: entityId,
      batches: [
        {
          id: newGoodsBatch._id,
          batch_code: newGoodsBatch.batch_code,
          product_id: dataToCreate.product_id,
          model_id,
          [`from_${placeOfStock}_storing_id`]: storing._id,
          [`from_${placeOfStock}_storing_snapshot`]: storingSnapshot,
          from_delta_quantity: dataToCreate.stock
        }
      ],
      note
    };
    const [stockHistory] = await Promise.all([
      productStockHistoryServiceV2.createAndPopulate(historyData, HistoryPopulatedFields, {
        session
      }),
      productStockTrackingService.create(
        {
          trackingPlace: placeOfStock,
          prevStoringDoc: storingSnapshot,
          curStoringDoc: storing,
          type: TrackingTypes.Import,
          batch_id: newGoodsBatch._id
        },
        { session }
      )
    ]);
    // --

    const finalResult = {
      stockHistory,
      goodsBatch: newGoodsBatch,
      [`${placeOfStock}Storing`]: storing
    };
    finalResult.productStoring = finalResult.storeStoring;
    return finalResult;
  },
  /**
   * @description Split a goods batch into 2 batches
   * @param {{
   *    batchId: string,
   *    batchDoc: object,
   *    stock: number,
   *    updates: object
   * }} { batchId, batchDoc, stock, updates }
   * @param {string} options
   * @returns {Promise<{ updatedBatch: any, newBatch: any }>} { updatedBatch, newBatch }
   */
  async splitGoodsBatch({ batchId, batchDoc, stock: stockToSplit, updates = {} }, options = {}) {
    const { session } = options;
    let originalBatch = null;
    if (batchDoc) {
      originalBatch = batchDoc;
    } else if (batchId) {
      originalBatch = await goodsBatchService.findOneActive({ _id: batchId }, null, { session });
    }

    if (!originalBatch) {
      throw new BaseError({
        statusCode: 404,
        error: errorCode.client,
        errors: { batch_id: errorCode['client.goodsBatchNotFound'] }
      });
    }
    if (
      !Number.isInteger(stockToSplit) ||
      stockToSplit <= 0 ||
      stockToSplit > originalBatch.stock
    ) {
      throw new BaseError({
        statusCode: 400,
        error: errorCode.client,
        errors: { stock: errorCode['client.goodsBatchStockCanNotBeNegative'] }
      });
    }

    // Update org batch and create new batch
    originalBatch.stock -= stockToSplit;
    const {
      _id,
      id,
      createdAt,
      updatedAt,
      __v,
      stock: orgStock,
      ...orgBatchData
    } = originalBatch.toObject();
    let newBatch = new goodsBatchModel({ ...orgBatchData, stock: stockToSplit, ...updates });
    [originalBatch, newBatch] = await Promise.all([
      originalBatch.save({ session }),
      newBatch.save({ session })
    ]);

    return { updatedBatch: originalBatch, newBatch };
  },
  /**
   * @description Update stock of a goods batch
   * @param {{
   *    batchDoc: object,
   *    batchId: string,
   *    stock: number,
   *    batchStock: number,
   *    onSalesStock: number,
   * }} { batchId, batchDoc, stock, batchStock, onSalesStock }
   * @param {string} options
   * @returns {Promise<{
   *    goodsBatch: any,
   *    updatedGoodsBatch: any,
   *    storing: any,
   *    updatedStoring: any
   * }>} { goodsBatch, updatedGoodsBatch, storing, updatedStoring }
   */
  async updateStockOfGoodsBatch(
    { batchDoc, batchId, stock, batchStock, onSalesStock },
    options = {}
  ) {
    const { session } = options;

    // GET GOODS BATCH --
    let goodsBatch = null;
    if (batchDoc) {
      goodsBatch = batchDoc;
    } else if (batchId) {
      goodsBatch = await goodsBatchService.findOneActive({ _id: batchId }, null, { session });
    }
    if (!goodsBatch) {
      throw new BaseError({
        statusCode: 404,
        error: errorCode.client,
        errors: { goods_batch_id: errorCode['client.goodsBatchNotFound'] }
      });
    }
    // --

    // UPDATE GOODS BATCH --
    const stockToUpdate = stock;
    const stockFromGoodsBatch = goodsBatch.stock;
    const onSalesStockFromGoodsBatch = goodsBatch.on_sales_stock;

    if (
      stockToUpdate + stockFromGoodsBatch < 0 ||
      batchStock + stockFromGoodsBatch < 0 ||
      onSalesStock + onSalesStockFromGoodsBatch < 0
    ) {
      throw new BaseError({
        statusCode: 400,
        error: errorCode.client,
        errors: { stock: errorCode['client.stockCannotBeNegative'] }
      });
    }

    const unChangedGoodsBatch = goodsBatch.toObject();
    // if (goodsBatch.on_sales) {
    //   goodsBatch.on_sales_stock += stockToUpdate;
    // } else {
    //   goodsBatch.stock += stockToUpdate;
    // }
    goodsBatch.on_sales_stock += onSalesStock;
    goodsBatch.stock += batchStock;
    const updatedGoodsBatch = await goodsBatch.save({ session });
    // --

    // UPDATE [MALL|WAREHOUSE|STORE]_STORING
    const placeOfStock = unChangedGoodsBatch.place_of_stock;
    const storingEntity = unChangedGoodsBatch.storing_entity;
    const storingId = unChangedGoodsBatch[`${placeOfStock}_storing_id`];
    const { service: storingService } = StoringDict[placeOfStock];
    // const { handler: storingHandler, service: storingService } = StoringDict[placeOfStock];
    // const dataToUpdate = {
    //   [`${placeOfStock}_storing_id`]: storingId,
    //   product_id: unChangedGoodsBatch.product_id,
    //   company_id: unChangedGoodsBatch.company_id,
    //   [`${placeOfStock}_id`]: unChangedGoodsBatch[`${placeOfStock}_id`],
    //   batch_stock: batchStock,
    //   on_sales_stock: onSalesStock,
    //   stock: stockToUpdate
    // };

    const query = { _id: storingId, status: { $ne: 'disabled' } };
    if (goodsBatch.model_id) query['model_list.model_id'] = goodsBatch.model_id;
    const storing = await storingService.findOne(query, null, { session });

    if (!storing) {
      throw new BaseError({
        statusCode: 404,
        error: errorCode.client,
        errors: { [`${placeOfStock}_storing_id`]: errorCode['client.global.notFound'] },
        message: `${placeOfStock}_storing_id not found or deleted`
      });
    }
    const unChangedStoring = storing.toObject();
    const goodsBatches = await goodsBatchService.find(
      {
        place_of_stock: placeOfStock,
        [`${storingEntity}_storing_id`]: storingId,
        status: Statuses.Active
      },
      null,
      { session }
    );
    let [osStock, bStock] = [0, 0];
    goodsBatches.forEach((batch) => {
      osStock += batch.on_sales_stock;
      bStock += batch.stock;
    });
    storing.batch_stock = bStock;
    storing.on_sales_stock = osStock;
    storing.stock = storing.batch_stock + storing.on_sales_stock;

    //update stock model
    [osStock, bStock] = [0, 0];
    const goodsBatchByModelId = await goodsBatchService.find(
      {
        place_of_stock: placeOfStock,
        [`${storingEntity}_storing_id`]: storingId,
        status: Statuses.Active,
        model_id: goodsBatch.model_id
      },
      null,
      { session }
    );

    goodsBatchByModelId.forEach((batch) => {
      osStock += batch.on_sales_stock;
      bStock += batch.stock;
    });
    if (unChangedGoodsBatch.model_id) {
      const modelIndex = storing.model_list.findIndex(
        (model) => model.id.toString() === unChangedGoodsBatch.model_id.toString()
      );
      if (modelIndex || modelIndex === 0) {
        storing.model_list[modelIndex].stock = bStock;
        storing.model_list[modelIndex].on_sales_stock = osStock;
      }
    } else if (storing.model_list[0].name === 'Default') {
      storing.model_list[0].stock = bStock;
      storing.model_list[0].on_sales_stock = osStock;
    }
    // --

    const updatedStoring = await storing.save({ session });
    // const rawResult = await storingHandler.createOrUpdateStock(dataToUpdate, {
    //   session,
    //   create: false
    // });
    // const updatedStoring = rawResult[`${placeOfStock}Storing`];
    // if (!updatedStoring) {
    //   logger.error('Storing not found: %o', updatedStoring);
    //   throw new BaseError({
    //     statusCode: 500,
    //     error: errorCode.client,
    //     errors: { [`${placeOfStock}_storing_id`]: errorCode['client.global.notFound'] },
    //     message: 'not found'
    //   });
    // }
    // --

    return {
      goodsBatch: unChangedGoodsBatch,
      updatedGoodsBatch,
      storing: unChangedStoring,
      updatedStoring
    };
  },
  /**
   * @description Update `on_sales` status [true|false]
   * @param {{
   *    batchDoc: object,
   *    batchId: string,
   *    stock: number,
   *    onSales: boolean,
   *    note: string,
   *    performedUser: any
   * }} { batchId, batchDoc, stock, onSales, note, performedUser }
   * @param {*} options
   * @returns {Promise<{
   *    goodsBatch: any,
   *    updatedGoodsBatch: any,
   *    storing: any,
   *    updatedStoring: any
   * }>} { goodsBatch, updatedGoodsBatch, storing, updatedStoring }
   */
  async updateOnSalesStatus(
    { batchId, batchDoc, onSales, stock, note, performedUser },
    options = {}
  ) {
    const { session } = options;
    const stockPermission = performedUser;

    // GET GOODS BATCH --
    let goodsBatch = null;
    if (batchDoc) {
      goodsBatch = batchDoc;
    } else if (batchId) {
      goodsBatch = await goodsBatchService.findOneActive(
        {
          _id: batchId,
          place_of_stock: { $ne: PlaceOfStock.Transporting },
          $or: [
            { store_id: { $in: stockPermission.store_ids } },
            { warehouse_id: { $in: stockPermission.warehouse_ids } },
            { mall_id: { $in: stockPermission.mall_ids } }
          ]
        },
        null,
        { session, populate: 'product store warehouse mall' }
      );
    }
    if (!goodsBatch) {
      throw new BaseError({
        statusCode: 404,
        error: errorCode.client,
        errors: { goods_batch_id: errorCode['client.goodsBatchNotFound'] }
      });
    }
    // --
    // UPDATE STOCK OF GOODS BATCH & STORING --
    const unChangedGoodsBatch = goodsBatch.toObject();
    const placeOfStock = unChangedGoodsBatch.place_of_stock;
    const storingEntity = unChangedGoodsBatch.storing_entity;
    const entityId = unChangedGoodsBatch[`${placeOfStock}_id`];
    const storingId = unChangedGoodsBatch[`${placeOfStock}_storing_id`];
    const { service: storingService } = StoringDict[placeOfStock];
    const storing = await storingService.findOneEnsure({ _id: storingId, status: 'active' }, null, {
      session
    });
    const unChangedStoring = storing.toObject();
    const isNextOnSales = !!onSales;
    const stockFromGoodsBatch = goodsBatch.stock;
    const gOnSalesStock = goodsBatch.on_sales_stock;

    // Check if requested stock is valid or not
    if (!isNextOnSales && stock > Math.min(gOnSalesStock, storing.on_sales_stock)) {
      throw new BaseError({
        statusCode: 400,
        error: errorCode.client,
        errors: { stock: errorCode['client.goodsBatchStockIsInvalid'] },
        message: 'Can not refund stock greater than on_sales stock'
      });
    }
    // [stockToUpate, batchStockToUpdate, onSalesStockToUpdate]
    const [stockToUpdate, bsToUpdate, ossToUpdate] = isNextOnSales
      ? [-stockFromGoodsBatch, -stockFromGoodsBatch, stockFromGoodsBatch]
      : [stock, stock, -stock];

    // Update stock of goods batch
    goodsBatch.stock += stockToUpdate;
    goodsBatch.on_sales = isNextOnSales;
    goodsBatch.on_sales_stock += Math.abs(stockToUpdate) * isNextOnSales;
    await goodsBatch.save({ session });

    // Update stock, batch_stock, on_sales_stock of storing
    // storing.batch_stock += bsToUpdate;
    // storing.on_sales_stock += ossToUpdate;
    // storing.stock = storing.batch_stock + storing.on_sales_stock;
    const goodsBatches = await goodsBatchService.find(
      {
        place_of_stock: placeOfStock,
        [`${storingEntity}_storing_id`]: storingId,
        status: Statuses.Active
      },
      null,
      { session }
    );
    let [onSalesStock, batchStock] = [0, 0];
    goodsBatches.forEach((batch) => {
      onSalesStock += batch.on_sales_stock;
      batchStock += batch.stock;
    });
    storing.batch_stock = batchStock;
    storing.on_sales_stock = onSalesStock;
    storing.stock = storing.batch_stock + storing.on_sales_stock;
    await storing.save({ session });

    // --
    // CREATE STOCK HISTORY & TRACKING --
    const historyData = {
      company_id: unChangedGoodsBatch.company_id,
      requester: { ...performedUser, perform_as: placeOfStock, perform_as_id: entityId },
      ...(isNextOnSales
        ? { type: HistoryTypes.LocalExport, export_type: ExportTypes.Local }
        : { type: HistoryTypes.LocalImport }),
      relate_to: placeOfStock,
      [`from_${placeOfStock}_id`]: entityId,
      batches: [
        {
          id: goodsBatch._id,
          batch_code: goodsBatch.batch_code,
          product_id: goodsBatch.product_id,
          model_id: goodsBatch.model_id,
          [`from_${placeOfStock}_storing_id`]: storing._id,
          [`from_${placeOfStock}_storing_snapshot`]: unChangedStoring,
          from_delta_quantity: stockToUpdate
        }
      ],
      note
    };
    const [stockHistory] = await Promise.all([
      productStockHistoryServiceV2.createAndPopulate(historyData, HistoryPopulatedFields, {
        session
      }),
      productStockTrackingService.create(
        {
          trackingPlace: placeOfStock,
          prevStoringDoc: unChangedStoring,
          curStoringDoc: storing,
          type: isNextOnSales ? TrackingTypes.LocalExport : TrackingTypes.LocalImport,
          batch_id: goodsBatch._id
        },
        { session }
      )
    ]);
    // --
    return {
      goodsBatch: unChangedGoodsBatch,
      updatedGoodsBatch: goodsBatch,
      storing: unChangedStoring,
      updatedStoring: storing,
      stockHistory
    };
  },
  /**
   * @description Move a goods batch out of its init place
   * @param {{
   *    batchId: string,
   *    batchDoc: any,
   *    stock: number,
   *    note: string
   * }} { batchId, batchDoc, stock, note }
   * @param {*} options
   * @returns {Promise<{
   *    storingSnapshot: any,
   *    updatedStoring: any,
   *    goodsBatch: any,
   *    updatedGoodsBatch: any,
   *    newGoodsBatch: any
   * }>} { storingSnapshot, updatedStoring, goodsBatch, updatedGoodsBatch, newGoodsBatch }
   */
  async moveGoodsBatchOut({ batchId, batchDoc, stock, note }, options = {}) {
    const { session } = options;

    // GET GOODS BATCH --
    let goodsBatch = null;
    if (batchDoc) {
      goodsBatch = batchDoc;
    } else if (batchId) {
      goodsBatch = await goodsBatchService.findOneActive(
        { _id: batchId, transportable: true, place_of_stock: { $ne: PlaceOfStock.Transporting } },
        null,
        { session, populate: 'product store warehouse mall' }
      );
    }
    if (!goodsBatch) {
      throw new BaseError({
        statusCode: 404,
        error: errorCode.client,
        errors: { goods_batch_id: errorCode['client.goodsBatchNotFound'] }
      });
    }
    // --

    // UPDATE BATCH --
    const placeOfStock = goodsBatch.place_of_stock;
    const stockToMove = stock || goodsBatch.stock;
    const { service: storingService } = StoringDict[placeOfStock];
    const moveOutFrom = {
      mall: { id: goodsBatch.mall_id, storingId: goodsBatch.mall_storing_id },
      warehouse: { id: goodsBatch.warehouse_id, storingId: goodsBatch.warehouse_storing_id },
      store: { id: goodsBatch.store_id, storingId: goodsBatch.product_storing_id }
    };

    // Cache goodsBatch
    const unChangedBatch = goodsBatch.toObject();

    // Update/split goodsBatch
    let newBatch = null;
    const { updatedBatch, newBatch: newOne } = await this.splitGoodsBatch(
      {
        batchDoc: goodsBatch,
        stock: stockToMove,
        updates: { place_of_stock: PlaceOfStock.Transporting, export_date: new Date(), note }
      },
      { session }
    );
    goodsBatch = updatedBatch;
    newBatch = newOne;
    // --

    // UPDATE STOCK OF STORING --
    const { id: entityId, storingId } = moveOutFrom[placeOfStock];
    const storing = await storingService.findOne(
      { _id: storingId, status: { $ne: 'disabled' } },
      null,
      { session, populate: 'name' }
    );
    if (!storing) {
      throw new BaseError({
        statusCode: 404,
        error: errorCode.client,
        errors: { [`${placeOfStock}_storing_id`]: errorCode['client.global.notFound'] }
      });
    }
    const unChangedStoring = storing.toObject();
    if (storing.is_limited_stock) {
      storing.stock -= stockToMove;
      storing.batch_stock -= stockToMove;
      if (goodsBatch.model_id) {
        const index = storing.model_list.findIndex(
          (model) => model.model_id === goodsBatch.model_id.toString()
        );
        if (index !== -1) {
          storing.model_list[index].batch_stock -= stockToMove;
        }
      } else if (storing.model_list[0].name === 'Default') {
        storing.model_list[0].batch_stock -= stockToMove;
      }
    }
    const updatedStoring = await storing.save({ session });
    // --

    return {
      storingSnapshot: unChangedStoring,
      updatedStoring,
      goodsBatch: unChangedBatch,
      updatedGoodsBatch: goodsBatch,
      newGoodsBatch: newBatch
    };
  },
  /**
   * @description Move a goods batch to new place
   * @param {{
   *    batchId: string,
   *    batchDoc: any,
   *    stock: number,
   *    oldPlaceOfStock: 'mall'|'warehouse'|'store',
   *    newPlaceOfStock: 'mall'|'warehouse'|'store',
   *    note: string,
   *    position: string,
   *    onSales: boolean,
   *    '[mall|store|warehouse]Id': string
   *    '[mall|store|warehouse]Doc': any
   *    '[mall|store|warehouse]StoringId': string
   *    '[mall|store|warehouse]StoringDoc': any
   * }} { batchId, batchDoc, note, [mall|store|warehouse]Id, [mall|store|warehouse]Doc, [mall|store|warehouse]StoringId, [mall|store|warehouse]Doc }
   * @param {*} options
   * @returns {Promise<{
   *   storingSnapshot: any,
   *   storing: any,
   *   oldBatch: any,
   *   newBatch: any
   * }>} { storingSnapshot, storing, oldBatch, newBatch }
   */
  async moveGoodsBatchIn(
    {
      oldPlaceOfStock,
      newPlaceOfStock,
      productStoringId,
      productStoringDoc,
      storeStoringId,
      storeStoringDoc,
      storeId,
      warehouseStoringId,
      warehouseStoringDoc,
      warehouseId,
      mallStoringId,
      mallStoringDoc,
      mallId,
      batchId,
      batchDoc,
      stock,
      note,
      position,
      onSales
    },
    options = {}
  ) {
    const { session } = options;
    const { service: storingService, handler: storingHandler } = StoringDict[newPlaceOfStock];
    const storingArgsByPlace = {
      mall: { id: mallStoringId, doc: mallStoringDoc, entityId: mallId },
      warehouse: { id: warehouseStoringId, doc: warehouseStoringDoc, entityId: warehouseId },
      store: {
        id: productStoringId || storeStoringId,
        doc: productStoringDoc || storeStoringDoc,
        entityId: storeId
      }
    };

    // GET GOODS BATCH --
    let goodsBatch = null;
    if (batchDoc && batchDoc['product'] && batchDoc[newPlaceOfStock]) {
      goodsBatch = batchDoc;
    } else if (batchId) {
      goodsBatch = await goodsBatchService.findOneActive(
        { _id: batchId, transportable: true, place_of_stock: PlaceOfStock.Transporting },
        null,
        { session, populate: 'product store warehouse mall' }
      );
    }
    if (!goodsBatch) {
      throw new BaseError({
        statusCode: 404,
        error: errorCode.client,
        errors: { goods_batch_id: errorCode['client.goodsBatchNotFound'] }
      });
    }
    // Cache goodsBatch
    const unChangedBatch = goodsBatch.toObject();
    // --

    // GET OR CREATE STORING IF NOT EXIST --
    let storing = null;
    let { id: storingId, doc: storingDoc, entityId } = storingArgsByPlace[newPlaceOfStock];
    if (storingDoc) {
      storing = storingDoc;
      entityId = storingDoc[`${newPlaceOfStock}_id`];
      storingId = storingDoc._id || storingDoc.id;
    } else if (storingId) {
      storing = await storingService.findOne(
        { _id: storingId, status: { $ne: 'disabled' } },
        null,
        {
          session
        }
      );
      entityId = storing[`${newPlaceOfStock}_id`];
      storingId = storing._id || storing.id;
    } else if (entityId) {
      storing = await storingService.findOne(
        {
          product_id: goodsBatch.product_id,
          status: { $ne: 'disabled' },
          [`${newPlaceOfStock}_id`]: entityId
        },
        null,
        {
          session
        }
      );
      storingId = storing._id || storing.id;
    } else {
      throw new BaseError({
        statusCode: 400,
        error: errorCode.client,
        errors: { [`${newPlaceOfStock}_id`]: errorCode['any.empty'] }
      });
    }
    if (!storing) {
      const dataToCreate = {
        ...goodsBatch.product,
        product_id: goodsBatch.product_id,
        stock: 0,
        batch_stock: 0,
        on_sales_stock: 0,
        is_active_product: goodsBatch.product.status === 'approved',
        is_active_company: goodsBatch.company.status === 'approved',
        [`${newPlaceOfStock}_id`]: entityId,
        [`is_active_${newPlaceOfStock}`]: goodsBatch[newPlaceOfStock].status === 'active'
      };

      const rawResult = await storingHandler.createOrUpdateStock(dataToCreate, { session });
      storing = rawResult[`${newPlaceOfStock}Storing`];
      entityId = storing[`${newPlaceOfStock}_id`];
      storingId = storing._id || storing.id;
    }
    // --

    // UPDATE GOODS BATCH --
    const stockToMove = stock || goodsBatch.stock;
    const [stockToUpdate, bsToUpdate, ossToUpdate] = onSales
      ? [0, 0, stockToMove]
      : [stockToMove, stockToMove, 0];

    // Update goodsBatch from old place
    goodsBatch.place_of_stock = oldPlaceOfStock || unChangedBatch.place_of_stock;
    goodsBatch.status = Statuses.Exported;
    goodsBatch.export_date = new Date();

    // Import goodsBatch to new place
    const dataToCreate = {
      batch_code: goodsBatch.batch_code,
      product_id: goodsBatch.product_id,
      model_id: goodsBatch.model_id,
      import_date: new Date(),
      manufacturing_date: goodsBatch.manufacturing_date,
      expiry_date: goodsBatch.expiry_date,
      stock_keeping_unit: goodsBatch.stock_keeping_unit,
      origin: goodsBatch.origin,
      stock: stockToUpdate,
      position,
      on_sales: onSales,
      note,
      place_of_stock: newPlaceOfStock,
      company_id: goodsBatch.company_id,
      [`${newPlaceOfStock}_id`]: entityId,
      [`${newPlaceOfStock}_storing_id`]: storingId,
      provider_id: goodsBatch.provider_id,
      provider_name: goodsBatch.provider_name
    };
    let goodsBatchFromNewPlace = new goodsBatchModel(dataToCreate);
    const model_id = goodsBatch.model_id;
    const canMergedBatch = await goodsBatchFromNewPlace.findCanMergedBatch({
      ...(model_id ? { model_id } : {})
    });
    if (canMergedBatch) {
      goodsBatchFromNewPlace = canMergedBatch.mergeBatch(goodsBatchFromNewPlace);
      [goodsBatchFromNewPlace, goodsBatch] = await Promise.all([
        goodsBatchService.saveAndPopulate(goodsBatchFromNewPlace, 'product store mall warehouse', {
          session
        }),
        goodsBatch.save({ session })
      ]);
    } else {
      [goodsBatchFromNewPlace, goodsBatch] = await Promise.all([
        goodsBatchService.createAndPopulate(dataToCreate, 'product store mall warehouse', {
          session
        }),
        goodsBatch.save({ session })
      ]);
    }
    // --

    // UPDATE STOCK OF STORING --
    // Cache storing
    const unChangedStoring = storing.toObject();

    const dataToUpdate = {
      ...goodsBatch.product.toObject(),
      [`${newPlaceOfStock}_storing_id`]: storingId,
      product_id: unChangedStoring.product_id,
      model_id: goodsBatch.model_id,
      company_id: unChangedStoring.company_id,
      [`${newPlaceOfStock}_id`]: unChangedStoring[`${newPlaceOfStock}_id`],
      batch_stock: bsToUpdate,
      on_sales_stock: ossToUpdate,
      stock: bsToUpdate + ossToUpdate
    };

    const rawResult = await storingHandler.createOrUpdateStock(dataToUpdate, {
      session
    });
    const updatedStoring = rawResult[`${newPlaceOfStock}Storing`];
    if (!updatedStoring) {
      logger.error('Storing not found: %o', updatedStoring);
      throw new BaseError({
        statusCode: 500,
        error: errorCode.client,
        errors: { [`${newPlaceOfStock}_storing_id`]: errorCode['client.global.notFound'] },
        message: 'not found'
      });
    }
    // --

    return {
      storingSnapshot: rawResult.productStoringSnapshot,
      storing: updatedStoring,
      oldBatch: goodsBatch,
      newBatch: goodsBatchFromNewPlace
    };
  },
  /**
   * @description Export goods batches from [warehouse|store|mall]
   * @param {{
   *    batches: Batch[],
   *    exportType: ExportType,
   *    placeOfStock: PlaceOfStock,
   *    warehouseId: string,
   *    storeId: string,
   *    mallId: string,
   *    performedUser: User,
   *    note: string
   * }} { batches, exportType, placeOfStock, warehouseId, storeId, mallId, performedUser }
   * @param {*} options
   * @returns {Promise<{ results: [], stockHistory: any }>} { results, stockHistory }
   */
  async exportGoodsBatches(
    { batches, exportType, placeOfStock, warehouseId, storeId, mallId, note, performedUser },
    options = {}
  ) {
    const { session } = options;

    const argsByPlace = {
      mall: { id: mallId },
      warehouse: { id: warehouseId },
      store: { id: storeId }
    };
    const { id: entityId } = argsByPlace[placeOfStock];

    const { service: storingService, handler: storingHandler } = StoringDict[placeOfStock];

    // UPDATE STOCK OF BATCHES --
    const results = await Promise.mapSeries(batches, async (batch) => {
      // Check if goodsBatch exists or not
      const batchQuery = {
        _id: batch.id,
        place_of_stock: placeOfStock,
        [`${placeOfStock}_id`]: entityId
      };
      let goodsBatch = await goodsBatchService.findOneActive(batchQuery, null, { session });
      if (!goodsBatch) {
        throw new BaseError({
          statusCode: 404,
          error: errorCode.client,
          errors: { goods_batch_id: errorCode['client.goodsBatchNotFound'] }
        });
      }

      // Update stock of goods batch
      let exportedGoodsBatch = null;
      const stockFromGoodsBatch = goodsBatch.stock;
      const stockToExport = batch.stock
        ? Math.min(batch.stock, stockFromGoodsBatch)
        : stockFromGoodsBatch;
      const { updatedBatch, newBatch } = await this.splitGoodsBatch(
        {
          batchDoc: goodsBatch,
          stock: stockToExport,
          updates: { status: Statuses.Exported, export_date: new Date() }
        },
        { session }
      );
      goodsBatch = updatedBatch;
      exportedGoodsBatch = newBatch;

      // Update stock of storing
      const [bsToUpdate, ossToUpdate] = goodsBatch.on_sales
        ? [0, -stockToExport]
        : [-stockToExport, 0];
      const rawResult = await storingHandler.createOrUpdateStock(
        {
          company_id: goodsBatch.company_id,
          product_id: goodsBatch.product_id,
          model_id: goodsBatch.model_id,
          [`${placeOfStock}_id`]: entityId,
          batch_stock: bsToUpdate,
          on_sales_stock: ossToUpdate,
          stock: bsToUpdate + ossToUpdate
        },
        { session, create: false }
      );
      const updatedStoring = rawResult[`${placeOfStock}Storing`];
      const storingSnapshot = rawResult[`${placeOfStock}StoringSnapshot`];
      if (!updatedStoring) {
        throw new BaseError({
          statusCode: 404,
          error: errorCode.client,
          errors: { [`${placeOfStock}_storing_id`]: errorCode['client.global.notFound'] },
          message: 'product is not found or removed'
        });
      }

      // For tracking batch history
      const historyBatch = {
        from_delta_quantity: -stockToExport,
        batch_code: exportedGoodsBatch.batch_code,
        id: exportedGoodsBatch._id,
        model_id: exportedGoodsBatch.model_id,
        product_id: exportedGoodsBatch.product_id,
        [`from_${placeOfStock}_storing_id`]: updatedStoring._id,
        [`from_${placeOfStock}_storing_snapshot`]: storingSnapshot,
        original_batch_id: goodsBatch._id
      };

      // Tracking product stock
      await productStockTrackingService.create(
        {
          trackingPlace: placeOfStock,
          prevStoringDoc: storingSnapshot,
          curStoringDoc: updatedStoring,
          type: TrackingTypes.Export,
          batch_id: exportedGoodsBatch._id
        },
        { session }
      );

      return {
        updatedGoodsBatch: goodsBatch,
        exportedGoodsBatch,
        storingSnapshot,
        updatedStoring,
        historyBatch
      };
    });
    // --

    // CREATE STOCK HISTORY --
    const historyData = {
      requester: { ...performedUser, perform_as: placeOfStock, perform_as_id: entityId },
      relate_to: placeOfStock,
      type: HistoryTypes.Export,
      export_type: exportType,
      [`from_${placeOfStock}_id`]: entityId,
      batches: results.map(({ historyBatch }) => historyBatch),
      company_id: performedUser.company_id,
      [`${placeOfStock}_id`]: entityId,
      note
    };
    const stockHistory = await productStockHistoryServiceV2.createAndPopulate(
      historyData,
      HistoryPopulatedFields,
      { session }
    );
    // --
    return { results, stockHistory };
  },
  /**
   * @description Export goods batches from [store|mall] for sale
   * @param {{
   *    type: 'local_import' | 'local_export'
   *    batches: Batch[],
   *    placeOfStock: PlaceOfStock,
   *    storeId: string,
   *    mallId: string,
   *    performedUser: User,
   *    note: string
   * }} { type, batches, placeOfStock, storeId, mallId, performedUser }
   * @param {*} options
   * @returns {Promise<{ results: [], stockHistory: any }>} { results, stockHistory }
   */
  async handleGoodsBatchesForSale(
    { type, batches, placeOfStock, storeId, mallId, note, performedUser },
    options = {}
  ) {
    const { session } = options;

    const argsByPlace = {
      mall: { id: mallId, storingEntity: 'mall' },
      store: { id: storeId, storingEntity: 'product' }
    };
    const { id: entityId, storingEntity } = argsByPlace[placeOfStock];

    const { service: storingService, handler: storingHandler } = StoringDict[placeOfStock];

    // UPDATE STOCK OF BATCHES --
    const results = await Promise.mapSeries(batches, async (batch) => {
      let goodsBatch = null;
      let unChangedGoodsBatch = null;
      let storing = null;
      let storingSnapshot = null;
      let historyBatch = null;
      let stockToUpdate = batch.stock;
      let [bsToUpdate, ossToUpdate] = [0, 0];
      const storingIdByPlace = {
        mall: batch.mall_storing_id,
        store: batch.product_storing_id
      };
      const storingId = storingIdByPlace[placeOfStock];

      // CASE `batch.id` exists: Check if goodsBatch exists or not
      if (batch.id) {
        const batchQuery = {
          _id: batch.id,
          status: { $in: Object.values(AvailableStatuses) },
          place_of_stock: placeOfStock,
          [`${placeOfStock}_id`]: entityId
        };
        goodsBatch = await goodsBatchService.findOneEnsure(batchQuery, null, {
          session,
          populate: 'product_storing mall_storing'
        });
        storing = goodsBatch.product_storing || mall_storing;
        unChangedGoodsBatch = goodsBatch.toObject();
        storingSnapshot = storing.toObject();

        // Update stock of goods batch
        const stockFromGoodsBatch = goodsBatch.stock;
        const ossFromGoodsBatch = goodsBatch.on_sales_stock;
        const bsFromStoring = storing.batch_stock;
        const ossFromStoring = storing.on_sales_stock;
        if (type === HistoryTypes.LocalImport) {
          stockToUpdate = Math.min(stockToUpdate, ossFromGoodsBatch, ossFromStoring);
          [bsToUpdate, ossToUpdate] = [stockToUpdate, -stockToUpdate];
        } else {
          stockToUpdate = Math.min(stockToUpdate, stockFromGoodsBatch, bsFromStoring);
          [bsToUpdate, ossToUpdate] = [-stockToUpdate, stockToUpdate];
        }
        // Check if stockToUpdate is 0
        if (!stockToUpdate) {
          throw new BaseError({
            statusCode: 400,
            error: errorCode.client,
            errors: { stock: errorCode['client.stockNotEnough'] }
          });
        }
        goodsBatch.stock += bsToUpdate;
        goodsBatch.on_sales_stock += ossToUpdate;
        goodsBatch.on_sales = goodsBatch.on_sales_stock > 0;
        await goodsBatch.save({ session });

        // Update stock of storing
        const rawResult = await storingHandler.createOrUpdateStock(
          {
            company_id: goodsBatch.company_id,
            product_id: goodsBatch.product_id,
            model_id: goodsBatch.model_id,
            [`${placeOfStock}_id`]: entityId,
            batch_stock: bsToUpdate,
            on_sales_stock: ossToUpdate,
            stock: bsToUpdate + ossToUpdate
          },
          { session, create: false }
        );
        storing = rawResult[`${placeOfStock}Storing`];
        storingSnapshot = rawResult[`${placeOfStock}StoringSnapshot`];
        if (!storing) {
          throw new BaseError({
            statusCode: 404,
            error: errorCode.client,
            errors: { [`${placeOfStock}_storing_id`]: errorCode['client.global.notFound'] },
            message: 'product is not found or removed'
          });
        }
        // For tracking batch history
        historyBatch = {
          request_move_quantity: stockToUpdate,
          from_delta_quantity: (type === HistoryTypes.LocalImport ? 1 : -1) * stockToUpdate,
          batch_code: unChangedGoodsBatch.batch_code,
          id: unChangedGoodsBatch._id,
          product_id: unChangedGoodsBatch.product_id,
          model_id: unChangedGoodsBatch.model_id,
          [`from_${placeOfStock}_storing_id`]: storing._id,
          [`from_${placeOfStock}_storing_snapshot`]: storingSnapshot,
          original_batch_id: goodsBatch._id
        };
      } else {
        // CASE `batch.id` does not exist
        storing = await storingService.findOneEnsure(
          { status: 'active', _id: storingId, is_directed_import: false },
          null,
          {
            session
          }
        );

        // Update stock of storing
        const bsFromStoring = storing.batch_stock;
        const ossFromStoring = storing.on_sales_stock;
        if (type === HistoryTypes.LocalImport) {
          stockToUpdate = Math.min(stockToUpdate, ossFromStoring);
          [bsToUpdate, ossToUpdate] = [stockToUpdate, -stockToUpdate];
        } else {
          stockToUpdate = Math.min(stockToUpdate, bsFromStoring);
          [bsToUpdate, ossToUpdate] = [-stockToUpdate, stockToUpdate];
        }
        // Check if stockToUpdate is 0
        if (!stockToUpdate) {
          throw new BaseError({
            statusCode: 400,
            error: errorCode.client,
            errors: { stock: errorCode['client.stockNotEnough'] }
          });
        }

        const rawResult = await storingHandler.createOrUpdateStock(
          {
            company_id: storing.company_id,
            product_id: storing.product_id,
            model_id: batch.model_id,
            [`${placeOfStock}_id`]: entityId,
            batch_stock: bsToUpdate,
            on_sales_stock: ossToUpdate,
            stock: bsToUpdate + ossToUpdate
          },
          { session, create: false }
        );
        storing = rawResult[`${placeOfStock}Storing`];
        storingSnapshot = rawResult[`${placeOfStock}StoringSnapshot`];
        if (!storing) {
          throw new BaseError({
            statusCode: 404,
            error: errorCode.client,
            errors: { [`${placeOfStock}_storing_id`]: errorCode['client.global.notFound'] },
            message: 'product is not found or removed'
          });
        }

        // For tracking batch history
        historyBatch = {
          request_move_quantity: stockToUpdate,
          from_delta_quantity: (type === HistoryTypes.LocalImport ? 1 : -1) * stockToUpdate,
          product_id: storing.product_id,
          model_id: batch.model_id,
          [`from_${placeOfStock}_storing_id`]: storing._id,
          [`from_${placeOfStock}_storing_snapshot`]: storingSnapshot
        };
      }

      // Tracking product stock
      await productStockTrackingService.create(
        {
          trackingPlace: placeOfStock,
          prevStoringDoc: storingSnapshot,
          curStoringDoc: storing,
          type,
          ...(goodsBatch ? { batch_id: goodsBatch._id } : {})
        },
        { session }
      );

      return {
        updatedGoodsBatch: goodsBatch,
        unChangedGoodsBatch,
        storingSnapshot,
        updatedStoring: storing,
        historyBatch
      };
    });
    // --

    // CREATE STOCK HISTORY --
    const historyData = {
      requester: { ...performedUser, perform_as: placeOfStock, perform_as_id: entityId },
      relate_to: placeOfStock,
      type,
      ...(type === HistoryTypes.LocalExport ? { export_type: ExportTypes.ForSale } : {}),
      [`from_${placeOfStock}_id`]: entityId,
      // batches: results.filter((re) => !!re.historyBatch).map(({ historyBatch }) => historyBatch),
      batches: results.map(({ historyBatch }) => historyBatch),
      company_id: performedUser.company_id,
      [`${placeOfStock}_id`]: entityId,
      note
    };
    const stockHistory = await productStockHistoryServiceV2.createAndPopulate(
      historyData,
      HistoryPopulatedFields,
      { session }
    );
    // --
    return { results, stockHistory };
  },
  /**
   * @description Update a goods batch at [warehouse|store|mall]
   * @param {{ performedUser: User, other_params: any }} { batchId, batchDoc, updates, performedUser, note }
   * @param {*} options
   * @returns {Promise<{ stockHistory: any, goodsBatch: any }>} { stockHistory, goodsBatch }
   */
  async updateGoodsBatch({ batchId, batchDoc, updates = {}, performedUser, note }, options = {}) {
    const { session } = options;

    // GET GOODS BATCH --
    let goodsBatch = null;
    if (batchDoc) {
      goodsBatch = batchDoc;
    } else if (batchId) {
      goodsBatch = await goodsBatchService.findOneActive({ _id: batchId }, null, { session });
    }
    if (!goodsBatch) {
      throw new BaseError({
        statusCode: 404,
        error: errorCode.client,
        errors: { goods_batch_id: errorCode['client.goodsBatchNotFound'] }
      });
    }
    // --

    // UPDATE GOODS BATCH --
    // Get stock to increase/descrease (if any)
    const stockFromGoodsBatch = goodsBatch.stock;
    const onSalesStockFromGoodsBatch = goodsBatch.on_sales_stock;

    const isNowOnSales = goodsBatch.on_sales;
    let { on_sales_stock: newOnSalesStock = 0, stock, batch_stock, ...restUpdates } = updates;
    let newBatchStock = stock || batch_stock || 0;

    let stockToUpdate = 0;
    let ossToUpdate = 0; // onSalesStock to update
    let bsToUpdate = 0; // batchStockToUpdate
    let type;

    if (restUpdates.status === DeletedStatus) {
      stockToUpdate = -stockFromGoodsBatch;
      [bsToUpdate, ossToUpdate] = isNowOnSales
        ? [0, -stockFromGoodsBatch]
        : [-stockFromGoodsBatch, 0];
    } else if (newBatchStock || newOnSalesStock) {
      // [bsToUpdate, ossToUpdate] = isNowOnSales ? [0, stockToUpdate] : [stockToUpdate, 0];
      if (newBatchStock) bsToUpdate = newBatchStock;
      if (newOnSalesStock) ossToUpdate = isNowOnSales ? newOnSalesStock : 0;
      stockToUpdate = bsToUpdate + ossToUpdate;

      if (stockToUpdate > 0) type = TrackingTypes.Import;
      if (stockToUpdate < 0) type = TrackingTypes.Export;
      if (stockToUpdate === 0) type = TrackingTypes.Edit;
    }
    // Update stock of goods batch & storing if stockToUpdate !== 0
    let storingSnapshot = null;
    if (stockToUpdate || ossToUpdate || bsToUpdate) {
      const { updatedGoodsBatch, storing } = await this.updateStockOfGoodsBatch(
        {
          batchDoc: goodsBatch,
          stock: stockToUpdate,
          batchStock: bsToUpdate,
          onSalesStock: ossToUpdate
        },
        { session }
      );
      goodsBatch = updatedGoodsBatch;
      storingSnapshot = storing;
    }
    mergeObject(goodsBatch, restUpdates);
    goodsBatch = await goodsBatch.save({ session });
    // --

    // CREATE STOCK HISTORY (if stockToUpdate !== 0) --
    let stockHistory = null;
    if (stockToUpdate || ossToUpdate || bsToUpdate) {
      const placeOfStock = goodsBatch.place_of_stock;
      const argsByPlace = {
        mall: { id: goodsBatch.mall_id },
        warehouse: { id: goodsBatch.warehouse_id },
        store: { id: goodsBatch.store_id }
      };
      const { id: entityId } = argsByPlace[placeOfStock];
      const historyData = {
        batches: [
          {
            id: goodsBatch._id,
            batch_code: goodsBatch.batch_code,
            product_id: goodsBatch.product_id,
            model_id: goodsBatch.model_id,
            from_delta_quantity: stockToUpdate,
            [`from_${placeOfStock}_storing_id`]: goodsBatch[`${placeOfStock}_storing_id`],
            [`from_${placeOfStock}_storing_snapshot`]: storingSnapshot
          }
        ],
        requester: performedUser,
        [`from_${placeOfStock}_id`]: entityId,
        company_id: goodsBatch.company_id,
        note,
        type,
        relate_to: placeOfStock
      };
      if (type === TrackingTypes.Export) historyData.export_type = ExportTypes.Other;
      [stockHistory] = await Promise.all([
        productStockHistoryServiceV2.createAndPopulate(historyData, HistoryPopulatedFields, {
          session
        }),
        productStockTrackingService.create(
          {
            trackingPlace: placeOfStock,
            prevStoringDoc: storingSnapshot,
            type,
            batch_id: goodsBatch._id
          },
          { session }
        )
      ]);
    }
    // --

    return { stockHistory, goodsBatch };
  },
  /**
   * @param {{
   *    movingType: MovingType,
   *    requesterType: RequesterType,
   *    ignoreApproval: boolean,
   *    batches: [],
   *    from: string,
   *    to: string,
   *    fromId: string,
   *    toId: string,
   *    note: string,
   *    performedUser: any
   * }} { movingType, requesterType, ignoreApproval, batches, from, to, fromId, toId, note, performedUser },
   * @param {*} options
   * @returns {Promise<{ stockHistory: any }>} { stockHistory }
   */
  async handleRequestMove(
    {
      movingType,
      requesterType,
      ignoreApproval,
      batches,
      from,
      to,
      fromId,
      toId,
      note,
      performedUser
    },
    options = {}
  ) {
    const { session } = options;
    const [f, t] = movingType.split('_to_');
    const fromEntity = from || f;
    const toEntity = to || t;
    const { service: fromStoringService } = StoringDict[fromEntity];
    const { service: toStoringService } = StoringDict[toEntity];

    const batchesToMove = await Promise.map(batches, async ({ id: batchId, stock }) => {
      // GET GOODS BATCH --
      const query = {
        _id: batchId,
        [`${fromEntity}_id`]: fromId,
        place_of_stock: fromEntity,
        transportable: true,
        stock: { $gt: 0 }
        // on_sales: false
      };
      let goodsBatch = await goodsBatchService.findOneActive(query, null, {
        session,
        populate: HistoryPopulatedFields
      });
      if (!goodsBatch) {
        throw new BaseError({
          statusCode: 404,
          error: errorCode.client,
          errors: { goods_batch_id: errorCode['client.goodsBatchNotFound'] },
          message: 'Goods batch not found or not enough stock to move'
        });
      }
      // --

      // HANDLE STOCK TO MOVE & CREATE STOCK HISTORY --
      // Check if request stock is greater than avalable stock in goods batch
      const reqStock = stock || goodsBatch.stock;
      if (reqStock > goodsBatch.stock) {
        throw new BaseError({
          statusCode: 400,
          error: errorCode.client,
          errors: { stock: errorCode['client.goodsBatchStockNotEnough'] }
        });
      }

      // Get from & toStoring(toStoring may be not exist)
      let fromStoring = goodsBatch[`${fromEntity}_storing`];
      let toStoring = await toStoringService.findOne(
        {
          product_id: goodsBatch.product_id,
          [`${toEntity}_id`]: toId,
          status: { $ne: 'disabled' }
        },
        null,
        { session }
      );

      // Move batch out if ignoreApproval === true
      if (ignoreApproval) {
        const { newGoodsBatch, storingSnapshot, updatedStoring } = await this.moveGoodsBatchOut(
          { batchDoc: goodsBatch, stock: reqStock },
          { session }
        );
        newGoodsBatch && (goodsBatch = newGoodsBatch);
        fromStoring = storingSnapshot;

        // Tracking product stock
        await productStockTrackingService.create(
          {
            trackingPlace: fromEntity,
            prevStoringDoc: storingSnapshot,
            curStoringDoc: updatedStoring,
            type: TrackingTypes.Export,
            batch_id: newGoodsBatch._id
          },
          { session }
        );
      }

      const batchData = {
        id: goodsBatch._id,
        batch_code: goodsBatch.batch_code,
        product_id: goodsBatch.product_id,
        model_id: goodsBatch.model_id,
        from_delta_quantity: -reqStock,
        request_move_quantity: reqStock,
        status: HistoryStatuses.Pending,
        [`from_${fromEntity}_storing_id`]: goodsBatch[`${fromEntity}_storing_id`],
        [`from_${fromEntity}_storing_snapshot`]: fromStoring,
        [`to_${toEntity}_storing_id`]: toStoring ? toStoring._id : undefined, // do not use null
        [`to_${toEntity}_storing_snapshot`]: toStoring ? toStoring : undefined // do not use null
      };

      return batchData;
    });

    // Create stock history
    const performerObj = {
      true: { perform_as: fromEntity, perform_as_id: fromId, [`${fromEntity}_id`]: fromId },
      false: { perform_as: toEntity, perform_as_id: toId, [`${toEntity}_id`]: toId }
    };
    const historyData = {
      batches: batchesToMove,
      requester: { ...performedUser, ...performerObj[requesterType === RequesterTypes.From] },
      approver: { ...performerObj[requesterType === RequesterTypes.To] },
      confirmor: { ...performerObj[false] },
      [`from_${fromEntity}_id`]: fromId,
      [`to_${toEntity}_id`]: toId,
      company_id: performedUser.company_id,
      request_note: note,
      type: HistoryTypes.Move,
      moving_type: movingType,
      relate_to: RelateTo[`${capitalize(fromEntity)}_${capitalize(toEntity)}`],
      need_approved: !ignoreApproval
    };

    const stockHistory = await productStockHistoryServiceV2.createAndPopulate(
      historyData,
      HistoryPopulatedFields,
      { session }
    );
    // --

    return { stockHistory };
  },
  /**
   * @param {{
   *    stockHistoryId: string,
   *    stockHistory: any,
   *    batches: [],
   *    status: 'approved' | 'cancelled',
   *    note: string,
   *    performedUser: any
   * }} { stockHistoryId, stockHistory, batches, note, performedUser },
   * @param {*} options
   * @returns {Promise<{ stockHistory: any }>} { stockHistory }
   */
  async handleApproveMove(
    { stockHistory, stockHistoryId, batches, status, note, performedUser },
    options = {}
  ) {
    const { session } = options;

    // GET STOCK HISTORY --
    let history = null;
    if (stockHistory) {
      history = stockHistory;
    } else if (stockHistoryId) {
      history = await productStockHistoryServiceV2.findOne(
        {
          _id: stockHistoryId,
          status: HistoryStatuses.Pending,
          type: HistoryTypes.Move
        },
        null,
        {
          session,
          populate: 'batches.batch'
        }
      );
    }
    if (!history) {
      throw new BaseError({
        statusCode: 404,
        error: errorCode.client,
        errors: { product_stock_history_id: errorCode['client.stockHistoryNotFound'] }
      });
    }
    // --

    // GET BATCHES TO APPROVE --
    // Return soon when status === 'cancelled'
    if (status === HistoryStatuses.Cancelled) {
      history.batches.forEach((batch) => {
        batch.status = HistoryStatuses.Cancelled;
      });
      history.status = HistoryStatuses.Cancelled;
      history.approve_note = note;
      mergeObject(history.approver, performedUser);

      return await history.save({ session });
    }

    const [fromEntity, toEntity] = history.moving_type.split('_to_');

    const batchesToApprove = history.batches.map((batch) => {
      const batchToApprove = {
        batchId: batch.id,
        modelId: batch.model_id,
        batchCode: batch.batch_code,
        productId: batch.product_id,
        status: HistoryStatuses.Approved,
        fromDeltaQuantity: batch.from_delta_quantity,
        requestMoveQuantity: batch.request_move_quantity,
        fromEntity,
        toEntity,
        [`from${capitalize(fromEntity)}StoringId`]: batch[`from_${fromEntity}_storing_id`],
        [`to${capitalize(toEntity)}StoringId`]: batch[`to_${toEntity}_storing_id`]
      };

      if (status) {
        batchToApprove.status = status;
      } else if (batches.length) {
        const exists = batches.find((b) => b.id.toString() === batch.id.toString());
        if (exists) {
          batchToApprove.status = exists.status;
        }
      } else {
        batchToApprove.status = HistoryStatuses.Approved;
      }

      return batchToApprove;
    });
    // --

    // HANDLE APPROVE GOODS BATCHES & UPDATE STOCK HISTORY --
    // Create/Update stock from [warehouse|store|mall] storing, batch and history
    const { service: fromStoringService, handler: fromStoringHandler } = StoringDict[fromEntity];
    const { service: toStoringService, handler: toStoringHandler } = StoringDict[toEntity];
    await Promise.mapSeries(batchesToApprove, async (batchToApprove, index) => {
      if (batchToApprove.status === HistoryStatuses.Approved) {
        // Check if requested goodsBatch exists (or enough stock) now
        const goodsBatch = await goodsBatchService.findOneActive(
          {
            _id: batchToApprove.batchId,
            [`${fromEntity}_id`]: history[`from_${fromEntity}_id`],
            place_of_stock: fromEntity,
            transportable: true,
            stock: { $gt: 0 }
            // on_sales: false
          },
          null,
          {
            session,
            populate: `${fromEntity}_storing ${toEntity}_storing product store warehouse mall`
          }
        );
        let errors = null;
        let message = '';
        let statusCode = 500;
        if (!goodsBatch) {
          statusCode = 404;
          errors = { goods_batch_id: errorCode['client.goodsBatchNotFound'] };
          message = `goods batch ${batchToApprove.batchId} not found`;
        } else if (goodsBatch.stock < batchToApprove.requestMoveQuantity) {
          statusCode = 400;
          errors = { stock: errorCode['client.goodsBatchStockNotEnough'] };
          message = `goods batch ${batchToApprove.batchId} has not enough stock for moving`;
        }
        if (errors) {
          throw new BaseError({
            statusCode,
            error: errorCode.client,
            errors,
            message
          });
        }

        const fromStoring = goodsBatch[`${fromEntity}_storing`];
        const toStoring = goodsBatch[`${toEntity}_storing`];
        if (!fromStoring && !toStoring) {
          logger.error('storings not found: %o', batchesToApprove);
          logger.error('fromStoring: %o', fromStoring);
          logger.error('toStoring: %o', toStoring);
          throw new BaseError({ statusCode: 500, error: errorCode.server });
        }

        // Update history batch
        history.batches[index].status = batchToApprove.status;
        history.batches[index][`from_${fromEntity}_storing_snapshot`] = fromStoring;
        history.batches[index][`to_${toEntity}_storing_snapshot`] = toStoring
          ? toStoring
          : undefined;

        // Update stock from storing and goods batch
        const stockToMove = batchToApprove.requestMoveQuantity;
        const { newGoodsBatch, storingSnapshot, updatedStoring } = await this.moveGoodsBatchOut(
          { batchDoc: goodsBatch, stock: stockToMove },
          { session }
        );
        if (newGoodsBatch) {
          history.batches[index].id = newGoodsBatch._id;
          history.batches[index].batch_id = newGoodsBatch._id;
          history.batches[index].original_batch_id = batchToApprove.batchId;
          history.batches[index][`from_${fromEntity}_storing_snapshot`] = storingSnapshot;
        }

        // Tracking product stock
        await productStockTrackingService.create(
          {
            trackingPlace: fromEntity,
            prevStoringDoc: storingSnapshot,
            curStoringDoc: updatedStoring,
            type: TrackingTypes.Export,
            batch_id: goodsBatch._id
          },
          { session }
        );
        return {};
      } else {
        history.batches[index].status = batchToApprove.status;
        return {};
      }
    });

    // Update stock history
    const hasApprovedStatus = history.batches.some(
      (batch) => batch.status === HistoryStatuses.Approved
    );
    history.status = hasApprovedStatus ? HistoryStatuses.Approved : HistoryStatuses.Cancelled;
    mergeObject(history.approver, performedUser);
    history.approve_note = note;
    history.approvedAt = new Date();
    history = await productStockHistoryServiceV2.saveAndPopulate(history, HistoryPopulatedFields, {
      session
    });
    // --

    return { stockHistory: history };
  },
  /**
   * @param {{
   *    stockHistoryId: string,
   *    stockHistory: any,
   *    batches: [],
   *    note: string,
   *    performedUser: any
   * }} { stockHistoryId, stockHistory, batches, note, performedUser },
   * @param {*} options
   * @returns {Promise<{ stockHistory: any }>} { stockHistory }
   */
  async handleConfirmMove(
    { stockHistory, stockHistoryId, batches, note, performedUser },
    options = {}
  ) {
    const { session } = options;

    // GET STOCK HISTORY --
    let history = null;
    if (stockHistory) {
      history = stockHistory;
    } else if (stockHistoryId) {
      history = await productStockHistoryServiceV2.findOne(
        {
          _id: stockHistoryId,
          confirmed_difference: { $ne: true },
          $or: [
            { status: HistoryStatuses.Pending, need_approved: false },
            { status: HistoryStatuses.Approved, need_approved: true }
          ],
          type: HistoryTypes.Move
        },
        null,
        {
          session,
          populate: HistoryPopulatedFields
        }
      );
    }
    if (!history) {
      throw new BaseError({
        statusCode: 404,
        error: errorCode.client,
        errors: { product_stock_history_id: errorCode['client.stockHistoryNotFound'] }
      });
    }
    // --

    // GET BATCHES TO CONFIRM --
    const [fromEntity, toEntity] = history.moving_type.split('_to_');

    const batchesToConfirm = history.batches.map((batch) => {
      const prevStatus = batch.status;
      const batchToConfirm = {
        batchId: batch.id,
        batchCode: batch.batch_code,
        productId: batch.product_id,
        fromDeltaQuantity: batch.from_delta_quantity,
        requestMoveQuantity: batch.request_move_quantity,
        fromEntity,
        toEntity,
        [`from${capitalize(fromEntity)}StoringId`]: batch[`from_${fromEntity}_storing_id`],
        [`to${capitalize(toEntity)}StoringId`]: batch[`to_${toEntity}_storing_id`],
        status: HistoryStatuses.Completed
      };

      if (prevStatus === HistoryStatuses.Cancelled) {
        batchToConfirm.fromDeltaQuantity = 0;
      } else if (batches.length) {
        const exists = batches.find(
          (b) =>
            b.id.toString() === batch.id.toString() ||
            b.id.toString() === batch.original_batch_id.toString()
        );
        if (exists) {
          batchToConfirm.fromDeltaQuantity = exists.stock
            ? -Math.min(exists.stock, Math.abs(batch.from_delta_quantity))
            : batch.from_delta_quantity;
          batchToConfirm.position = exists.position;
          batchToConfirm.onSales = exists.on_sales;
          batchToConfirm.differentMoveQuantity =
            batchToConfirm.fromDeltaQuantity + batchToConfirm.requestMoveQuantity;
        }
      }

      return batchToConfirm;
    });
    // --

    // HANDLE CONFIRM GOODS BATCHES & UPDATE STOCK HISTORY --
    // Create/Update stock from [warehouse|store|mall] storing, batch and history
    const { service: fromStoringService, handler: fromStoringHandler } = StoringDict[fromEntity];
    const { service: toStoringService, handler: toStoringHandler } = StoringDict[toEntity];
    await Promise.mapSeries(batchesToConfirm, async (batchToConfirm, index) => {
      if (batchToConfirm.fromDeltaQuantity) {
        const getFromStoring = fromStoringService.findOne(
          { _id: batchToConfirm[`from${capitalize(fromEntity)}StoringId`] },
          null,
          {
            session
          }
        );
        const getToStoring = toStoringHandler.getProduct(
          {
            [`${toEntity}Id`]: history[`to_${toEntity}_id`],
            companyId: history.company_id,
            productId: batchToConfirm.productId
          },
          { session }
        );

        const [fromStoring, toStoring] = await Promise.all([getFromStoring, getToStoring]);
        if (!fromStoring || !toStoring) {
          logger.error('storings not found: %o', batchesToApprove);
          logger.error('fromStoring: %o', fromStoring);
          logger.error('toStoring: %o', toStoring);
          throw new BaseError({ statusCode: 500, error: errorCode.server });
        }

        // Update history batch
        history.batches[index].status = batchToConfirm.status;
        history.batches[index].from_delta_quantity = batchToConfirm.fromDeltaQuantity;
        history.batches[index].different_move_quantity = batchToConfirm.differentMoveQuantity;
        history.batches[index][`from_${fromEntity}_storing_snapshot`] = fromStoring;
        history.batches[index][`to_${toEntity}_storing_snapshot`] = toStoring;

        // Update stock from storing and goods batch
        const res = await this.moveGoodsBatchIn(
          {
            oldPlaceOfStock: fromEntity,
            newPlaceOfStock: toEntity,
            [`${toEntity}Id`]: history[`to_${toEntity}_id`],
            [`${toEntity}StoringDoc`]: toStoring,
            batchId: batchToConfirm.batchId,
            stock: Math.abs(batchToConfirm.fromDeltaQuantity),
            position: batchToConfirm.position,
            onSales: !!batchToConfirm.onSales
          },
          { session }
        );

        // Tracking product stock
        await productStockTrackingService.create(
          {
            trackingPlace: toEntity,
            prevStoringDoc: res.storingSnapshot,
            curStoringDoc: res.storing,
            type: TrackingTypes.Import,
            batch_id: res.newBatch._id
          },
          { session }
        );

        return res;
      } else {
        history.batches[index].status = batchToConfirm.status;
        history.batches[index].from_delta_quantity = batchToConfirm.fromDeltaQuantity;
        return {};
      }
    });

    // Update stock history
    history.status = HistoryStatuses.Completed;
    mergeObject(history.confirmor, performedUser);
    history.confirm_note = note;
    history.confirmedAt = new Date();
    history = await productStockHistoryServiceV2.saveAndPopulate(history, HistoryPopulatedFields, {
      session
    });
    // --

    return { stockHistory: history };
  },
  /**
   * @param {{
   *    stockHistoryId: string,
   *    stockHistory: any,
   *    batches: [],
   *    note: string,
   *    performedUser: any
   * }} { stockHistoryId, stockHistory, batches, note, performedUser },
   * @param {*} options
   * @returns {Promise<{ stockHistory: any }>} { stockHistory }
   */
  async handleConfirmDifference(
    { stockHistory, stockHistoryId, batches, note, performedUser },
    options = {}
  ) {
    const { session } = options;

    // GET STOCK HISTORY --
    let history = null;
    if (stockHistory) {
      history = stockHistory;
    } else if (stockHistoryId) {
      history = await productStockHistoryServiceV2.findOne(
        {
          _id: stockHistoryId,
          type: HistoryTypes.Move,
          confirmed_difference: false,
          status: HistoryStatuses.Completed
        },
        null,
        {
          session,
          populate: 'batches.original_batch batches.batch'
        }
      );
    }
    if (!history) {
      throw new BaseError({
        statusCode: 404,
        error: errorCode.client,
        errors: { product_stock_history_id: errorCode['client.stockHistoryNotFound'] }
      });
    }

    // --
    // UPDATE STOCK FROM GOODS BATCHES, STORING, HISTORY
    const [fromEntity, toEntity] = history.moving_type.split('_to_');
    await Promise.mapSeries(history.batches, async (batchFromHistory, index) => {
      const orgBatchId = batchFromHistory.original_batch_id.toString();
      const batchId = batchFromHistory.batch_id.toString();
      const modelId = batchFromHistory.model_id;
      const fromDeltaQuantity = batchFromHistory.from_delta_quantity;
      const requestMoveQuantity = batchFromHistory.request_move_quantity;
      let differentMoveQuantity = batchFromHistory.different_move_quantity;

      if (fromDeltaQuantity && fromDeltaQuantity + requestMoveQuantity) {
        const batchFromDiff = batches.find(
          (batch) => batch.id === batchId || batch.id === orgBatchId
        );
        if (batchFromDiff) {
          const diffQuantity = batchFromDiff.different_move_quantity;
          if (diffQuantity <= 0 || diffQuantity > differentMoveQuantity) {
            throw new BaseError({
              statusCode: 400,
              error: errorCode.client,
              errors: { different_move_quantity: errorCode['client.stockCannotBeNegative'] }
            });
          }
          differentMoveQuantity = diffQuantity;
        }
        const { updatedGoodsBatch, storing, updatedStoring } = await this.updateStockOfGoodsBatch(
          {
            batchId: orgBatchId,
            stock: differentMoveQuantity,
            batchStock: differentMoveQuantity,
            onSalesStock: 0
          },
          { session }
        );

        // Tracking product stock
        await productStockTrackingService.create(
          {
            trackingPlace: fromEntity,
            prevStoringDoc: storing,
            curStoringDoc: updatedStoring,
            type: TrackingTypes.Edit,
            batch_id: updatedGoodsBatch._id
          },
          { session }
        );
      }
      history.batches[index].different_move_quantity = differentMoveQuantity;

      return {};
    });
    history.note = note;
    history.confirmed_difference = true;
    history.confirmedAt = new Date();

    history = await productStockHistoryServiceV2.saveAndPopulate(history, HistoryPopulatedFields, {
      session
    });

    return { stockHistory: history };
  }
};
