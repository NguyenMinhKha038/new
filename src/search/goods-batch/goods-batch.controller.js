import { Promise } from 'bluebird';
import goodsBatchService from './goods-batch.service';
import {
  PopulatedFields,
  DeletedStatus,
  AvailableStatuses,
  PlaceOfStock,
  CanIgnoreApprovalMovingTypes
} from './goods-batch.config';
import {
  BaseResponse,
  errorCode,
  BaseError,
  selectToPopulate,
  withSafety,
  transactionHelper
} from '../../commons/utils';
import providerService from '../provider/provider.service';
import companyActivityService from '../company-activity/company-activity.service';
import { CompanyActions } from '../company-activity/company-activity.config';
import goodsBatchHandler from './goods-batch.handler';
import productStockHistoryServiceV2 from '../product-stock-history/v2/product-stock-history.service';
import {
  Statuses as HistoryStatuses,
  Types as HistoryTypes,
  PopulatedFields as HistoryPopulatedFields
} from '../product-stock-history/v2/product-stock-history.config';
import mallService from '../sum-mall/mall/mall.service';
import warehouseService from '../warehouse/warehouse.service';
import storeService from '../store/store.service';
import mallActivityService from '../sum-mall/mall-activity/mall-activity.service';
import { MallActions } from '../sum-mall/mall-activity/mall-activity.config';
import notificationService from '../notification/notification.service';
import { Types as NotifTypes } from '../notification/notification.config';

