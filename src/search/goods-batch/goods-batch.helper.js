import { compareDates } from '../../commons/utils/utils';
import warehouseStoringService from '../warehouse-storing/warehouse-storing.service';
import productStoringServiceV2 from '../product-storing/v2/product-storing.service';
import { Statuses, PlaceOfStock } from './goods-batch.config';
import goodsBatchService from './goods-batch.service';
import mallStoringService from '../sum-mall/mall-storing/mall-storing.service';

export default {
  /**
   * @description Check if can merge the source batch to the target batch
   * @param {*} sourceBatch
   * @returns {*} true: Can, otherwise can not
   */
  canMerge(sourceBatch) {
    const targetBatch = this;

    if (!sourceBatch) {
      return false;
    }
    if (targetBatch.status !== Statuses.Active || sourceBatch.status !== Statuses.Active) {
      return false;
    }

    // By [store|warehouse|mall]_id
    const targetBatchPlace = targetBatch.place_of_stock;
    const sourceBatchPlace = sourceBatch.place_of_stock;
    const entity1Id = targetBatch[`${targetBatchPlace}_id`];
    const entity2Id = sourceBatch[`${sourceBatchPlace}_id`];
    if (
      targetBatchPlace !== sourceBatchPlace ||
      targetBatchPlace === PlaceOfStock.Transporting ||
      sourceBatchPlace === PlaceOfStock.Transporting ||
      entity1Id.toString() !== entity2Id.toString()
    ) {
      return false;
    }

    // By product_id
    if (targetBatch.product_id.toString() !== sourceBatch.product_id.toString()) {
      return false;
    }

    // By provider_id
    if (targetBatch.provider_id.toString() !== sourceBatch.provider_id.toString()) {
      return false;
    }

    // By manufacturing_date, expiry_date
    if (
      compareDates(targetBatch.manufacturing_date, sourceBatch.manufacturing_date) ||
      compareDates(targetBatch.expiry_date, sourceBatch.expiry_date)
    ) {
      return false;
    }

    return true;
  },
  /**
   * @description Merge the source batch to the target batch
   * @param {*} sourceBatch
   * @returns {*} merged batch
   */
  mergeBatch(sourceBatch) {
    const targetBatch = this;
    targetBatch.stock += sourceBatch.stock;
    targetBatch.notes = [...targetBatch.notes, ...sourceBatch.notes];
    targetBatch.sold += sourceBatch.sold;
    targetBatch.exported += sourceBatch.exported;

    return targetBatch;
  },
  findCanMergedBatch(extraQuery) {
    const exQuery = extraQuery || {};
    if (this.status !== Statuses.Active || this.place_of_stock === PlaceOfStock.Transporting) {
      return null;
    }
    // Fields used for matching --
    const place_of_stock = this.place_of_stock;
    const entityId = this[`${place_of_stock}_id`];
    const product_id = this.product_id;
    const stock_keeping_unit = this.stock_keeping_unit;
    const provider_id = this.provider_id;
    const MFG = this.manufacturing_date;
    const mfg_date = new Date(MFG).toISOString().split('T')[0];
    const EXP = this.expiry_date;
    const exp_date = new Date(EXP).toISOString().split('T')[0];
    // --

    return goodsBatchService.findOneActive({
      product_id,
      provider_id,
      stock_keeping_unit,
      mfg_date,
      exp_date,
      place_of_stock,
      [`${place_of_stock}_id`]: entityId,
      $and: [{ expiry_date: { $gt: new Date() } }],
      ...exQuery
    });
  },
  async getModel() {
    if (!this.model_id) {
      return null;
    }
    let storing = null;
    if (this.warehouse_storing_id) {
      storing = await warehouseStoringService.findOne({ _id: this.warehouse_storing_id });
    } else if (this.product_storing_id) {
      storing = await productStoringServiceV2.findOne({ _id: this.product_storing_id });
    } else {
      storing = await mallStoringService.findOne({ _id: this.mall_storing_id });
    }
    if (storing) {
      const model = storing.model_list.find((m) => m.model_id === this.model_id.toString());
      return { model, ...this.toObject() };
    }

    return this;
  }
};
