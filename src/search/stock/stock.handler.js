import { Promise } from 'bluebird';
import productService from '../product/product.service';
import productStoringService from '../product-storing/product-storing.service';
import productStockHistoryService from '../product-stock-history/product-stock-history.service';
import { BaseError, logger, errorCode } from '../../commons/utils';
import {
  MovingTypes,
  CommonPopulatedFields,
  ApprovePermission,
  RequestPermission,
  ConfirmPermission,
  UpdateStockPermission
} from './stock.config';
import notificationService from '../notification/notification.service';
import productStoringHandler from '../product-storing/product-storing.handler';

export default {
  /**
   * @param {Permission} permissionToCheck
   * @param {{
   *    moving_type: MovingType,
   *    user_store_id: string,
   *    from_store_id: string,
   *    to_store_id: string,
   *    staff_type: StaffType[]
   * }} fieldsToCheck
   * @returns {boolean} Indicates if user has permission to perform the action.
   */
  isPermitted(permissionToCheck, fieldsToCheck = {}) {
    const {
      moving_type,
      user_store_id = '',
      from_store_id = '',
      to_store_id = '',
      staff_type
    } = fieldsToCheck;
    if (
      !['request', 'approve', 'confirm', 'update'].includes(permissionToCheck) ||
      (permissionToCheck !== 'update' && !Object.values(MovingTypes).includes(moving_type))
    ) {
      return false;
    }
    const userStoreId = user_store_id.toString();
    const fromStoreId = from_store_id.toString();
    const toStoreId = to_store_id.toString();

    // Check if user is staff of from/to_store
    const isStoreStaff =
      moving_type === MovingTypes.StockToStore
        ? userStoreId === toStoreId
        : userStoreId === fromStoreId;

    switch (permissionToCheck) {
      case 'request': {
        const hasReqPermission =
          Array.isArray(staff_type) &&
          staff_type.some((t) => RequestPermission[moving_type].includes(t));
        return moving_type === MovingTypes.StockToStore
          ? hasReqPermission
          : hasReqPermission && isStoreStaff;
      }

      case 'confirm': {
        const hasConPermission =
          Array.isArray(staff_type) &&
          staff_type.some((t) => ConfirmPermission[moving_type].includes(t));
        return moving_type === MovingTypes.StockToStore
          ? hasConPermission && isStoreStaff
          : hasConPermission;
      }

      case 'approve': {
        const hasAppPermission =
          Array.isArray(staff_type) && staff_type.some((t) => ApprovePermission.includes(t));
        return hasAppPermission;
      }

      case 'update': {
        const hasUpPermission =
          Array.isArray(staff_type) && staff_type.some((t) => UpdateStockPermission.includes(t));
        return hasUpPermission;
      }

      default:
        return false;
    }
  },
  /**
   * @params {{
type: StaffType[]
is_owner: boolean
}} userRequested
   * @params {MovingType} movingType
   * @returns boolean
   * @param userRequested
   * @param movingType
   */
  needApproved(userRequested = {}, movingType) {
    const { staffTypes = [], isOwner = false } = userRequested;
    if (isOwner || staffTypes.includes('company_stock')) {
      return false;
    }

    return movingType === MovingTypes.StockToStore;
  },
  requesterTypesOf(userRequested = {}) {
    const { type = [], is_owner = false } = userRequested;
    const types = [];

    if (is_owner) {
      return ['stock', 'store'];
    }

    if (type.includes('company_stock')) {
      types.push('stock');
    }
    if (type.includes('store_stock')) {
      types.push('store');
    }

    return types;
  },
  /**
   * @param {{
   *    movingType: MovingType,
   *    products: MovedProduct[],
   *    storeId: string,
   *    companyId: string,
   *    note: string,
   *    performedBy: object,
   *    requesterType: RequesterType
   * }} fields
   * @param {*} options
   * @returns {Promise<StockHistory>}
   */
  async handleMoveStockRequest(fields = {}, options = {}) {
    try {
      const {
        movingType,
        products,
        storeId,
        companyId,
        note: reqNote,
        performedUser,
        requesterType,
        needApproved = false
      } = fields;
      const { session } = options;
      const populate = [...CommonPopulatedFields];

      const transferredProducts = await Promise.map(
        products,
        async ({ id: productId, stock: reqStock }) => {
          const baseQuery = {
            company_id: companyId,
            product_id: productId
          };

          let fromStoring = null;
          let toStoring = null;
          let productFromStock = null;

          [fromStoring, toStoring, productFromStock] = await Promise.all([
            movingType === MovingTypes.StoreToStock
              ? productStoringService.findOne({ ...baseQuery, store_id: storeId }, null, {
                  session
                })
              : '',
            movingType === MovingTypes.StockToStore
              ? productStoringService.findOne({ ...baseQuery, store_id: storeId }, null, {
                  session
                })
              : '',
            productService.findOne(
              { _id: baseQuery.product_id, company_id: baseQuery.company_id },
              null,
              { session }
            )
          ]);

          // Check if product from stock not exist
          if (!productFromStock) {
            throw new BaseError({
              statusCode: 404,
              error: errorCode.client,
              errors: {
                product_id: errorCode['client.productNotExist']
              }
            });
          }
          // Get transferredProduct info
          const transferredProduct = {
            id: productId,
            from_delta_quantity: -reqStock,
            request_move_quantity: reqStock
          };

          // Check if (from) product storing not exist or stock from store less than requested stock
          if (movingType === MovingTypes.StoreToStock) {
            if (!fromStoring) {
              throw new BaseError({
                statusCode: 404,
                error: errorCode.client,
                errors: {
                  from_product_storing: errorCode['client.productNotExistInStore']
                }
              });
            } else if (fromStoring.is_limited_stock && fromStoring.stock < reqStock) {
              throw new BaseError({
                statusCode: 400,
                error: errorCode.client,
                errors: { stock: errorCode['client.stockCannotBeNegative'] },
                message: 'remain quantity in store is not enough to transfer'
              });
            }
            // Merge from_storing_snapshot
            transferredProduct.from_storing_snapshot = fromStoring;

            // Update stock in fromStoring when is_limited_stock === true && needApproved === false
            if (fromStoring.is_limited_stock && !needApproved) {
              fromStoring = await productStoringService.update(
                {
                  _id: fromStoring._id
                },
                { $inc: { stock: -reqStock } },
                {
                  session
                }
              );
            }
            transferredProduct.from_product_storing_id = fromStoring._id;
          }

          // Create new product at store if not exist
          if (movingType === MovingTypes.StockToStore) {
            // Check if product stock less than requested stocks
            if (productFromStock.is_limited_stock && productFromStock.stock < reqStock) {
              throw new BaseError({
                statusCode: 400,
                error: errorCode.client,
                errors: { stock: errorCode['client.stockCannotBeNegative'] },
                message: 'remain quantity in stock is not enough to transfer'
              });
            }
            // Update quantity in stock when is_limited_stock === true && needApproved === false
            if (productFromStock.is_limited_stock && !needApproved) {
              productFromStock = await productService.findOneAndUpdate(
                {
                  _id: productId
                },
                { $inc: { stock: -reqStock } },
                {
                  runValidators: true,
                  setDefaultsOnInsert: true,
                  new: true,
                  session
                }
              );
            }
            // Merge to_storing_snapshot, to_product_storing
            transferredProduct.to_storing_snapshot = toStoring;
            if (!toStoring) {
              toStoring = await productStoringHandler.getProductFromStore(
                { storeId, companyId, productId },
                { stock: reqStock },
                { session }
              );

              // Merge to_storing_snapshot, to_product_storing
              transferredProduct.to_storing_snapshot = toStoring;
              transferredProduct.to_storing_snapshot.stock = 0;
            }
            transferredProduct.to_product_storing_id = toStoring._id;
          }

          transferredProduct.product = {};
          CommonPopulatedFields[0].select.split(' ').forEach((field) => {
            transferredProduct.product[field] = productFromStock[field];
          });

          return transferredProduct;
        }
      );

      // Create stock history
      const historyData = {
        products: transferredProducts,
        company_id: companyId,
        performed_by_id: performedUser._id,
        type: 'move',
        moving_type: movingType,
        ...(movingType === MovingTypes.StockToStore
          ? { to_store_id: storeId }
          : { from_store_id: storeId }),
        notes: { request_note: reqNote || '' },
        relate_to: 'both',
        requester_type: requesterType,
        status: 'pending',
        need_approved: needApproved
      };
      const stockHistory = await productStockHistoryService.createAndPopulate(
        historyData,
        populate,
        { session }
      );

      return stockHistory;
    } catch (err) {
      throw err;
    }
  },

  /**
   * @param {{
   *    stockHistory: object,
   *    stockHistoryId: string,
   *    handledUser: object,
   *    products: MovedProduct[],
   *    note: string,
   *    status: Status
   * }} fields
   * @param {*} options
   * @returns {Promise<StockHistory>}
   */
  async handleMoveStockConfirm(fields = {}, options = {}) {
    const { stockHistory, stockHistoryId, handledUser, products, note, status } = fields;
    const { session } = options;

    let history = null;
    if (stockHistory) {
      history = stockHistory;
    } else if (stockHistoryId) {
      const query = {
        company_id: companyId,
        _id: stockHistoryId,
        type: 'move',
        moving_type: { $in: Object.values(MovingTypes) },
        $or: [{ status: 'pending', need_approved: false }, { status: 'approved' }]
      };
      history = await productStockHistoryService.findOne(query, null, {
        populate: CommonPopulatedFields,
        session
      });

      if (!history) {
        throw new BaseError({
          statusCode: 404,
          error: errorCode.client,
          errors: { product_stock_history_id: errorCode['client.stockHistoryNotFound'] },
          message: 'the request not found or needs to be approved first'
        });
      }
    }

    // Format data to handle confirm move stock
    const transferredProducts = status
      ? history.products.map((productFromHistory) => ({
          productId: productFromHistory.id,
          fromStoringId: productFromHistory.from_product_storing_id,
          toStoringId: productFromHistory.to_product_storing_id,
          requestMoveQuantity: productFromHistory.request_move_quantity,
          fromDeltaQuantity: productFromHistory.from_delta_quantity,
          prevStatus: productFromHistory.status,
          status: productFromHistory.status !== 'cancelled' ? status : productFromHistory.status
        }))
      : history.products.map((productFromHistory) => {
          const data = {
            productId: productFromHistory.id,
            fromStoringId: productFromHistory.from_product_storing_id,
            toStoringId: productFromHistory.to_product_storing_id,
            requestMoveQuantity: productFromHistory.request_move_quantity,
            fromDeltaQuantity: productFromHistory.from_delta_quantity,
            prevStatus: productFromHistory.status
          };
          const isIncluded = products.find(
            (product) => product.id.toString() === productFromHistory.id.toString()
          );
          data.fromDeltaQuantity =
            isIncluded && isIncluded.status !== 'cancelled' && data.prevStatus !== 'cancelled'
              ? -Math.min(
                  isIncluded.stock || productFromHistory.request_move_quantity,
                  productFromHistory.request_move_quantity
                )
              : productFromHistory.from_delta_quantity;
          data.status = data.prevStatus;
          if (data.status !== 'cancelled') {
            data.status = isIncluded ? isIncluded.status : 'completed';
          }
          return data;
        });

    // Handle confirm the request
    await Promise.map(
      transferredProducts,
      async (
        { productId, prevStatus, status, requestMoveQuantity, fromDeltaQuantity, ...transProduct },
        index
      ) => {
        const movingType = history.moving_type;
        // This var to include either of `from`, `to`, help reduce redundant code
        const direction = movingType === MovingTypes.StoreToStock ? 'from' : 'to';
        let productStoring = await productStoringService.findOne(
          { _id: transProduct[`${direction}StoringId`] },
          null,
          { session }
        );

        // Merge new [from/to]_product_storing_snapshot
        history.products[index][`${direction}_storing_snapshot`] = productStoring;

        history.products[index].status = status;
        if (status === 'completed') {
          if (movingType === MovingTypes.StoreToStock) {
            // Checked is_limited_stock in  service .updateStock!
            await productService.updateStock(productId, -fromDeltaQuantity, {
              session
            });
          } else {
            await productStoringService.update(
              { _id: transProduct.toStoringId, is_limited_stock: true },
              { $inc: { stock: -fromDeltaQuantity } },
              { session }
            );
          }
        } else if (status === 'cancelled' && prevStatus !== 'cancelled') {
          if (movingType === MovingTypes.StockToStore) {
            // Checked is_limited_stock in  service .updateStock!
            await productService.updateStock(productId, -fromDeltaQuantity, {
              session
            });
          } else {
            await productStoringService.update(
              { _id: transProduct.fromStoringId, is_limited_stock: true },
              { $inc: { stock: -fromDeltaQuantity } },
              { session }
            );
          }
        }
        history.products[index].from_delta_quantity = fromDeltaQuantity;

        return 'nothing';
      }
    );

    // Update history
    history.handled_by_id = handledUser._id;
    history.notes.confirm_note = note;
    history.status = 'cancelled';
    if (history.products.some((product) => product.status === 'completed')) {
      history.status = 'completed';
    }

    return await productStockHistoryService.saveAndPopulate(history, {
      session,
      populate: CommonPopulatedFields
    });
  },

  /**
   * @param {{
   *    stockHistory: object,
   *    stockHistoryId: string,
   *    approvedUser: object,
   *    products: MovedProduct[],
   *    note: string,
   *    status: Status
   * }} fields
   * @param {*} options
   * @returns {Promise<StockHistory>}
   */
  async handleMoveStockApprove(fields = {}, options = {}) {
    const { stockHistory, stockHistoryId, approvedUser, products, note, status } = fields;
    const { session } = options;

    let history = null;
    if (stockHistory) {
      history = stockHistory;
    } else if (stockHistoryId) {
      const query = {
        company_id: companyId,
        _id: stockHistoryId,
        type: 'move',
        moving_type: { $in: Object.values(MovingTypes) },
        need_approved: true,
        status: 'pending'
      };
      history = await productStockHistoryService.findOne(query, null, {
        populate: CommonPopulatedFields,
        session
      });

      if (!history) {
        throw new BaseError({
          statusCode: 404,
          error: errorCode.client,
          errors: { product_stock_history_id: errorCode['client.stockHistoryNotFound'] },
          message: 'the request not found or not able to approve now'
        });
      }
    }

    // Format data to handle approve move stock
    const transferredProducts = status
      ? history.products.map((productFromHistory) => ({
          productId: productFromHistory.id,
          fromStoringId: productFromHistory.from_product_storing_id,
          toStoringId: productFromHistory.to_product_storing_id,
          requestMoveQuantity: productFromHistory.request_move_quantity,
          fromDeltaQuantity: productFromHistory.from_delta_quantity,
          status
        }))
      : history.products.map((productFromHistory) => {
          const data = {
            productId: productFromHistory.id,
            fromStoringId: productFromHistory.from_product_storing_id,
            toStoringId: productFromHistory.to_product_storing_id,
            requestMoveQuantity: productFromHistory.request_move_quantity,
            fromDeltaQuantity: productFromHistory.from_delta_quantity
          };
          const isIncluded = products.find(
            (product) => product.id.toString() === productFromHistory.id.toString()
          );
          // data.fromDeltaQuantity =
          //   isIncluded && isIncluded.status !== 'cancelled'
          //     ? -Math.min(
          //         isIncluded.stock || productFromHistory.request_move_quantity,
          //         productFromHistory.request_move_quantity
          //       )
          //     : productFromHistory.from_delta_quantity;
          data.status = isIncluded ? isIncluded.status : 'approved';
          return data;
        });

    // Handle approve the request
    await Promise.map(
      transferredProducts,
      async (
        { productId, status, requestMoveQuantity, fromDeltaQuantity, ...transProduct },
        index
      ) => {
        const movingType = history.moving_type;
        // This var to include either of `from`, `to`, help reduce redundant code
        const direction = movingType === MovingTypes.StoreToStock ? 'from' : 'to';
        let productStoring = await productStoringService.findOne(
          { _id: transProduct[`${direction}StoringId`] },
          null,
          { session }
        );

        // Merge new [from/to]_product_storing_snapshot
        history.products[index][`${direction}_storing_snapshot`] = productStoring;

        history.products[index].status = status;
        if (status === 'approved') {
          if (movingType === MovingTypes.StockToStore) {
            // Checked is_limited_stock in  service .updateStock!
            await productService.updateStock(productId, fromDeltaQuantity, {
              session
            });
          } else {
            await productStoringService.update(
              { _id: transProduct.fromStoringId, is_limited_stock: true },
              { $inc: { stock: fromDeltaQuantity } },
              { session }
            );
          }
        } else if (status === 'cancelled') {
          // do nothing
        }
        history.products[index].from_delta_quantity = fromDeltaQuantity;

        return 'nothing';
      }
    );

    // Update history
    history.approved_by_id = approvedUser._id;
    history.notes.approve_note = note;
    history.status = 'cancelled';
    if (history.products.some((product) => product.status === 'approved')) {
      history.status = 'approved';
    }

    return await productStockHistoryService.saveAndPopulate(history, {
      session,
      populate: CommonPopulatedFields
    });
  },

  /**
   * @param {{
   *    type: UpdateType,
   *    productsToUpdate: object[],
   *    companyId: string
   *    performedUser: object
   *    note: string
   * }} fields
   * @param {*} options
   * @returns {Promise<object[]>}
   */
  async handleUpdateStock(fields = {}, options = {}) {
    const { type, productsToUpdate, companyId, performedUser, provider, note } = fields;
    const { session } = options;

    // Get products first (ensure the order)
    const products = await Promise.all(
      productsToUpdate.map(({ id: product_id }) =>
        productService.findOne({ _id: product_id, company_id: companyId }, null, { session })
      )
    );

    // Check if any product not exist
    const notFoundIdx = products.findIndex((product) => !product);
    if (notFoundIdx !== -1) {
      throw new BaseError({
        statusCode: 404,
        error: errorCode.client,
        errors: {
          product: errorCode.client['productNotExist']
        },
        message: `product_id ${productsToUpdate[notFoundIdx].id} not found`
      });
    }

    // Then, update them
    const results = await Promise.all(
      products.map((product, index) => {
        if (product.is_limited_stock) {
          let { stock: stockToUpdate } = productsToUpdate[index];
          type === 'export' && (stockToUpdate *= -1);

          // Check if stock to export is greater than stock in warehouse (in case type === export)
          if (product.stock < -stockToUpdate) {
            throw new BaseError({
              statusCode: 400,
              error: errorCode.client,
              errors: {
                stock_to_update: errorCode.client['stockCannotBeNegative']
              }
            });
          }

          // Update stock
          product.stock += stockToUpdate;
          return product.save();
        }
        return product;
      })
    );
    // Create product stock history
    const historyProducts = results.map(({ _id: id }, index) => ({
      id,
      from_delta_quantity: productsToUpdate[index].stock,
      status: 'completed'
    }));
    const dataToCreate = {
      products: historyProducts,
      company_id: companyId,
      type,
      performed_by_id: performedUser._id,
      requester_type: 'stock',
      relate_to: 'stock',
      note: note || '',
      provider
    };

    await productStockHistoryService.create(dataToCreate, { session });

    return results;
  },

  /**
   * This func used in handleMoveStockConfirm. Do not use in anywhere else!
   *
   * @param options
   */
  async updateStockByMovingType(
    {
      type = 'request',
      moving_type = 'stock_to_store',
      product_id,
      product_storing_id,
      stock_to_update
    },
    options = {}
  ) {
    const { session } = options;

    if (type === 'request') {
      return moving_type === MovingTypes.StockToStore
        ? await productService.updateStock(product_id, stock_to_update, { session })
        : await productStoringService.update(
            { _id: product_storing_id },
            { $inc: { stock: stock_to_update } },
            { session }
          );
    } else if (type === 'confirm') {
      return moving_type === MovingTypes.StoreToStock
        ? await productService.updateStock(product_id, stock_to_update, { session })
        : await productStoringService.update(
            { _id: product_storing_id },
            { $inc: { stock: stock_to_update } },
            { session }
          );
    }
    throw new Error('update stock by moving type error');
  },

  /**
   * This func need product_stock_history as argument.
   * the argument need to be populated ['from_store', 'to_store', 'product', 'handled_by'] first
   */
  async handleNotification({ history, performed_by, handled_by, approved_by, ...rest }) {
    const { exclude_ids = [] } = rest;
    const {
      _id: history_id,
      from_store,
      to_store,
      status,
      moving_type,
      company_id,
      notes
    } = history;
    const userRequested = performed_by;
    const userApproved = approved_by;
    const userHandled = handled_by;

    const store = to_store || from_store;
    let from = 'kho tổng';
    let to = 'cửa hàng ' + store.name;
    moving_type === MovingTypes.StoreToStock && ([from, to] = [to, from]);

    if (status === 'pending') {
      notificationService.getStaffAndSend({
        company_id,
        store_id: store._id,
        staff_type: ['store_stock', 'company_stock'],
        title: 'Yêu cầu chuyển kho',
        message: `${
          userRequested.name
        } đã yêu cầu chuyển ${history.total_request_stocks.toLocaleString(
          'vi-VN'
        )} sản phẩm từ ${from} đến ${to}`,
        type: 'company_move_stock_request',
        onModel: 's_product_stock_history',
        object_id: history_id,
        exclude_ids
      });
    } else {
      const notifData = {
        company_id,
        staff_type: ['store_stock', 'company_stock'],
        type: 'company_move_stock_finished',
        onModel: 's_product_stock_history',
        object_id: history_id,
        exclude_ids
      };
      if (status === 'cancelled') {
        notifData.title = 'Yêu cầu chuyển kho bị từ chối';
        notifData.message = `${
          (userHandled || userApproved).name
        } đã từ chối yêu cầu chuyển ${history.total_request_stocks.toLocaleString(
          'vi-VN'
        )} sản phẩm từ ${from} đến ${to} \n ${notes.confirm_note || notes.approve_note || ''}`;
      } else if (status === 'completed') {
        notifData.title = 'Chuyển kho thành công';
        notifData.message = `Đã chuyển ${history.total_moved_stocks.toLocaleString(
          'vi-VN'
        )} sản phẩm từ ${from} đến ${to} (${(
          history.total_request_stocks - history.total_moved_stocks
        ).toLocaleString('vi-VN')} sản phẩm bị từ chối) \n ${notes.confirm_note || ''}`;
      } else {
        notifData.title = 'Yêu cầu chuyển kho đã được duyệt';
        notifData.message = `Yêu cầu chuyển ${history.total_request_stocks.toLocaleString(
          'vi-VN'
        )} sản phẩm từ ${from} đến ${to} đã được duyệt bởi ${userApproved.name}`;
      }

      notificationService.getStaffAndSend(notifData);
    }
  }
};
