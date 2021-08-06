import { BaseError, errorCode } from '../../../commons/utils';
import productService from '../../product/product.service';
import mallStoringService from './mall-storing.service';
import mallService from '../mall/mall.service';
import mallStoringModel from './mall-storing.model';
import { DeletedStatus } from './mall-storing.config';

export default {
  async createOrUpdateStock(data, options = {}) {
    const { session, populate, create = true, update = true } = options;
    const { _id, id, mall_storing_id, __v, updatedAt, createdAt, status, ...dataToCreate } = data;

    // Check if mall storing exists or not
    const { mall_id, product_id } = dataToCreate;
    const query = mall_storing_id
      ? { _id: mall_storing_id, status: { $ne: DeletedStatus } }
      : {
          product_id,
          mall_id,
          status: { $ne: DeletedStatus }
        };
    let mallStoring = await mallStoringService.findOne(query, null, { session, populate });
    // Create new one or update mall storing
    let mallStoringSnapshot = null;
    if (!mallStoring && create) {
      mallStoring = await new mallStoringModel(dataToCreate).save({ session });
      // Update total products in warehouse
      await mallService.findOneAndUpdate(
        // Update into findOneActiveAndUpdate later
        { _id: mall_id, status: { $ne: DeletedStatus } },
        { $inc: { total_product: 1, active_product: 1 } }
      );
    } else if (update && mallStoring) {
      mallStoringSnapshot = mallStoring.toObject();
      if (mallStoring.is_limited_stock) {
        mallStoring.batch_stock += dataToCreate.batch_stock || 0;
        mallStoring.on_sales_stock += dataToCreate.on_sales_stock || 0;
        mallStoring.stock = mallStoring.batch_stock + mallStoring.on_sales_stock;
      }
      await mallStoring.save({ session });
    }

    return { mallStoring, mallStoringSnapshot };
  },
  async getProduct({ mallId, productId }, doc = {}, options = {}) {
    const { session } = options;
    let mallStoring = await mallStoringService.findOne(
      { mall_id: mallId, product_id: productId },
      null,
      { session }
    );
    if (mallStoring) {
      return mallStoring;
    }

    // Check if one of [mall, product] is not found
    const [mall, product] = await Promise.all([
      mallService.findOne({ _id: mallId }, null, { session }),
      productService.findOne({ _id: productId }, null, { session })
    ]);
    const errorData = { errorCode: 404, error: errorCode.client };
    if (!mall) {
      throw new BaseError({
        ...errorData,
        errors: { mall: errorCode['client.mallNotExist'] }
      });
    }
    if (!product) {
      throw new BaseError({
        ...errorData,
        errors: { product: errorCode['client.productNotExist'] }
      });
    }

    // Create new
    const { _id, id, createdAt, updatedAt, ...productData } = product.toObject();
    const dataToCreate = {
      ...productData,
      mall_id: mallId,
      product_id: productId,
      stock: doc.stock || 0,
      is_active_product: product.status === 'approved',
      is_active_mall: mall.status === 'active'
    };

    mallStoring = await mallStoringService.create(dataToCreate, { session });

    return mallStoring;
  }
};
