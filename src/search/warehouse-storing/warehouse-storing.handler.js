import { BaseError, errorCode } from '../../commons/utils';
import warehouseStoringService from './warehouse-storing.service';
import warehouseService from '../warehouse/warehouse.service';
import companyService from '../company/company.service';
import productService from '../product/product.service';
import warehouseStoringModel from './warehouse-storing.model';
import { Statuses, DeletedStatus } from './warehouse-storing.config';

export default {
  async createOrUpdateStock(data, options = {}) {
    const { session, populate, create = true, update = true } = options;
    const {
      _id,
      id,
      warehouse_storing_id,
      __v,
      updatedAt,
      createdAt,
      status,
      ...dataToCreate
    } = data;

    // Check if warehouse storing exists or not
    const { warehouse_id, product_id, model_id, company_id } = dataToCreate;
    const query = warehouse_storing_id
      ? { _id: warehouse_storing_id, status: { $ne: DeletedStatus } }
      : {
          product_id,
          company_id,
          warehouse_id,
          status: { $ne: DeletedStatus }
        };
    let warehouseStoring = await warehouseStoringService.findOne(query, null, {
      session,
      populate
    });

    // Create new one or update warehouse storing
    let warehouseStoringSnapshot = null;
    if (!warehouseStoring && create) {
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
      warehouseStoring = await new warehouseStoringModel(dataToCreate).save({ session });
      // Update total products in warehouse
      await warehouseService.findOneActiveAndUpdate(
        { _id: warehouse_id, company_id },
        { $inc: { total_product: 1, active_product: 1 } }
      );
    } else if (update && warehouseStoring) {
      warehouseStoringSnapshot = warehouseStoring.toObject();
      if (warehouseStoring.is_limited_stock) {
        warehouseStoring.batch_stock += dataToCreate.batch_stock || 0;
        warehouseStoring.stock = warehouseStoring.batch_stock + warehouseStoring.on_sales_stock;

        if (model_id) {
          const index = warehouseStoring.model_list.findIndex(
            (model) => model.model_id === model_id.toString()
          );
          console.log(index);
          if (index !== -1) {
            warehouseStoring.model_list[index].on_sales_stock += dataToCreate.on_sales_stock;
            warehouseStoring.model_list[index].batch_stock += dataToCreate.batch_stock;
          }
        } else if (warehouseStoring.model_list[0].name === 'Default') {
          warehouseStoring.model_list[0].on_sales_stock += dataToCreate.on_sales_stock;
          warehouseStoring.model_list[0].batch_stock += dataToCreate.batch_stock;
        }
      }
      await warehouseStoring.save({ session });
    }

    return { warehouseStoring, warehouseStoringSnapshot };
  },
  async getProduct({ warehouseId, companyId, productId }, doc = {}, options = {}) {
    const { session } = options;
    let warehouseStoring = await warehouseStoringService.findOne(
      { company_id: companyId, warehouse_id: warehouseId, product_id: productId },
      null,
      { session }
    );
    if (warehouseStoring) {
      return warehouseStoring;
    }

    // Check if one of [warehouse, company, product] is not found
    const [warehouse, company, product] = await Promise.all([
      warehouseService.findOne({ _id: warehouseId }, null, { session }),
      companyService.findOne({ _id: companyId }, null, { session }),
      productService.findOne({ _id: productId }, null, { session })
    ]);
    const errorData = { errorCode: 404, error: errorCode.client };
    if (!warehouse) {
      throw new BaseError({
        ...errorData,
        errors: { warehouse: errorCode['client.warehouseNotFound'] }
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
      warehouse_id: warehouseId,
      company_id: companyId,
      product_id: productId,
      stock: doc.stock || 0,
      is_active_product: product.status === 'approved',
      is_active_company: company.status === 'approved',
      is_active_warehouse: warehouse.status === 'active'
    };

    warehouseStoring = await warehouseStoringService.create(dataToCreate, { session });

    return warehouseStoring;
  }
};