export default {
  async getById(req, res, next) {
    try {
      const {
        params: { id: batchId },
        query: { select, populate: populatedStr }
      } = req;
      const { populate } = selectToPopulate(populatedStr, PopulatedFields);
      let goodsBatch = await goodsBatchService.findOneActive(
        {
          _id: batchId,
          transportable: true,
          // on_sales: false,
          stock: { $gt: 0 },
          place_of_stock: { $ne: PlaceOfStock.Transporting }
        },
        select,
        {
          populate
        }
      );
      if (goodsBatch) {
        goodsBatch = goodsBatch.removeFields([
          'import_date',
          'export_date',
          'sold',
          'refunded',
          'exported',
          'transportable',
          'status',
          'notes',
          'note'
        ]);
      }

      return new BaseResponse({ statusCode: 200, data: goodsBatch }).return(res);
    } catch (err) {
      next(err);
    }
  },
  async get(req, res, next) {
    try {
      const {
        limit,
        page,
        sort,
        select,
        populate: populatedStr,
        import_date_from,
        import_date_to,
        export_date_from,
        export_date_to,
        place_of_stock,
        ...query
      } = req.query;
      query.status = { $in: Object.values(AvailableStatuses) };
      query.transportable = true;
      // query.on_sales = false;
      query.stock = { $gt: 0 };
      query['$and'] = [{ place_of_stock: { $ne: PlaceOfStock.Transporting } }];
      if (place_of_stock) {
        query['$and'].push({ place_of_stock });
      }
      const { populate } = selectToPopulate(populatedStr, PopulatedFields);

      let [goodsBatches, metadata] = await goodsBatchService.findWithPagination({
        page,
        limit,
        select,
        sort,
        populate,
        query
      });
      if (goodsBatches.length) {
        goodsBatches = goodsBatches.map((goodsBatch) =>
          goodsBatch.removeFields([
            'import_date',
            'export_date',
            'sold',
            'refunded',
            'exported',
            'transportable',
            'status',
            'notes',
            'note'
          ])
        );
      }

      return new BaseResponse({ statusCode: 200, data: goodsBatches })
        .addMeta(metadata)
        .return(res);
    } catch (err) {
      next(err);
    }
  },
  async importBatch(req, res, next) {
    try {
      const {
        stock_permission: stockPermission,
        body: { mall_id, warehouse_id, store_id, ...dataToCreate }
      } = req;
      const placeOfStock = dataToCreate.place_of_stock;
      dataToCreate[`${placeOfStock}_id`] = req.body[`${placeOfStock}_id`];
      if (stockPermission.company_id) {
        dataToCreate.company_id = stockPermission.company_id;
      }

      // Check permission detail
      if (!stockPermission[`${placeOfStock}_ids`].includes(dataToCreate[`${placeOfStock}_id`])) {
        throw new BaseError({
          statusCode: 401,
          error: errorCode.client,
          errors: { permission: errorCode['permission.notAllow'] }
        });
      }

      // Handle importing batch
      const {
        stockHistory: stock_history,
        goodsBatch: goods_batch,
        mallStoring: mall_storing,
        warehouseStoring: warehouse_storing,
        productStoring: product_storing
      } = await transactionHelper.withSession(async (session) => {
        const performedUser = { ...stockPermission };

        return await goodsBatchHandler.createGoodsBatch(
          { batchData: dataToCreate, performedUser },
          { session }
        );
      });

      // CREATE [MALL|COMPANY] ACTIVITY
      withSafety(() => {
        placeOfStock === PlaceOfStock.Mall
          ? mallActivityService.implicitCreate(MallActions.createGoodsBatch)(req, {
              object_id: goods_batch._id
            })
          : companyActivityService.implicitCreate(CompanyActions.createGoodsBatch)(req, {
              object_id: goods_batch._id
            });
      });

      return new BaseResponse({
        statusCode: 201,
        data: stock_history
        // data: { stock_history, goods_batch, warehouse_storing, product_storing, mall_storing }
      }).return(res);
    } catch (err) {
      next(err);
    }
  },
  async exportBatches(req, res, next) {
    try {
      const {
        stock_permission: stockPermission,
        body: { place_of_stock: placeOfStock, export_type: exportType, batches, note, ...restBody }
      } = req;

      // Check permission detail
      if (!stockPermission[`${placeOfStock}_ids`].includes(restBody[`${placeOfStock}_id`])) {
        throw new BaseError({
          statusCode: 401,
          error: errorCode.client,
          errors: { permission: errorCode['permission.notAllow'] }
        });
      }
      const {
        results: exportResults,
        stockHistory: stock_history
      } = await transactionHelper.withSession(async (session) => {
        const performedUser = { ...stockPermission };
        const dataToExport = {
          batches,
          placeOfStock,
          exportType,
          note,
          [`${placeOfStock}Id`]: restBody[`${placeOfStock}_id`],
          performedUser
        };

        return await goodsBatchHandler.exportGoodsBatches(dataToExport, { session });
      });

      // CREATE [MALL|COMPANY] ACTIVITY
      withSafety(() => {
        let activityService = companyActivityService;
        let action = CompanyActions.updateGoodsBatch;
        if (placeOfStock === PlaceOfStock.Mall) {
          activityService = mallActivityService;
          action = MallActions.updateGoodsBatch;
        }
        for (const exportResult of exportResults) {
          activityService.implicitCreate(action)(req, {
            object_id: exportResult.updatedGoodsBatch._id
          });
        }
      });

      return new BaseResponse({
        statusCode: 200,
        data: stock_history
        // data: { stock_history, results: exportResults }
      }).return(res);
    } catch (err) {
      next(err);
    }
  },
  async handleBatchesForSale(req, res, next) {
    try {
      const {
        stock_permission: stockPermission,
        body: { place_of_stock: placeOfStock, batches, type, note, ...restBody }
      } = req;

      // Check permission detail
      if (!stockPermission[`${placeOfStock}_ids`].includes(restBody[`${placeOfStock}_id`])) {
        throw new BaseError({
          statusCode: 401,
          error: errorCode.client,
          errors: { permission: errorCode['permission.notAllow'] }
        });
      }
      const {
        results: handledResults,
        stockHistory: stock_history
      } = await transactionHelper.withSession(async (session) => {
        const performedUser = { ...stockPermission };
        const dataToHandle = {
          type,
          batches,
          placeOfStock,
          note,
          [`${placeOfStock}Id`]: restBody[`${placeOfStock}_id`],
          performedUser
        };

        return await goodsBatchHandler.handleGoodsBatchesForSale(dataToHandle, { session });
      });

      // CREATE [MALL|COMPANY] ACTIVITY
      withSafety(() => {
        let activityService = companyActivityService;
        let action = CompanyActions.updateGoodsBatch;
        if (placeOfStock === PlaceOfStock.Mall) {
          activityService = mallActivityService;
          action = MallActions.updateGoodsBatch;
        }
        const results = handledResults.filter((re) => !!re.updatedGoodsBatch);
        for (const handledResult of results) {
          activityService.implicitCreate(action)(req, {
            object_id: handledResult.updatedGoodsBatch._id
          });
        }
      });

      return new BaseResponse({
        statusCode: 200,
        data: stock_history
      }).return(res);
    } catch (err) {
      next(err);
    }
  },
  async requestMove(req, res, next) {
    try {
      const {
        user,
        move_permission: movePermission,
        body: {
          moving_type: movingType,
          requester_type: requesterType,
          ignore_approval: ignoreApproval,
          batches,
          note,
          ...restBody
        }
      } = req;
      const [fromEntity, toEntity] = movingType.split('_to_'); // ex: warehouse_to_store => [warehouse, store]
      const fromId = restBody[`from_${fromEntity}_id`];
      const toId = restBody[`to_${toEntity}_id`];
      const { requesterEntity, requesterEntityId } =
        requesterType === 'from'
          ? { requesterEntity: fromEntity, requesterEntityId: fromId }
          : { requesterEntity: toEntity, requesterEntityId: toId };
      const serviceByPlace = {
        mall: mallService,
        warehouse: warehouseService,
        store: storeService
      };

      // VALIDATING PARAMS --
      // Check possible_moving_types
      let errors = null;
      let statusCode = 400;
      if (
        !movePermission[`${requesterEntity}_ids`].includes(requesterEntityId) ||
        !movePermission.moving_types.includes(movingType)
      ) {
        statusCode = 401;
        errors = { permission: errorCode['permission.notAllow'] };
      }
      // Check fromId, toId
      let fromCompanyId = null;
      let toCompanyId = null;
      const [fromEntityDoc, toEntityDoc] = await Promise.all([
        serviceByPlace[fromEntity].findOneActive({ _id: fromId }),
        serviceByPlace[toEntity].findOneActive({ _id: toId })
      ]);
      if (!fromEntityDoc) {
        statusCode = 404;
        errors = { [`${fromEntity}`]: errorCode['client.global.notFound'] };
      } else {
        fromCompanyId = (fromEntityDoc.company_id || '').toString();
      }
      if (!toEntityDoc) {
        statusCode = 404;
        errors = { [`${toEntity}`]: errorCode['client.global.notFound'] };
      } else {
        toCompanyId = (toEntityDoc.company_id || '').toString();
      }
      if (
        ignoreApproval &&
        (!CanIgnoreApprovalMovingTypes.includes(movingType) || fromCompanyId !== toCompanyId)
      ) {
        statusCode = 401;
        errors = { permission: errorCode['permission.notAllow'] };
      }
      if (errors) {
        throw new BaseError({
          statusCode,
          error: errorCode.client,
          errors
        });
      }

      // HANDLE REQUEST MOVE --
      const { stockHistory } = await transactionHelper.withSession(async (session) => {
        const performedUser = { ...movePermission };

        return await goodsBatchHandler.handleRequestMove(
          {
            movingType,
            requesterType,
            ignoreApproval,
            from: fromEntity,
            to: toEntity,
            fromId,
            toId,
            batches,
            note,
            performedUser
          },
          { session }
        );
      });

      // HANDLE NOTIFICATION --
      withSafety(() => {
        const approverEntity = stockHistory.approver.perform_as;
        const approverEntityId = stockHistory.approver.perform_as_id;
        const fromEntityName = stockHistory[`from_${fromEntity}`]
          ? stockHistory[`from_${fromEntity}`]['name']
          : '';
        const toEntityName = stockHistory[`to_${toEntity}`]
          ? stockHistory[`to_${toEntity}`]['name']
          : '';
        notificationService.findAndSend(
          {
            [`${approverEntity}_id`]: approverEntityId,
            company_role: `${approverEntity}_stock`
          },
          {
            type: NotifTypes.MoveGoodsBatchRequest,
            title: 'Yêu cầu chuyển lô hàng',
            message: `${user.name} đã tạo yêu cầu chuyển ${stockHistory.batches.length} lô hàng từ ${fromEntity} ${fromEntityName} tới ${toEntity} ${toEntityName}. [request id: ${stockHistory.id}]`,
            object_id: stockHistory.id,
            onModel: 's_product_stock_history'
          },
          {
            exclude_ids: [user.id]
          }
        );
      });

      return new BaseResponse({ statusCode: 200, data: stockHistory }).return(res);
    } catch (err) {
      next(err);
    }
  },
  async updateMove(req, res, next) {
    try {
      const {
        user,
        stock_permission: stockPermission,
        body: { product_stock_history_id: stockHistoryId, batches, status }
      } = req;

      // Check if stock history exists
      let stockHistory = await productStockHistoryServiceV2.findOne(
        {
          _id: stockHistoryId,
          status: HistoryStatuses.Pending,
          type: HistoryTypes.Move,
          need_approved: true
        },
        null,
        { populate: HistoryPopulatedFields }
      );
      if (!stockHistory) {
        throw new BaseError({
          statusCode: 404,
          error: errorCode.client,
          errors: { product_stock_history_id: errorCode['client.stockHistoryNotFound'] }
        });
      }

      // Check permission detail
      const performAs = stockHistory.requester.perform_as;
      const performAsId = stockHistory.requester.perform_as_id;
      if (!stockPermission[`${performAs}_ids`].includes(performAsId.toString())) {
        throw new BaseError({
          statusCode: 401,
          error: errorCode.client,
          errors: { permission: errorCode['permission.notAllow'] }
        });
      }

      // Update stock to move
      if (status === HistoryStatuses.Cancelled) {
        stockHistory.batches.forEach((batch) => {
          batch.status = status;
        });
        stockHistory.status = status;
      } else if (batches.length) {
        const batchesSize = stockHistory.batches.length;
        const movingType = stockHistory.moving_type;
        const [fromEntity, toEntity] = movingType.split('_to_');
        for (let i = 0; i < batchesSize; i += 1) {
          const batchFromHistory = stockHistory.batches[i];
          const exists = batches.find(
            (b) =>
              b.id === batchFromHistory.batch_id.toString() ||
              b.id === batchFromHistory.original_batch_id.toString()
          );
          if (!exists) {
            i += 1;
            continue;
          }

          const newStock = exists.stock;
          // Check if stock from goods batch is enough for moving
          if (newStock > batchFromHistory.batch.stock) {
            throw new BaseError({
              statusCode: 400,
              error: errorCode.client,
              errors: { stock: errorCode['client.goodsBatchStockNotEnough'] }
            });
          }

          stockHistory.batches[i].from_delta_quantity = -newStock;
          stockHistory.batches[i].request_move_quantity = newStock;
          stockHistory.batches[i][`from_${fromEntity}_storing_snapshot`] =
            batchFromHistory[`from_${fromEntity}_storing`];

          i += 1;
        }

        await stockHistory.save();
      }

      // HANDLE NOTIFICATION --
      withSafety(() => {
        const [fromEntity, toEntity] = stockHistory.moving_type.split('_to_');
        const approverEntity = stockHistory.approver.perform_as;
        const approverEntityId = stockHistory.approver.perform_as_id;
        const fromEntityName = stockHistory[`from_${fromEntity}`]
          ? stockHistory[`from_${fromEntity}`]['name']
          : '';
        const toEntityName = stockHistory[`to_${toEntity}`]
          ? stockHistory[`to_${toEntity}`]['name']
          : '';
        notificationService.findAndSend(
          {
            [`${approverEntity}_id`]: approverEntityId,
            company_role: `${approverEntity}_stock`
          },
          {
            type: NotifTypes.MoveGoodsBatchRequest,
            title: 'Yêu cầu chuyển lô hàng',
            message: `${user.name} đã tạo yêu cầu chuyển ${stockHistory.batches.length} lô hàng từ ${fromEntity} ${fromEntityName} tới ${toEntity} ${toEntityName}. [request id: ${stockHistory.id}]`,
            object_id: stockHistory.id,
            onModel: 's_product_stock_history'
          },
          {
            exclude_ids: [user.id]
          }
        );
      });

      return new BaseResponse({ statusCode: 200, data: stockHistory }).return(res);
    } catch (err) {
      next(err);
    }
  },
  async approveMove(req, res, next) {
    try {
      const {
        user,
        move_permission: movePermission,
        body: { product_stock_history_id: stockHistoryId, batches, status, note }
      } = req;

      // HANDLE APPROVE MOVE --
      const { stockHistory } = await transactionHelper.withSession(async (session) => {
        // Check if stock history exists
        const history = await productStockHistoryServiceV2.findOne(
          {
            _id: stockHistoryId,
            status: HistoryStatuses.Pending,
            type: HistoryTypes.Move,
            need_approved: true
          },
          null,
          { session }
        );
        if (!history) {
          throw new BaseError({
            statusCode: 404,
            error: errorCode.client,
            errors: { product_stock_history_id: errorCode['client.stockHistoryNotFound'] }
          });
        }
        // Check permission
        const approverEntity = history.approver.perform_as;
        const approverEntityId = history.approver.perform_as_id.toString();
        if (!movePermission[`${approverEntity}_ids`].includes(approverEntityId)) {
          throw new BaseError({
            statusCode: 401,
            error: errorCode.client,
            errors: { permission: errorCode['permission.notAllow'] }
          });
        }

        const performedUser = { ...movePermission };
        return await goodsBatchHandler.handleApproveMove(
          {
            stockHistory: history,
            batches,
            status,
            note,
            performedUser
          },
          { session }
        );
      });

      // HANDLE NOTIFICATION --
      withSafety(() => {
        const [fromEntity, toEntity] = stockHistory.moving_type.split('_to_');
        const requesterEntity = stockHistory.requester.perform_as;
        const requesterEntityId = stockHistory.requester.perform_as_id;
        const fromEntityName = stockHistory[`from_${fromEntity}`]
          ? stockHistory[`from_${fromEntity}`]['name']
          : '';
        const toEntityName = stockHistory[`to_${toEntity}`]
          ? stockHistory[`to_${toEntity}`]['name']
          : '';
        const requestResult =
          stockHistory.status !== HistoryStatuses.Cancelled ? 'được duyệt' : 'bịtừ chối';
        notificationService.findAndSend(
          {
            [`${requesterEntity}_id`]: requesterEntityId,
            company_role: `${requesterEntity}_stock`
          },
          {
            type: NotifTypes.MoveGoodsBatchApprove,
            title: 'Yêu cầu chuyển lô hàng đã được xử lý',
            message: `Yêu cầu chuyển lô hàng [${stockHistory.id}] đã ${requestResult} bởi ${user.name}`,
            object_id: stockHistory.id,
            onModel: 's_product_stock_history'
          },
          {
            exclude_ids: [user.id]
          }
        );
      });

      return new BaseResponse({ statusCode: 200, data: stockHistory }).return(res);
    } catch (err) {
      next(err);
    }
  },
  async confirmMove(req, res, next) {
    try {
      const {
        user,
        move_permission: movePermission,
        body: { product_stock_history_id: stockHistoryId, batches, note }
      } = req;

      // HANDLE CONFIRM MOVE --
      const { stockHistory } = await transactionHelper.withSession(async (session) => {
        // Check if stock history exists
        const history = await productStockHistoryServiceV2.findOne(
          {
            _id: stockHistoryId,
            type: HistoryTypes.Move,
            confirmed_difference: { $ne: true },
            $or: [
              { status: HistoryStatuses.Pending, need_approved: false },
              { status: HistoryStatuses.Approved, need_approved: true }
            ]
          },
          null,
          { session }
        );
        if (!history) {
          throw new BaseError({
            statusCode: 404,
            error: errorCode.client,
            errors: { product_stock_history_id: errorCode['client.stockHistoryNotFound'] }
          });
        }
        // Check permission
        const confirmorEntity = history.confirmor.perform_as;
        const confirmorEntityId = history.confirmor.perform_as_id.toString();
        if (!movePermission[`${confirmorEntity}_ids`].includes(confirmorEntityId)) {
          throw new BaseError({
            statusCode: 401,
            error: errorCode.client,
            errors: { permission: errorCode['permission.notAllow'] }
          });
        }

        const performedUser = { ...movePermission };
        return await goodsBatchHandler.handleConfirmMove(
          {
            stockHistory: history,
            batches,
            note,
            performedUser
          },
          { session }
        );
      });

      // HANDLE NOTIFICATION --
      withSafety(() => {
        const [fromEntity, toEntity] = stockHistory.moving_type.split('_to_');
        const fromId = stockHistory[`$from_${fromEntity}_id`];
        const fromEntityName = stockHistory[`from_${fromEntity}`]
          ? stockHistory[`from_${fromEntity}`]['name']
          : '';
        const toEntityName = stockHistory[`to_${toEntity}`]
          ? stockHistory[`to_${toEntity}`]['name']
          : '';
        notificationService.findAndSend(
          {
            [`${fromEntity}_id`]: fromId,
            company_role: `${fromEntity}_stock`
          },
          {
            type: NotifTypes.MoveGoodsBatchConfirm,
            title: 'Xác nhận đã nhận hàng',
            message: `${user.name} xác nhận các lô hàng từ yêu cầu [${stockHistory.id}] đã đến ${toEntity} ${toEntityName}`,
            object_id: stockHistory.id,
            onModel: 's_product_stock_history'
          },
          {
            exclude_ids: [user.id]
          }
        );
      });

      return new BaseResponse({ statusCode: 200, data: stockHistory }).return(res);
    } catch (err) {
      next(err);
    }
  },
  async confirmDifference(req, res, next) {
    try {
      const {
        user,
        move_permission: movePermission,
        body: { product_stock_history_id: stockHistoryId, batches, note }
      } = req;

      const { stockHistory } = await transactionHelper.withSession(async (session) => {
        // Check if stock history exists
        const history = await productStockHistoryServiceV2.findOne(
          {
            _id: stockHistoryId,
            type: HistoryTypes.Move,
            confirmed_difference: false,
            status: HistoryStatuses.Completed
          },
          null,
          { session, populate: 'batches.original_batch batches.batch' }
        );
        if (!history) {
          throw new BaseError({
            statusCode: 404,
            error: errorCode.client,
            errors: { product_stock_history_id: errorCode['client.stockHistoryNotFound'] }
          });
        }
        // Check permission
        const fromEntity = history.requester.perform_as;
        const fromEntityId = history.requester.perform_as_id.toString();
        if (!movePermission[`${fromEntity}_ids`].includes(fromEntityId)) {
          throw new BaseError({
            statusCode: 401,
            error: errorCode.client,
            errors: { permission: errorCode['permission.notAllow'] }
          });
        }

        const performedUser = { ...movePermission };
        return await goodsBatchHandler.handleConfirmDifference(
          {
            stockHistory: history,
            batches,
            note,
            performedUser
          },
          { session }
        );
      });

      return new BaseResponse({ statusCode: 200, data: stockHistory }).return(res);
    } catch (err) {
      return next(err);
    }
  },
  company_mall: {
    async getById(req, res, next) {
      try {
        const {
          stock_permission: stockPermission,
          params: { id: batchId },
          query: { select, populate: populatedStr }
        } = req;

        const query = {
          _id: batchId,
          status: { $ne: DeletedStatus },
          place_of_stock: { $in: [PlaceOfStock.Transporting, ...stockPermission.staff_of] },
          $or: [
            { store_id: { $in: stockPermission.store_ids } },
            { warehouse_id: { $in: stockPermission.warehouse_ids } },
            { mall_id: { $in: stockPermission.mall_ids } }
          ]
        };

        const { populate } = selectToPopulate(populatedStr, PopulatedFields);
        let goodsBatch = await goodsBatchService.findOneActive(query, select, {
          populate
        });
        if (goodsBatch && goodsBatch.model_id) {
          goodsBatch = await goodsBatch.getModel();
        }
        return new BaseResponse({ statusCode: 200, data: goodsBatch }).return(res);
      } catch (err) {
        next(err);
      }
    },
    async getBySku(req, res, next) {
      try {
        const {
          stock_permission: stockPermission,
          params: { sku },
          query: { select, populate: populatedStr }
        } = req;

        const query = {
          stock_keeping_unit: sku,
          status: { $ne: DeletedStatus },
          place_of_stock: { $in: [PlaceOfStock.Transporting, ...stockPermission.staff_of] },
          $or: [
            { store_id: { $in: stockPermission.store_ids } },
            { warehouse_id: { $in: stockPermission.warehouse_ids } },
            { mall_id: { $in: stockPermission.mall_ids } }
          ]
        };

        const { populate } = selectToPopulate(populatedStr, PopulatedFields);
        const goodsBatch = await goodsBatchService.findOneActive(query, select, {
          populate
        });
        return new BaseResponse({ statusCode: 200, data: goodsBatch }).return(res);
      } catch (err) {
        next(err);
      }
    },
    async get(req, res, next) {
      try {
        const {
          stock_permission: stockPermission,
          query: { limit, page, sort, select, populate: populatedStr, place_of_stock, ...query }
        } = req;
        query['$and'] = [
          {
            place_of_stock: { $in: [PlaceOfStock.Transporting, ...stockPermission.staff_of] },
            status: { $ne: DeletedStatus }
          }
        ];
        if (place_of_stock) {
          query['$and'].push({ place_of_stock });
        }
        query['$or'] = [
          { store_id: { $in: stockPermission.store_ids } },
          { warehouse_id: { $in: stockPermission.warehouse_ids } },
          { mall_id: { $in: stockPermission.mall_ids } }
        ];

        const { populate } = selectToPopulate(populatedStr, PopulatedFields);

        let [goodsBatches, metadata] = await goodsBatchService.findWithPagination({
          page,
          limit,
          select,
          sort,
          populate,
          query
        });
        if (goodsBatches.length) {
          goodsBatches = await Promise.all(
            goodsBatches.map((batch) => (batch.model_id ? batch.getModel() : batch))
          );
        }

        return new BaseResponse({ statusCode: 200, data: goodsBatches })
          .addMeta(metadata)
          .return(res);
      } catch (err) {
        next(err);
      }
    },
    async update(req, res, next) {
      try {
        const {
          stock_permission: stockPermission,
          params: { id: batchId },
          body: { ...updates }
        } = req;
        const performedUser = { ...stockPermission };
        const query = {
          _id: batchId,
          place_of_stock: { $ne: PlaceOfStock.Transporting },
          $or: [
            { store_id: { $in: stockPermission.store_ids } },
            { warehouse_id: { $in: stockPermission.warehouse_ids } },
            { mall_id: { $in: stockPermission.mall_ids } }
          ]
        };

        const updatedGoodsBatch = await transactionHelper.withSession(async (session) => {
          // Check if goods batch exists or not
          const batchDoc = await goodsBatchService.findOneActive(query, null, { session });
          if (!batchDoc) {
            throw new BaseError({
              statusCode: 404,
              error: errorCode.client,
              errors: { goods_batch_id: errorCode['client.goodsBatchNotFound'] }
            });
          }
          const { goodsBatch } = await goodsBatchHandler.updateGoodsBatch(
            { batchDoc, updates, performedUser },
            { session }
          );
          return goodsBatch;
        });

        // CREATE [MALL|COMPANY] ACTIVITY
        const placeOfStock = updatedGoodsBatch.place_of_stock;
        withSafety(() => {
          placeOfStock === PlaceOfStock.Mall
            ? mallActivityService.implicitCreate(MallActions.updateGoodsBatch)(req, {
                object_id: updatedGoodsBatch._id
              })
            : companyActivityService.implicitCreate(CompanyActions.updateGoodsBatch)(req, {
                object_id: updatedGoodsBatch._id
              });
        });

        return new BaseResponse({ statusCode: 200, data: updatedGoodsBatch }).return(res);
      } catch (err) {
        next(err);
      }
    },
    async delete(req, res, next) {
      try {
        const {
          stock_permission: stockPermission,
          params: { id: batchId }
        } = req;
        const performedUser = { ...stockPermission };
        const query = {
          _id: batchId,
          place_of_stock: { $ne: PlaceOfStock.Transporting },
          $or: [
            { store_id: { $in: stockPermission.store_ids } },
            { warehouse_id: { $in: stockPermission.warehouse_ids } },
            { mall_id: { $in: stockPermission.mall_ids } }
          ]
        };

        const deletedGoodsBatch = await transactionHelper.withSession(async (session) => {
          // Check if goods batch exists or not
          const batchDoc = await goodsBatchService.findOneActive(query, null, { session });
          if (!batchDoc) {
            throw new BaseError({
              statusCode: 404,
              error: errorCode.client,
              errors: { goods_batch_id: errorCode['client.goodsBatchNotFound'] }
            });
          }
          const { goodsBatch } = await goodsBatchHandler.updateGoodsBatch(
            { batchDoc, updates: { status: DeletedStatus }, performedUser },
            { session }
          );
          return goodsBatch;
        });

        // CREATE [MALL|COMPANY] ACTIVITY
        withSafety(() => {
          placeOfStock === PlaceOfStock.Mall
            ? mallActivityService.implicitCreate(MallActions.deleteGoodsBatch)(req, {
                object_id: deletedGoodsBatch._id
              })
            : companyActivityService.implicitCreate(CompanyActions.deleteGoodsBatch)(req, {
                object_id: deletedGoodsBatch._id
              });
        });

        return new BaseResponse({ statusCode: 200, data: deletedGoodsBatch.id }).return(res);
      } catch (err) {
        next(err);
      }
    },
    async updateOnSales(req, res, next) {
      try {
        const {
          stock_permission: stockPermission,
          params: { id: batchId },
          body: { on_sales: onSalesStatus, stock, note }
        } = req;
        const performedUser = { ...stockPermission };
        const query = {
          _id: batchId,
          place_of_stock: { $ne: PlaceOfStock.Transporting },
          $or: [
            { store_id: { $in: stockPermission.store_ids } },
            { warehouse_id: { $in: stockPermission.warehouse_ids } },
            { mall_id: { $in: stockPermission.mall_ids } }
          ]
        };

        const updatedGoodsBatch = await transactionHelper.withSession(async (session) => {
          // Check if goods batch exists or not
          const batchDoc = await goodsBatchService.findOneActive(query, null, {
            session,
            populate: 'product store warehouse mall'
          });
          if (!batchDoc) {
            throw new BaseError({
              statusCode: 404,
              error: errorCode.client,
              errors: { goods_batch_id: errorCode['client.goodsBatchNotFound'] }
            });
          }
          const { updatedGoodsBatch: goodsBatch } = await goodsBatchHandler.updateOnSalesStatus(
            { batchDoc, onSales: onSalesStatus, stock, note, performedUser },
            { session }
          );
          return goodsBatch;
        });

        // CREATE [MALL|COMPANY] ACTIVITY
        const placeOfStock = updatedGoodsBatch.place_of_stock;
        withSafety(() => {
          placeOfStock === PlaceOfStock.Mall
            ? mallActivityService.implicitCreate(MallActions.updateGoodsBatch)(req, {
                object_id: updatedGoodsBatch._id
              })
            : companyActivityService.implicitCreate(CompanyActions.updateGoodsBatch)(req, {
                object_id: updatedGoodsBatch._id
              });
        });

        return new BaseResponse({ statusCode: 200, data: updatedGoodsBatch }).return(res);
      } catch (err) {
        next(err);
      }
    }
  },
  company: {},
  mall: {},
  admin: {
    async getById(req, res, next) {
      try {
        const {
          params: { id: batchId },
          query: { select, populate: populatedStr }
        } = req;
        const { populate } = selectToPopulate(populatedStr, PopulatedFields);
        let goodsBatch = await goodsBatchService.findOne({ _id: batchId }, select, {
          populate
        });
        if (goodsBatch && goodsBatch.model_id) {
          goodsBatch = await goodsBatch.getModel();
        }
        return new BaseResponse({ statusCode: 200, data: goodsBatch }).return(res);
      } catch (err) {
        next(err);
      }
    },
    async get(req, res, next) {
      try {
        const {
          limit,
          page,
          sort,
          select,
          populate: populatedStr,
          out_of_stock,
          ...query
        } = req.query;
        if (typeof out_of_stock === 'boolean') {
          if (out_of_stock) {
            query['$or'] = [
              { on_sales: true, on_sales_stock: { $lte: 0 } },
              { on_sales: false, stock: { $lte: 0 } }
            ];
          } else {
            query['$or'] = [
              { on_sales: true, on_sales_stock: { $gt: 0 } },
              { on_sales: false, stock: { $gt: 0 } }
            ];
          }
        }
        const { populate } = selectToPopulate(populatedStr, PopulatedFields);

        let [goodsBatches, metadata] = await goodsBatchService.findWithPagination({
          page,
          limit,
          select,
          sort,
          populate,
          query
        });
        if (goodsBatches.length) {
          goodsBatches = await Promise.all(
            goodsBatches.map((batch) => (batch.model_id ? batch.getModel() : batch))
          );
        }

        return new BaseResponse({ statusCode: 200, data: goodsBatches })
          .addMeta(metadata)
          .return(res);
      } catch (err) {
        next(err);
      }
    }
  }
};
