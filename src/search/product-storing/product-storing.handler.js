import { Promise } from 'bluebird';
import { BaseError, errorCode, findAdvanced, logger, mergeObject } from '../../commons/utils';
import productStoringModel from './product-storing.model';
import productStockHistoryService from '../product-stock-history/product-stock-history.service';
import productService from '../product/product.service';
import { MovingTypesExtra, CommonPopulatedFields } from '../stock/stock.config';
import productStoringService from './product-storing.service';
import storeService from '../store/store.service';
import companyService from '../company/company.service';
import { DeletedStatus } from './product-storing.config';

const productStoringHandler = {
  async create({ _id, id, ...doc }, performedUser, options = {}) {
    const { session } = options;
    const from = new productStoringModel(doc).save({ session });

    if (from.stock > 0) {
      const rawHistory = {
        company_id: from.company_id,
        from_store_id: from.store_id,
        products: [
          {
            id: from.product_id,
            from_product_storing_id: from._id,
            from_delta_quantity: from.stock
          }
        ],
        performed_by: performedUser._id,
        type: 'import',
        relate_to: 'store'
      };
      await productStockHistoryService.create(rawHistory, { session });
    }

    return from;
  },
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
      ...dataToCreate
    } = data;

    // Check if product storing exists or not
    const { store_id, product_id, company_id } = dataToCreate;
    const query =
      product_storing_id || store_storing_id
        ? { _id: product_storing_id || store_storing_id, status: { $ne: DeletedStatus } }
        : {
            product_id,
            company_id,
            store_id,
            status: { $ne: DeletedStatus }
          };
    let [productStoring, store] = await Promise.all([
      productStoringService.findOne(query, null, {
        session,
        populate
      }),
      storeService.findOne({ _id: store_id }, null, { session })
    ]);
    if (!productStoring.store) {
      productStoring.store = store;
    }

    // Create new one or update product storing
    let productStoringSnapshot = null;
    if (!productStoring && create) {
      [productStoring, store, product] = await Promise.all([
        new productStoringModel(dataToCreate).save({
          session
        }),
        productStoringService.updateOneByPromotion({ productStoring }), // Pass option { session } to this func as soon as possible
        storeService.updateOneByPromotion(store), // Pass option { session } to this func as soon as possible
        storeService.updateProductCount(store_id) // Pass option { session } to this func as soon as possible
      ]);
    } else if (update && productStoring) {
      productStoringSnapshot = productStoring.toObject();
      productStoring.is_limited_stock && (productStoring.stock += dataToCreate.stock);
      await Promise.all([
        productStoring.save({ session }),
        productStoringService.updateOneByPromotion({ productStoring }), // Pass option { session } to this func as soon as possible
        storeService.updateOneByPromotion(productStoring.store) // Pass option { session } to this func as soon as possible
      ]);
    }

    return {
      productStoring,
      productStoringSnapshot,
      storeStoring: productStoring,
      storeStoringSnapshot: productStoringSnapshot
    };
  },
  // TODO: Rename this func's name into getProduct later
  async getProductFromStore({ storeId, companyId, productId }, doc = {}, options = {}) {
    const { session } = options;
    let productStoring = await productStoringService.findOne(
      { company_id: companyId, store_id: storeId, product_id: productId },
      null,
      { session }
    );
    if (productStoring) {
      return productStoring;
    }

    // Check if one of [store, company, product] is not found
    const [store, company, product] = await Promise.all([
      storeService.findOne({ _id: storeId }, null, { session }),
      companyService.findOne({ _id: companyId }, null, { session }),
      productService.findOne({ _id: productId }, null, { session })
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
    const { _id, id, ...productData } = product.toObject();
    const dataToCreate = {
      ...productData,
      store_id: storeId,
      company_id: companyId,
      product_id: productId,
      stock: doc.stock || 0,
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
      productStoringService.updateOneByPromotion(productStoring),
      storeService.updateOneByPromotion(store),
      storeService.updateProductCount(storeId, { session })
    ]);

    productStoring.product = undefined;

    return productStoring;
  },
  async getProduct({ storeId, companyId, productId }, doc = {}, options = {}) {
    const { session } = options;
    let productStoring = await productStoringService.findOne(
      { company_id: companyId, store_id: storeId, product_id: productId },
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
      productService.findOne({ _id: productId }, null, { session })
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
    const { _id, id, ...productData } = product.toObject();
    const dataToCreate = {
      ...productData,
      store_id: storeId,
      company_id: companyId,
      product_id: productId,
      stock: doc.stock || 0,
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
      productStoringService.updateOneByPromotion(productStoring),
      storeService.updateOneByPromotion(store),
      storeService.updateProductCount(storeId, { session })
    ]);

    productStoring.product = undefined;

    return productStoring;
  },
  async updateStock(
    data = {
      from: undefined,
      fromId: undefined,
      toId: undefined,
      to: undefined,
      fromDeltaQuantity: 0,
      type: 'import',
      performedUser: undefined,
      user: undefined,
      transactionId: undefined,
      onModel: undefined,
      notes: {},
      note: '',
      needApproved: false
    },
    options = {}
  ) {
    const {
      from,
      fromId,
      toId,
      to,
      fromDeltaQuantity,
      type,
      performedUser,
      user,
      transactionId,
      onModel,
      notes,
      note,
      needApproved
    } = data;
    const { session } = options;

    if (fromDeltaQuantity === 0) {
      return;
    }
    if (!performedUser) {
      throw new BaseError({
        statusCode: 500,
        message: 'UpdateStock: Perform user was not provided'
      });
    }

    let fromStoring;
    if (from) {
      fromStoring = from;
    } else if (fromId) {
      fromStoring = await productStoringModel.findOne({ _id: fromId }, null, { session });
    }

    if (!fromStoring) {
      throw new BaseError({
        statusCode: 500,
        message: 'UpdateStock: Product storing id was not found'
      });
    }
    let toStoring;
    if (to) {
      toStoring = to;
    } else if (toId) {
      toStoring = await productStoringModel.findOne({ _id: toId }, null, { session });
      if (!toStoring) {
        throw new BaseError({
          statusCode: 500,
          message: 'UpdateStock: Product storing id was not found'
        });
      }
    }
    if (toStoring) {
      if (!fromStoring.company_id.equals(toStoring.company_id)) {
        throw new BaseError({
          statusCode: 500,
          message: 'UpdateStock: from store and to store are not in the same company'
        });
      }
    }

    // Cause session aborting if stock is negative
    if (fromStoring.is_limited_stock && fromStoring.stock + fromDeltaQuantity < 0) {
      throw new BaseError({
        statusCode: 403,
        error: errorCode.client,
        errors: {
          stock: errorCode['client.outOfStock']
        }
      });
    }

    // Update stock in fromStoring when is_limited_stock === true && needApproved === false
    const newFrom =
      fromStoring.is_limited_stock && !needApproved
        ? await productStoringModel.findOneAndUpdate(
            {
              _id: fromStoring._id
            },
            { $inc: { stock: fromDeltaQuantity } },
            {
              runValidators: true,
              setDefaultsOnInsert: true,
              new: true,
              populate: [
                { path: 'store', select: 'name' },
                { path: 'product', select: 'name' }
              ],
              session
            }
          )
        : fromStoring;

    // Cause session aborting if stock is negative
    if (newFrom.is_limited_stock && newFrom.stock < 0) {
      throw new BaseError({
        statusCode: 403,
        error: errorCode.client,
        errors: {
          stock: errorCode['client.outOfStock']
        }
      });
    }

    if (toStoring) {
      // only date to_product_storing when user confirm request
      // await toStoring.update({ $inc: { stock: -fromDeltaQuantity } });
    }

    const rawHistory = {
      company_id: fromStoring.company_id,
      from_store_id: fromStoring.store_id,
      to_store_id: toStoring ? toStoring.store_id : undefined,
      products: [
        {
          id: fromStoring.product_id,
          from_product_storing_id: fromStoring._id,
          to_product_storing_id: toStoring ? toStoring._id : undefined,
          from_delta_quantity: fromDeltaQuantity,
          request_move_quantity: type === 'move' ? -fromDeltaQuantity : 0,
          from_storing_snapshot: fromStoring,
          to_storing_snapshot: toStoring
        }
      ],
      performed_by_id: performedUser._id,
      user_id: user ? user._id : undefined,
      type,
      ...(type === 'move' ? { moving_type: MovingTypesExtra.StoreToStore } : {}),
      notes,
      note,
      relate_to: 'store',
      status: type === 'move' ? 'pending' : 'completed',
      transaction_id: transactionId,
      on_model: onModel,
      need_approved: needApproved
    };
    const history = await productStockHistoryService.create(rawHistory, { session });
    return { fromProductStoring: newFrom, toProductStoring: toStoring, stockHistory: history };
  },
  async updateStocksFromOrder(order, performedUser, options = {}) {
    if (!performedUser) {
      throw new BaseError({
        statusCode: 500,
        message: 'UpdateStock: Perform user was not provided'
      });
    }

    if (order.without_product) {
      return [];
    }

    const dataArrToUpdate = order.products.map((product) => ({
      fromId: product._id,
      fromDeltaQuantity: -product.quantity,
      type: 'sell',
      performedUser,
      transactionId: order._id,
      onModel: 's_order'
    }));

    return await Promise.all(dataArrToUpdate.map((data) => this.updateStock(data, options)));
  },
  isPermitted(permissionToCheck, fieldsToCheck = {}) {
    const { userStoreId = '', fromStoreId = '', toStoreId = '', staffType } = fieldsToCheck;

    if (!['request', 'approve', 'confirm', 'update'].includes(permissionToCheck)) {
      return false;
    }
    if (!fromStoreId && !toStoreId) {
      return false;
    }

    const isStoreStaff = [fromStoreId.toString(), toStoreId.toString()].includes(
      userStoreId.toString()
    );
    const hasStockPermission = Array.isArray(staffType) && staffType.includes('store_stock');

    switch (permissionToCheck) {
      case 'request': {
        return isStoreStaff && hasStockPermission;
      }

      case 'confirm': {
        return hasStockPermission && toStoreId.toString() === userStoreId.toString();
      }

      case 'approve': {
        return hasStockPermission && fromStoreId.toString() === userStoreId.toString();
      }

      case 'update': {
        return isStoreStaff && hasStockPermission;
      }

      default:
        return false;
    }
  },
  async getProductList(query, select) {
    return await productService.find({ select, ...query });
  },
  /**
   * @param {{
   *  products: MovedProduct[],
   *  fromStoreId: string,
   *  toStoreId: string,
   *  companyId: string,
   *  needApproved: boolean,
   *  performedUser: object
   * }} dataToHandle
   * @param {object} options
   *
   * @returns {Promise<StockHistory>} stockHistory
   */
  async handleMoveStockRequest(
    { products = [], fromStoreId, toStoreId, companyId, needApproved, performedUser, note },
    options = {}
  ) {
    try {
      const { session } = options;
      // Build populate for fields `from_product_storing`, `to_product_storing`, `product`
      const populate = [...CommonPopulatedFields];

      const transferredProducts = await Promise.map(
        products,
        async ({ id: productId, stock: reqStock }) => {
          const baseQuery = {
            company_id: companyId,
            product_id: productId
          };
          const [fromStoring, toStoring] = await Promise.all([
            productStoringService.findOne({ ...baseQuery, store_id: fromStoreId }, null, {
              session
            }),
            productStoringService.findOne({ ...baseQuery, store_id: toStoreId }, null, {
              session
            })
          ]);
          // Check if any product storing not exist
          if (!fromStoring || !toStoring) {
            throw new BaseError({
              statusCode: 400,
              error: errorCode.client,
              errors: {
                ...(!fromStoring
                  ? { from_store_id: errorCode['client.productNotExistInStore'] }
                  : { to_store_id: errorCode['client.productNotExistInStore'] })
              }
            });
          }
          // Check if stock from fromStoring less than requested stock (in case is_limited_stock === true)
          if (fromStoring.is_limited_stock && fromStoring.stock < reqStock) {
            throw new BaseError({
              statusCode: 400,
              error: errorCode.client,
              errors: { stock: errorCode['client.stockCannotBeNegative'] }
            });
          }

          // Update stock in fromStoring when is_limited_stock === true && needApproved === false
          fromStoring.is_limited_stock && !needApproved
            ? await productStoringModel.findOneAndUpdate(
                {
                  _id: fromStoring._id
                },
                { $inc: { stock: -reqStock } },
                {
                  runValidators: true,
                  setDefaultsOnInsert: true,
                  new: true,
                  session
                }
              )
            : fromStoring;

          const transferredProduct = {
            id: productId,
            from_product_storing_id: fromStoring._id,
            to_product_storing_id: toStoring._id,
            from_delta_quantity: -reqStock,
            request_move_quantity: reqStock,
            from_storing_snapshot: fromStoring,
            to_storing_snapshot: toStoring
          };
          return transferredProduct;
        }
      );

      // Create stock history
      const historyData = {
        products: transferredProducts,
        company_id: companyId,
        from_store_id: fromStoreId,
        to_store_id: toStoreId,
        performed_by_id: performedUser._id,
        type: 'move',
        moving_type: MovingTypesExtra.StoreToStore,
        notes: { request_note: note },
        relate_to: 'store',
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
   *  products: MovedProduct[],
   *  note: string,
   *  status: ApprovedStatus
   *  companyId: string,
   *  stockHistoryId: string,
   *  approvedUser: object
   * }} dataToHandle
   * @param {object} options
   *
   * @returns {Promise<StockHistory>} stockHistory
   */
  async handleMoveStockApprove(
    { products = [], note = '', status, stockHistoryId, stockHistory, companyId, approvedUser },
    options = {}
  ) {
    try {
      const { session } = options;

      let history = null;
      if (stockHistory) {
        history = stockHistory;
      } else if (stockHistoryId) {
        const query = {
          company_id: companyId,
          _id: stockHistoryId,
          status: 'pending',
          type: 'move',
          need_approved: true
        };
        history = await productStockHistoryService.findOne(query, null, {
          populate: [...CommonPopulatedFields],
          session
        });

        if (!history) {
          throw new BaseError({
            statusCode: 404,
            error: errorCode.client,
            errors: { product_stock_history_id: errorCode['client.stockHistoryNotFound'] },
            message: 'the request not found or approved'
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
        async ({ fromStoringId, toStoringId, requestMoveQuantity: reqStock, status }, index) => {
          let [fromStoring, toStoring] = await Promise.all([
            productStoringService.findOne({ _id: fromStoringId }, null, {
              session
            }),
            productStoringService.findOne({ _id: toStoringId }, null, {
              session
            })
          ]);

          // Check if stock from fromStoring less than requested stock (in case is_limited_stock === true)
          if (
            status === 'approved' &&
            fromStoring.is_limited_stock &&
            fromStoring.stock < reqStock
          ) {
            throw new BaseError({
              statusCode: 400,
              error: errorCode.client,
              errors: { stock: errorCode['client.stockCannotBeNegative'] }
            });
          }

          history.products[index].from_storing_snapshot = fromStoring;
          history.products[index].to_storing_snapshot = toStoring;

          // This vars to check if product stock from/to store is limited.
          const isFromLimitedStock = fromStoring.is_limited_stock;

          // Handle the move request
          history.products[index].status = status;

          // Only update stock when ...
          if (status === 'approved' && isFromLimitedStock) {
            fromStoring = await productStoringService.update(
              { _id: fromStoringId },
              {
                $inc: { stock: -reqStock }
              },
              { session }
            );
          }
          history.products[index].from_product_storing = fromStoring;
          history.products[index].to_product_storing = toStoring;

          return fromStoring;
        }
      );

      // Update history
      history.approved_by_id = approvedUser._id;
      history.notes.approve_note = note;
      history.status = 'cancelled';
      if (history.products.some((product) => product.status === 'approved')) {
        history.status = 'approved';
      }
      history = await productStockHistoryService.saveAndPopulate(history, {
        populate: [...CommonPopulatedFields],
        session
      });

      return history;
    } catch (err) {
      throw err;
    }
  },
  /**
   * @param {{
   *  note: string,
   *  status: ConfirmedStatus
   *  products: MovedProduct[],
   *  companyId: string,
   *  stockHistoryId: string,
   *  handledUser: object
   * }} dataToHandle
   * @param {object} options
   *
   * @returns {Promise<StockHistory>} stockHistory
   */
  async handleMoveStockConfirm(
    { note = '', products = [], status, stockHistoryId, stockHistory, companyId, handledUser },
    options = {}
  ) {
    try {
      const { session } = options;

      let history = null;
      if (stockHistory) {
        history = stockHistory;
      } else if (stockHistoryId) {
        const query = {
          company_id: companyId,
          _id: rawBody.product_stock_history_id,
          $or: [{ status: 'pending', need_approved: false }, { status: 'approved' }]
        };
        history = await productStockHistoryService.findOne(query, null, {
          populate: [...CommonPopulatedFields],
          session
        });

        if (!history) {
          throw new BaseError({
            statusCode: 404,
            error: errorCode.client,
            errors: { product_stock_history_id: errorCode['client.stockHistoryNotFound'] },
            message: 'the request not found or need to be approved first'
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
          {
            fromStoringId,
            toStoringId,
            prevStatus,
            status,
            requestMoveQuantity,
            fromDeltaQuantity
          },
          index
        ) => {
          let [fromStoring, toStoring] = await Promise.all([
            productStoringService.findOne({ _id: fromStoringId }, null, {
              session
            }),
            productStoringService.findOne({ _id: toStoringId }, null, {
              session
            })
          ]);

          history.products[index].from_storing_snapshot = fromStoring;
          history.products[index].to_storing_snapshot = toStoring;

          // This vars to check if product stock from/to store is limited.
          const isFromLimitedStock = fromStoring.is_limited_stock;
          const isToLimitedStock = toStoring.is_limited_stock;

          history.products[index].status = status;
          if (status === 'completed') {
            // no update from store stock now!
            // if (isFromLimitedStock && Math.abs(fromDeltaQuantity) < requestMoveQuantity) {
            //   fromStoring = await productStoringService.update(
            //     { _id: fromStoringId },
            //     {
            //       $inc: { stock: requestMoveQuantity + fromDeltaQuantity }
            //     },
            //     { session }
            //   );
            // }
            if (isToLimitedStock) {
              toStoring = await productStoringService.update(
                { _id: toStoringId },
                {
                  $inc: { stock: -fromDeltaQuantity }
                },
                { session }
              );
            }
          } else if (status === 'cancelled' && prevStatus !== 'cancelled') {
            fromStoring = await productStoringService.update(
              { _id: fromStoringId },
              {
                $inc: { stock: -fromDeltaQuantity }
              },
              { session }
            );
          }
          history.products[index].from_delta_quantity = fromDeltaQuantity;
          history.products[index].from_product_storing = fromStoring;
          history.products[index].to_product_storing = toStoring;

          return [fromStoring, toStoring];
        }
      );

      // Update history
      history.handled_by_id = handledUser._id;
      history.notes.confirm_note = note;
      history.status = 'cancelled';
      if (history.products.some((product) => product.status === 'completed')) {
        history.status = 'completed';
      }
      history = await productStockHistoryService.saveAndPopulate(history, {
        session,
        populate: [...CommonPopulatedFields]
      });

      return history;
    } catch (err) {
      throw err;
    }
  }
};

export default productStoringHandler;
